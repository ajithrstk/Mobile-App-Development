export const endpoints = {
  auth: {
    login: '/auth/login',
    verifyOtp: '/auth/verify-otp',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  contacts: '/contacts',
  chats: '/chats',
  messages: (chatId: string) => `/chats/${chatId}/messages`,
  sendMessage: (chatId: string) => `/chats/${chatId}/messages/send`,
  updateMessageStatus: (chatId: string, messageId: string) => `/chats/${chatId}/messages/${messageId}/status`,
  chatPreference: (chatId: string) => `/chats/${chatId}/preferences`,
  channels: {
    list: '/channels',
    detail: (channelId: string) => `/channels/${channelId}`,
    follow: (channelId: string) => `/channels/${channelId}/follow`,
    updates: (channelId: string) => `/channels/${channelId}/updates`,
    search: '/channels/search',
  },
  broadcasts: {
    list: '/broadcasts',
    detail: (broadcastId: string) => `/broadcasts/${broadcastId}`,
    send: (broadcastId: string) => `/broadcasts/${broadcastId}/send`,
  },
};
