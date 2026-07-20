import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/claims', label: 'Guias TISS' },
    { to: '/payers', label: 'Convênios' },
];

export function Sidebar() {
    const { user, logout } = useAuth();

    return (
        <div style={{ width: 'var(--sidebar-width)', minHeight: '100vh', background: 'var(--color-sidebar-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)'}}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '19px', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>
                    Glosas<span style={{ color: 'var(--color-accent-500)' }}>AI</span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '3px' }}>{user?.clinic?.name}</div>
            </div>

            <nav style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            width: '100%',
                            padding: '9px 10px',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            background: isActive ? 'rgba(255, 255, 255, 0.11)' : 'transparent',
                            color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.52)',
                            fontSize: 'var(--text-base)', 
                            fontWeight: isActive ? 600 : 400,
                            fontFamily: 'var(--font-sans)',
                            transition: 'all var(--transition-base)',
                        })}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <div style={{ margin: '8px 4px 2px', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {user?.name?.charAt(0)}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{user?.role}</div>
                    </div>

                    <button onClick={() => logout()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                        Sair
                    </button>
                </div>
            </div>
        </div>
    )
}