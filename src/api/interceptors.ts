import { appConfig } from '../config/appConfig';
import { storageKeys } from '../storage/storageKeys';
import { storageService } from '../storage/storageService';
import { ApiError, type ApiRequestConfig, type ApiResponse, type AuthSession } from './types';

export type RequestInterceptor = (config: ApiRequestConfig) => Promise<ApiRequestConfig> | ApiRequestConfig;
export type ResponseInterceptor = <T>(response: ApiResponse<T>) => Promise<ApiResponse<T>> | ApiResponse<T>;
export type ErrorInterceptor = (error: ApiError) => Promise<never> | never;

function createMockAccessToken(): string {
  return `mock-access-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function refreshMockSession(session: AuthSession): Promise<AuthSession> {
  const refreshedSession: AuthSession = {
    ...session,
    tokens: {
      accessToken: createMockAccessToken(),
      expiresAt: new Date(Date.now() + appConfig.authTokenTtlMs).toISOString(),
      refreshToken: session.tokens.refreshToken,
    },
  };

  await storageService.set(storageKeys.authSession, refreshedSession);
  return refreshedSession;
}

export async function attachAuthorizationHeader(config: ApiRequestConfig): Promise<ApiRequestConfig> {
  if (config.requiresAuth === false) {
    return config;
  }

  let session = await storageService.get<AuthSession | null>(storageKeys.authSession, null);

  if (!session) {
    return config;
  }

  if (Date.parse(session.tokens.expiresAt) < Date.now()) {
    session = await refreshMockSession(session);
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${session.tokens.accessToken}`,
    },
  };
}

export function normalizeApiError(error: ApiError): never {
  if (error.code === 'TIMEOUT') {
    throw new ApiError('This is taking longer than expected. Please try again.', 'TIMEOUT', 408, true);
  }

  if (error.code === 'NETWORK_OFFLINE') {
    throw new ApiError('You are offline. The action will sync when you reconnect.', 'NETWORK_OFFLINE', 0, true);
  }

  if (error.code === 'UNAUTHORIZED' || error.code === 'TOKEN_EXPIRED') {
    throw new ApiError('Your session expired. Please sign in again.', error.code, 401, false);
  }

  throw error;
}
