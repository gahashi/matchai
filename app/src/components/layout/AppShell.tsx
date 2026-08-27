import type {
    ReactNode,
} from "react";

import {
    MobileBottomNav,
} from "./MobileBottomNav";

import {
    Sidebar,
} from "./Sidebar";

import {
    Topbar,
} from "./Topbar";

import {
    AdminContextNav,
} from "./AdminContextNav";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    listParceirosNavigationForUser,
} from "@/lib/par/require-parceiro-access";


type AppShellProps = {
    children:
        ReactNode;
};


export async function AppShell({
    children,
}: AppShellProps) {
    const session =
        await getAuthSession();

    const user = {
        isAuthenticated:
            Boolean(
                session,
            ),

        isAdmin:
            session
                ?.user
                .sys_usuario_tipo
                .codigo ===
            "admin",
    };


    const parceiros =
        session
            ? await listParceirosNavigationForUser(
                session
                    .user
                    .id,
            )
            : [];


    const navigationPartners =
        parceiros.map(
            (
                parceiro,
            ) => ({
                id:
                    parceiro.id,

                slug:
                    parceiro.slug,

                nome:
                    parceiro.nome,

                logoUrl:
                    parceiro
                        .par_parceiro_tema
                        ?.logo_sys_arquivo
                        ?.public_url ??
                    null,

                corPrimaria:
                    parceiro
                        .par_parceiro_tema
                        ?.cor_primaria ??
                    null,
            }),
        );


    return (
        <div className="bp-shell">
            <Sidebar
                user={
                    user
                }
                partners={
                    navigationPartners
                }
            />

            <main className="bp-main">
                <div className="bp-content">
                    <Topbar />

                    <AdminContextNav />

                    {children}
                </div>
            </main>

            <MobileBottomNav
                user={
                    user
                }
                hasPartners={
                    navigationPartners
                        .length >
                    0
                }
            />
        </div>
    );
}
