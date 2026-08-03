import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import clsx from "clsx";
import { roleLabel } from "../../lib/roles";

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upload', label: 'Upload TISS' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
        'flex items-center gap-2.5 rounded-md px-2.5 py-2.5 font-sans text-base no-underline transition-colors duration-150',
        isActive ? 'bg-white/11 font-semibold text-white' : 'font-normal text-white/50',
    );

export function Sidebar() {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen w-[var(--sidebar-width)] flex-shrink-0 flex-col bg-sidebar-bg">
            <div className="border-b border-white/7 px-[18px] pb-4 pt-5">
                <div className="font-sans text-[19px] font-extrabold leading-none tracking-tight text-white">
                    Glosas<span className="text-accent-500">AI</span>
                </div>
                <div className="mt-[3px] text-xs text-white/45">{user?.clinic?.name}</div>
            </div>

            <nav className="flex flex-1 flex-col gap-px p-2">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={navLinkClass}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-white/7 p-2">
                <NavLink to="/settings" className={navLinkClass}>
                    Configurações
                </NavLink>

                <div className="m-1 mt-2 flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                        {user?.name?.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-white/85">{user?.name}</div>
                        <div className="text-[11px] text-white/45">{user ? roleLabel[user.role] ?? user.role : ''}</div>
                    </div>

                    <button onClick={() => logout()} className="text-xs text-white/50 hover:text-white/80">
                        Sair
                    </button>
                </div>
            </div>
        </div>
    )
}