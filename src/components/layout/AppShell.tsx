import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";

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