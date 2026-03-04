import { create } from 'zustand';

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
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, token) => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      localStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: !!user, isLoading: false });
  },

  logout: () => {
    document.cookie = 'token=; path=/; max-age=0';
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.data, token, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
