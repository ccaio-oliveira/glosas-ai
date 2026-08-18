import type { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const NAV = [{ to: '/admin/errors', label: 'Erros do sistema' }];

export function AdminLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen flex-col">
            <div className="bg-warning-500 px-4 py-1 text-center text-xs font-semibold text-white">
                Painel interno GlosasAI - dados de todas as clínicas
            </div>

            <div className="flex flex-1">
                <div className="flex w-[var(--sidebar-width)] flex-shrink-0 flex-col bg-neutral-900">
                    <div className="border-b border-white/10 px-[18px] pb-4 pt-5">
                        <div className="font-sans text-[19px] font-extrabold leading-none tracking-tight text-white">
                            Glosas<span className="text-accent-500">AI</span>
                        </div>

                        <div className="mt-[3px] text-xs text-white/45">
                            Operação
                        </div>

                        <nav className="flex flex-1 flex-col gap-px p-2">
                            {NAV.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => clsx(
                                        'rounded-md px-2.5 py-2.5 font-sans text-base no-underline transition-colors duration-150',
                                        isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/50',
                                    )}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="border-t border-white/10 p-3">
                            <div className="truncate text-[13px] font-semibold text-white/85">
                                {user?.name}
                            </div>

                            <button onClick={() => logout()} className="mt-1 text-xs text-white/50 hover:text-white/80">
                                Sair
                            </button>
                        </div>

                    </div>
                    
                </div>
                    
                <div className="flex flex-1 flex-col">
                    <div className="flex h-[var(--topbar-height)] flex-shrink-0 items-center border-b border-border bg-surface px-[var(--content-padding)]">
                        <div>
                            <div className="font-sans text-xl font-semibold leading-tight text-text-primary">
                                {title}
                            </div>

                            {subtitle && <div className="mt-px font-sans text-sm text-text-muted">{subtitle}</div>}
                        </div>
                    </div>

                    <div className="flex-1 p-[var(--content-padding)]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}