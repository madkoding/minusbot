import { create } from 'zustand';

interface User {
    username: string;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isInitializing: false });
    },

    setUser: (user: User) => {
        set({ user, isAuthenticated: !!user });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    },

    initialize: () => {
        const token = localStorage.getItem('token');
        if (token) {
            set({ token, isAuthenticated: true, isInitializing: false });
        } else {
            set({ isInitializing: false });
        }
    },
}));
