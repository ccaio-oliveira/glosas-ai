import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const loggedUser = await login(email, password);
            navigate(loggedUser.role === 'super_admin' ? '/admin/errors' : '/dashboard');
        } catch {
            setError('E-mail ou senha inválidos.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <form onSubmit={handleSubmit} className="flex w-[360px] flex-col gap-3">
                <h1>Entrar na GlosasAI</h1>
                
                {error && <p>{error}</p>}

                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" />

                <Button type="submit" disabled={submitting}>
                    {submitting ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
        </div>
    );
}