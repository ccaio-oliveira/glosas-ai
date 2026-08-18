import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ensureCsrfCookie } from "../lib/api";

interface User {
    id: number;
    name: string;
    email: string;
    role: 'owner' | 'biller' | 'viewer' | 'super_admin';
    clinic: { id: number; name: string } | null;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get<User>('/api/user')
            .then((res) => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string) {
        await ensureCsrfCookie();
        await api.post('/api/login', { email, password });

        const res = await api.get<User>('/api/user');
        setUser(res.data);
        return res.data;
    }

    async function logout() {
        await api.post('/api/logout');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');

    return ctx;
}