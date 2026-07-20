import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <AppLayout title="Dashboard" subtitle="Bem-vinda de volta">
            <p>
                Logado como {user?.name} - {user?.clinic?.name}
            </p>
        </AppLayout>
    );
}