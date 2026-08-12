import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { SimpleEventEmitter, type Unsubscribe } from '../../utils/eventEmitter';
import { logger } from '../../services/logging/logger';
import { ConnectionState, networkManager } from '../../services/network/networkManager';
import type { Chat } from '../../types';
import {
  CallDirection,
  CallMode,
  CallState,
  NetworkQuality,
  type CallLog,
  type CallSession,
} from '../types/call';
import { callHistoryService } from './callHistoryService';

type CallEvents = {
  session: CallSession | null;
  failure: string;
};

type StartCallOptions = {
  contact: Chat;
  mode: CallMode;
  direction: CallDirection;
  callId?: string;
};

class CallService {
  private emitter = new SimpleEventEmitter<CallEvents>();
  private activeSession: CallSession | null = null;
  private connectionTimer?: ReturnType<typeof setTimeout>;
  private durationTimer?: ReturnType<typeof setInterval>;
  private clearEndedTimer?: ReturnType<typeof setTimeout>;
  private ringingTimer?: ReturnType<typeof setTimeout>;
  private networkCleanup?: Unsubscribe;

  on<Key extends keyof CallEvents>(eventName: Key, listener: (payload: CallEvents[Key]) => void): Unsubscribe {
    return this.emitter.on(eventName, listener);
  }

  getSession(): CallSession | null {
    return this.activeSession;
  }

  async startCall(options: StartCallOptions): Promise<CallSession> {
    const permission = await this.requestPermissions(options.mode);

    if (!permission) {
      const message = options.mode === CallMode.Video
        ? 'Camera and microphone permission are required for video calls.'
        : 'Microphone permission is required for voice calls.';
      this.emitter.emit('failure', message);
      throw new Error(message);
    }

    this.cleanupActiveTimers();
    if (this.clearEndedTimer) {
      clearTimeout(this.clearEndedTimer);
      this.clearEndedTimer = undefined;
    }

    const now = new Date().toISOString();
    const session: CallSession = {
      bluetoothDevices: [
        { id: 'phone', name: 'Phone earpiece', connected: true },
        { id: 'bt-placeholder', name: 'Bluetooth device detection', connected: false },
      ],
      cameraEnabled: options.mode === CallMode.Video,
      contact: options.contact,
      direction: options.direction,
      durationSeconds: 0,
      frontCamera: true,
      id: options.callId ?? `call-${Date.now()}`,
      localStreamLabel: options.mode === CallMode.Video ? 'Local camera preview' : 'Local audio stream',
      minimized: false,
      mode: options.mode,
      muted: false,
      networkQuality: NetworkQuality.Good,
      pipPlaceholderVisible: false,
      remoteStreamLabel: options.mode === CallMode.Video ? 'Waiting for remote video' : 'Remote audio stream',
      speakerEnabled: options.mode === CallMode.Video,
      startedAt: options.direction === CallDirection.Incoming ? undefined : now,
      state: options.direction === CallDirection.Incoming ? CallState.Ringing : CallState.Calling,
    };

    this.activeSession = session;
    this.emitSession();
    this.setupNetworkHandling();
    logger.info('Call session started', { callId: session.id, mode: session.mode, direction: session.direction });

    if (options.direction === CallDirection.Outgoing) {
      this.connectionTimer = setTimeout(() => this.connect(), 12000);
    } else {
      this.ringingTimer = setTimeout(() => {
        if (this.activeSession?.state === CallState.Ringing) {
          void this.finish(CallState.Missed);
        }
      }, 30000);
    }

    return session;
  }

  accept(): void {
    if (!this.activeSession) {
      return;
    }

    this.connect();
  }

  reject(): void {
    void this.finish(CallState.Rejected);
  }

  end(): void {
    void this.finish(CallState.Ended);
  }

  toggleMute(): void {
    this.patchSession({ muted: !this.activeSession?.muted });
  }

  toggleSpeaker(): void {
    this.patchSession({ speakerEnabled: !this.activeSession?.speakerEnabled });
  }

  switchMode(mode: CallMode): void {
    if (!this.activeSession || this.activeSession.mode === mode) {
      return;
    }

    this.patchSession({
      cameraEnabled: mode === CallMode.Video,
      localStreamLabel: mode === CallMode.Video ? 'Local camera preview' : 'Local audio stream',
      mode,
      remoteStreamLabel: mode === CallMode.Video ? 'Waiting for remote video' : 'Remote audio stream',
      speakerEnabled: mode === CallMode.Video ? true : this.activeSession.speakerEnabled,
    });
  }

  toggleCamera(): void {
    if (this.activeSession?.mode === CallMode.Video) {
      this.patchSession({ cameraEnabled: !this.activeSession.cameraEnabled });
    }
  }

  switchCamera(): void {
    if (this.activeSession?.mode === CallMode.Video) {
      this.patchSession({ frontCamera: !this.activeSession.frontCamera });
    }
  }

  toggleMinimized(): void {
    this.patchSession({ minimized: !this.activeSession?.minimized });
  }

  togglePipPlaceholder(): void {
    this.patchSession({ pipPlaceholderVisible: !this.activeSession?.pipPlaceholderVisible });
  }

  private async requestPermissions(mode: CallMode): Promise<boolean> {
    const microphonePermission = await Audio.requestPermissionsAsync();

    if (!microphonePermission.granted) {
      return false;
    }

    if (mode === CallMode.Video) {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      return cameraPermission.granted;
    }

    return true;
  }

  private connect(): void {
    if (!this.activeSession) {
      return;
    }

    const startedAt = this.activeSession.startedAt ?? new Date().toISOString();
    this.patchSession({
      remoteStreamLabel: this.activeSession.mode === CallMode.Video ? 'Remote video stream' : 'Remote audio stream',
      startedAt,
      state: CallState.Connected,
    });
    this.startDurationTimer();
  }

  private startDurationTimer(): void {
    if (this.durationTimer) {
      return;
    }

    this.durationTimer = setInterval(() => {
      if (!this.activeSession || this.activeSession.state !== CallState.Connected) {
        return;
      }

      this.patchSession({ durationSeconds: this.activeSession.durationSeconds + 1 });
    }, 1000);
  }

  private setupNetworkHandling(): void {
    this.networkCleanup?.();
    this.networkCleanup = networkManager.on('state', (state) => {
      if (!this.activeSession) {
        return;
      }

      if (state === ConnectionState.Offline) {
        this.patchSession({ networkQuality: NetworkQuality.Offline, state: CallState.Reconnecting });
        return;
      }

      if (state === ConnectionState.Connected && this.activeSession.state === CallState.Reconnecting) {
        this.patchSession({ networkQuality: NetworkQuality.Good, state: CallState.Connected });
      }
    });
  }

  private async finish(state: CallState): Promise<void> {
    if (!this.activeSession) {
      return;
    }

    const endedAt = new Date().toISOString();
    const session = {
      ...this.activeSession,
      endedAt,
      state,
    };

    this.activeSession = session;
    this.emitSession();

    const log: CallLog = {
      contactId: session.contact.id,
      direction: session.direction,
      durationSeconds: session.durationSeconds,
      endedAt,
      id: session.id,
      mode: session.mode,
      startedAt: session.startedAt ?? endedAt,
      state,
    };

    await callHistoryService.add(log);
    logger.info('Call session finished', { callId: session.id, state });
    this.cleanupActiveTimers();
    this.clearEndedTimer = setTimeout(() => {
      this.activeSession = null;
      this.clearEndedTimer = undefined;
      this.emitSession();
    }, 3200);
  }

  private patchSession(patch: Partial<CallSession>): void {
    if (!this.activeSession) {
      return;
    }

    this.activeSession = {
      ...this.activeSession,
      ...patch,
    };
    this.emitSession();
  }

  private emitSession(): void {
    this.emitter.emit('session', this.activeSession);
  }

  private cleanupActiveTimers(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = undefined;
    }

    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = undefined;
    }

    if (this.ringingTimer) {
      clearTimeout(this.ringingTimer);
      this.ringingTimer = undefined;
    }

    this.networkCleanup?.();
    this.networkCleanup = undefined;
  }
}

export const callService = new CallService();
