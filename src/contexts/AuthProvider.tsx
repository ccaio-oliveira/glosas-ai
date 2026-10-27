import { useEffect, useState, type ReactNode } from "react";
import { api, ensureCsrfCookie } from "../lib/api";
import { AuthContext, type User } from "./AuthContext";

// Fica separado de AuthContext.tsx porque o Fast Refresh exige que um arquivo
// exporte só componentes; os hooks useAuth/useCan continuam lá.
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
