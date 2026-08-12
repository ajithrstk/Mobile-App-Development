import { appConfig } from '../config/appConfig';
import { env } from '../config/env';
import { endpoints } from '../api/endpoints';
import { apiClient } from '../api/client';
import { ApiError, type AuthSession, type CurrentUser, type LoginResult } from '../api/types';
import { storageKeys } from '../storage/storageKeys';
import { storageService } from '../storage/storageService';

export type ProfileSetupInput = {
  name: string;
  about?: string;
  avatarUri?: string;
};

let pendingOtp: LoginResult | null = null;

function normalizePhone(phone: string): string {
  return phone.replace(/[^+\d]/g, '').trim();
}

function randomToken(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function createUser(phone: string, profile?: ProfileSetupInput): CurrentUser {
  return {
    about: profile?.about?.trim() || 'Hey there! I am using Chatterly.',
    avatarUri: profile?.avatarUri,
    createdAt: new Date().toISOString(),
    id: `user-${phone.replace(/\D/g, '').slice(-10) || Date.now()}`,
    name: profile?.name.trim() ?? '',
    phone,
  };
}

function createSession(user: CurrentUser): AuthSession {
  return {
    tokens: {
      accessToken: randomToken('mock-access'),
      expiresAt: new Date(Date.now() + appConfig.authTokenTtlMs).toISOString(),
      refreshToken: randomToken('mock-refresh'),
    },
    user,
  };
}

class AuthService {
  async login(phone: string): Promise<LoginResult> {
    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 8) {
      throw new ApiError('Enter a valid phone number.', 'MOCK_FAILURE', 400, false);
    }

    const otp = env.mockOtp || String(Math.floor(100000 + Math.random() * 900000));
    const result: LoginResult = {
      expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      otp,
      phone: normalizedPhone,
    };

    await apiClient.request<LoginResult>({ data: result, method: 'POST', requiresAuth: false, url: endpoints.auth.login });
    pendingOtp = result;
    return result;
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthSession> {
    if (!pendingOtp || pendingOtp.phone !== normalizePhone(phone) || pendingOtp.otp !== otp.trim()) {
      throw new ApiError('The OTP is invalid. Use 123456 in mock mode.', 'INVALID_OTP', 400, false);
    }

    if (Date.parse(pendingOtp.expiresAt) < Date.now()) {
      throw new ApiError('The OTP expired. Request a new one.', 'TIMEOUT', 408, true);
    }

    const existingUser = await storageService.get<CurrentUser | null>(storageKeys.currentUser, null);
    const session = createSession(existingUser ?? createUser(pendingOtp.phone));
    await this.persistSession(session);
    await apiClient.request<AuthSession>({ data: session, method: 'POST', requiresAuth: false, url: endpoints.auth.verifyOtp });
    return session;
  }

  async setupProfile(input: ProfileSetupInput): Promise<AuthSession> {
    const current = await this.getPersistedSession();

    if (!current) {
      throw new ApiError('Please sign in before setting up a profile.', 'UNAUTHORIZED', 401, false);
    }

    if (!input.name.trim()) {
      throw new ApiError('Enter your display name.', 'MOCK_FAILURE', 400, false);
    }

    const hasAvatarPatch = Object.prototype.hasOwnProperty.call(input, 'avatarUri');
    const user = {
      ...current.user,
      ...createUser(current.user.phone, input),
      avatarUri: hasAvatarPatch ? input.avatarUri : current.user.avatarUri,
      id: current.user.id,
      createdAt: current.user.createdAt,
    };
    const session = { ...current, user };
    await apiClient.request<AuthSession>({ data: session, method: 'PATCH', url: endpoints.auth.profile });
    await this.persistSession(session);
    return session;
  }

  async refreshToken(session: AuthSession): Promise<AuthSession> {
    const refreshed = createSession(session.user);
    await this.persistSession(refreshed);
    return refreshed;
  }

  async getPersistedSession(): Promise<AuthSession | null> {
    const session = await storageService.get<AuthSession | null>(storageKeys.authSession, null);

    if (!session) {
      return null;
    }

    if (Date.parse(session.tokens.expiresAt) < Date.now()) {
      return this.refreshToken(session);
    }

    return session;
  }

  async logout(): Promise<void> {
    pendingOtp = null;
    await storageService.multiRemove([storageKeys.authSession, storageKeys.currentUser]);
  }

  private async persistSession(session: AuthSession): Promise<void> {
    await storageService.set(storageKeys.authSession, session);
    await storageService.set(storageKeys.currentUser, session.user);
  }
}

export const authService = new AuthService();


