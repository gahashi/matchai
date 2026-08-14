import {
    ReactNode,
} from "react";

import {
    MobileBottomNav,
} from "@/components/layout/MobileBottomNav";
import {
    Sidebar,
} from "@/components/layout/Sidebar";
import {
    PublicCartProvider,
} from "@/components/public/PublicCartProvider";
import {
    PublicFooter,
} from "@/components/public/PublicFooter";
import {
    PublicHeader,
} from "@/components/public/PublicHeader";

type PublicUser = {
    nome: string;
    avatar_url: string | null;
    isAdmin: boolean;
} | null;

export function PublicStoreShell({
                                     children,
                                     user,
                                 }: {
    children: ReactNode;
    user: PublicUser;
}) {
    const navigationUser = {
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user?.isAdmin),
    };

    return (
        <PublicCartProvider>
            <div className="bp-public-site">
                <div className="bp-shell bp-public-shell">
                    <Sidebar
                        mode="public"
                        user={navigationUser}
                    />

                    <main className="bp-main bp-public-main">
                        <div className="bp-content bp-public-content">
                            <PublicHeader user={user} />
                            <div className="bp-public-page-content">
                                {children}
                            </div>
                            <PublicFooter />
                        </div>
                    </main>

                    <MobileBottomNav
                        mode="public"
                        user={navigationUser}
                    />
                </div>
            </div>
        </PublicCartProvider>
    );
}
