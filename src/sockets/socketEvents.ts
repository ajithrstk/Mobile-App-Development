export const socketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  reconnectAttempt: 'reconnect_attempt',
  messageSent: 'message:sent',
  messageDelivered: 'message:delivered',
  messageSeen: 'message:seen',
  messageNew: 'message:new',
  userOnline: 'user:online',
  userOffline: 'user:offline',
  typingStart: 'typing:start',
  typingStop: 'typing:stop',
} as const;
