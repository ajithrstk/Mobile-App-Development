export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  requestId: string;
};

export type ApiRequestConfig<Body = unknown> = {
  url: string;
  method?: ApiMethod;
  data?: Body;
  headers?: Record<string, string>;
  timeoutMs?: number;
  requiresAuth?: boolean;
};

export type ApiErrorCode =
  | 'NETWORK_OFFLINE'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'INVALID_OTP'
  | 'TOKEN_EXPIRED'
  | 'NOT_FOUND'
  | 'MOCK_FAILURE'
  | 'STORAGE_FAILURE';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status = 500,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarUri?: string;
  createdAt: string;
};

export type AuthSession = {
  tokens: AuthTokens;
  user: CurrentUser;
};

export type LoginResult = {
  phone: string;
  otp: string;
  expiresAt: string;
};
