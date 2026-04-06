import { create } from 'zustand';

export type LoginContext = 'hub' | 'vic' | 'vsc';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginContext: LoginContext;
  setUser: (user: User | null, token: string | null, context?: LoginContext) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  loginContext: 'hub',

  setUser: (user, token, context) => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      localStorage.setItem('token', token);
    }
    if (context) {
      localStorage.setItem('loginContext', context);
    }
    set({
      user,
      token,
      isAuthenticated: !!user,
      isLoading: false,
      loginContext: context || (localStorage.getItem('loginContext') as LoginContext) || 'hub',
    });
  },

  logout: () => {
    document.cookie = 'token=; path=/; max-age=0';
    localStorage.removeItem('token');
    localStorage.removeItem('loginContext');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, loginContext: 'hub' });
  },

  setLoading: (isLoading) => set({ isLoading }),

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      const savedContext = (localStorage.getItem('loginContext') as LoginContext) || 'hub';
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, loginContext: 'hub' });
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.data, token, isAuthenticated: true, isLoading: false, loginContext: savedContext });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('loginContext');
        document.cookie = 'token=; path=/; max-age=0';
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, loginContext: 'hub' });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, loginContext: 'hub' });
    }
  },
}));
