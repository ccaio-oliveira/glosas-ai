import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    children: ReactNode;
}

export function AppLayout({ title, subtitle, actions, children }: AppLayoutProps) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopBar title={title} subtitle={subtitle} actions={actions} />
                <div style={{ padding: 'var(--content-padding)', flex: 1 }}>{children}</div>
            </div>
        </div>
    );
}