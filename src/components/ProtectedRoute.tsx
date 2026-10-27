import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if(loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    // Telas da clínica: o super_admin não tem clínica e a API responde 403 (achado M6).
    // Isto é só navegação — a barreira real é o middleware `clinic` na API.
    if (user.role === 'super_admin') return <Navigate to="/admin/errors" replace />;

    return <>{children}</>;
}