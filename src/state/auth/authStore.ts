import { ApiError, type AuthSession, type CurrentUser } from '../../api/types';
import { authService, type ProfileSetupInput } from '../../services/authService';
import { storageKeys } from '../../storage/storageKeys';
import { storageService } from '../../storage/storageService';
import { createStore, useStore } from '../createStore';

type AuthStatus = 'idle' | 'loading' | 'otpSent' | 'authenticated' | 'profileRequired' | 'error';

type AuthState = {
  initialized: boolean;
  status: AuthStatus;
  phone: string;
  session: AuthSession | null;
  user: CurrentUser | null;
  error: string | null;
  lastOtp: string | null;
};

const initialState: AuthState = {
  error: null,
  initialized: false,
  lastOtp: null,
  phone: '',
  session: null,
  status: 'idle',
  user: null,
};

export const authStore = createStore<AuthState>(initialState);

function userMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export const authActions = {
  async initialize(): Promise<void> {
    authStore.setState({ status: 'loading' });
    const session = await authService.getPersistedSession();

    authStore.setState({
      error: null,
      initialized: true,
      phone: session?.user.phone ?? '',
      session,
      status: session ? 'authenticated' : 'idle',
      user: session?.user ?? null,
    });
  },

  async requestOtp(phone: string): Promise<void> {
    try {
      authStore.setState({ error: null, phone, status: 'loading' });
      const result = await authService.login(phone);
      authStore.setState({ lastOtp: result.otp, status: 'otpSent' });
    } catch (error) {
      authStore.setState({ error: userMessage(error), status: 'error' });
      throw error;
    }
  },

  async verifyOtp(otp: string): Promise<void> {
    try {
      const { phone } = authStore.getState();
      authStore.setState({ error: null, status: 'loading' });
      const session = await authService.verifyOtp(phone, otp);
      authStore.setState({
        lastOtp: null,
        session,
        status: 'authenticated',
        user: session.user,
      });
    } catch (error) {
      authStore.setState({ error: userMessage(error), status: 'otpSent' });
      throw error;
    }
  },

  async setupProfile(input: ProfileSetupInput): Promise<void> {
    try {
      authStore.setState({ error: null, status: 'loading' });
      const session = await authService.setupProfile(input);
      authStore.setState({ session, user: session.user, status: 'authenticated' });
    } catch (error) {
      authStore.setState({ error: userMessage(error), status: 'profileRequired' });
      throw error;
    }
  },

  async updateProfile(input: ProfileSetupInput): Promise<void> {
    try {
      authStore.setState({ error: null });
      const session = await authService.setupProfile(input);
      authStore.setState({ session, user: session.user, status: 'authenticated' });
    } catch (error) {
      authStore.setState({ error: userMessage(error) });
      throw error;
    }
  },

  async logout(): Promise<void> {
    await authService.logout();
    authStore.setState({ ...initialState, initialized: true });
  },
};

export function useAuth<Selected>(selector: (state: AuthState) => Selected): Selected {
  return useStore(authStore, selector);
}
