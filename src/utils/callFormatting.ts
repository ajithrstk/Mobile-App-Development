import { CallDirection, CallMode, CallState } from '../calls/types/call';

export function formatCallDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function getCallStateLabel(state: CallState): string {
  const labels: Record<CallState, string> = {
    [CallState.Calling]: 'Calling',
    [CallState.Connected]: 'Connected',
    [CallState.Ended]: 'Ended',
    [CallState.Missed]: 'Missed',
    [CallState.Reconnecting]: 'Reconnecting',
    [CallState.Rejected]: 'Rejected',
    [CallState.Ringing]: 'Ringing',
  };

  return labels[state];
}

export function getCallDirectionLabel(direction: CallDirection): string {
  return direction === CallDirection.Incoming ? 'Incoming' : 'Outgoing';
}

export function getCallModeLabel(mode: CallMode): string {
  return mode === CallMode.Video ? 'Video' : 'Voice';
}
