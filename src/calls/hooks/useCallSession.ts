import { useEffect, useState } from 'react';
import { callService } from '../services/callService';
import type { CallSession } from '../types/call';

export function useCallSession() {
  const [session, setSession] = useState<CallSession | null>(callService.getSession());
  const [permissionMessage, setPermissionMessage] = useState('');

  useEffect(() => {
    const cleanupSession = callService.on('session', setSession);
    const cleanupFailure = callService.on('failure', setPermissionMessage);

    return () => {
      cleanupSession();
      cleanupFailure();
    };
  }, []);

  return {
    accept: callService.accept.bind(callService),
    end: callService.end.bind(callService),
    permissionMessage,
    reject: callService.reject.bind(callService),
    session,
    switchCamera: callService.switchCamera.bind(callService),
    switchMode: callService.switchMode.bind(callService),
    toggleCamera: callService.toggleCamera.bind(callService),
    toggleMinimized: callService.toggleMinimized.bind(callService),
    toggleMute: callService.toggleMute.bind(callService),
    togglePipPlaceholder: callService.togglePipPlaceholder.bind(callService),
    toggleSpeaker: callService.toggleSpeaker.bind(callService),
  };
}
