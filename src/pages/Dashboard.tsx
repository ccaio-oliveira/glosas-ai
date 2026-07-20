import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>

            <p>
                Logado como {user?.name} - {user?.clinic?.name}
            </p>

            <button onClick={() => logout()}>Sair</button>
        </div>
    );
}