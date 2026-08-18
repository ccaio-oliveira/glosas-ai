import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function SuperAdminRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
}