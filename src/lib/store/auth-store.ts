import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'Admin' | 'Manager' | 'Employee';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role: Role, name?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, role, providedName) => {
        // Mock login
        const defaultName = email.split('@')[0];
        const name = providedName || defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        const user: User = {
          id: Math.random().toString(36).substring(7),
          email,
          name,
          role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        };
        set({ user, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
