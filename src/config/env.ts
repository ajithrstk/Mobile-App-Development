export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'mock://chatterly-api',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'mock://chatterly-socket',
  requestTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 8000),
  mockOtp: process.env.EXPO_PUBLIC_MOCK_OTP ?? '123456',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
