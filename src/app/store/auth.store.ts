
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: number;
    email: string;
    // Add other user fields as needed
}

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            login: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
            isAuthenticated: () => !!get().token,
        }),
        {
            name: 'auth-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            // Default version is 0, which is fine
            // Persist for 1 week? valid for 1 week.
            // localStorage persists indefinitely until cleared.
            // We can rely on token expiry (7d) on backend validation,
            // or implement manual expiry check here if needed.
            // For now, simple persistence is what was requested ("persistir la sesion").
        },
    ),
);
