import { ReactNode } from "react";

import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
    children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="bp-shell">
            <Sidebar />

            <main className="bp-main">
                <div className="bp-content">
                    <Topbar />
                    {children}
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
}