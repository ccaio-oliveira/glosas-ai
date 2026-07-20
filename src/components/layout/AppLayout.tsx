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
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <TopBar title={title} subtitle={subtitle} actions={actions} />
                <div className="flex-1 p-[var(--content-padding)]">{children}</div>
            </div>
        </div>
    );
}