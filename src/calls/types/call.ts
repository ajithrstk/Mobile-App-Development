import type { Chat } from '../../types';

export enum CallMode {
  Voice = 'voice',
  Video = 'video',
}

export enum CallDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

export enum CallState {
  Calling = 'calling',
  Ringing = 'ringing',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Rejected = 'rejected',
  Missed = 'missed',
  Ended = 'ended',
}

export enum NetworkQuality {
  Excellent = 'excellent',
  Good = 'good',
  Poor = 'poor',
  Offline = 'offline',
}

export type BluetoothDevice = {
  id: string;
  name: string;
  connected: boolean;
};

export type CallSession = {
  id: string;
  contact: Chat;
  mode: CallMode;
  direction: CallDirection;
  state: CallState;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  muted: boolean;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  frontCamera: boolean;
  minimized: boolean;
  pipPlaceholderVisible: boolean;
  networkQuality: NetworkQuality;
  bluetoothDevices: BluetoothDevice[];
  localStreamLabel?: string;
  remoteStreamLabel?: string;
};

export type CallLog = {
  id: string;
  contactId: string;
  mode: CallMode;
  direction: CallDirection;
  state: CallState;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};
