import { createContext, useContext } from "react";

export interface Permissions {
    operate: boolean;
    manage_clinic: boolean;
    manage_users: boolean;
    manage_billing: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'owner' | 'biller' | 'viewer' | 'super_admin';
    clinic: { id: number; name: string } | null;
    permissions: Permissions;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
    const ctx = useContext(AuthContext);
    
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');

    return ctx;
}

export function useCan(): Permissions {
    const { user } = useAuth();
    return user?.permissions ?? {
        operate: false,
        manage_clinic: false,
        manage_users: false,
        manage_billing: false,
    };
}