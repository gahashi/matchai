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

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    listParceirosNavigationForUser,
} from "@/lib/par/require-parceiro-access";


type PublicUser = {
    nome:
        string;

    avatar_url:
        string |
        null;

    isAdmin:
        boolean;
} | null;


export async function PublicStoreShell({
    children,
    user,
}: {
    children:
        ReactNode;

    user:
        PublicUser;
}) {
    const navigationUser = {
        isAuthenticated:
            Boolean(
                user,
            ),

        isAdmin:
            Boolean(
                user
                    ?.isAdmin,
            ),
    };


    const session =
        navigationUser
            .isAuthenticated
            ? await getAuthSession()
            : null;


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
        <PublicCartProvider>
            <div className="bp-public-site">
                <div className="bp-shell bp-public-shell">
                    <Sidebar
                        mode="public"
                        user={
                            navigationUser
                        }
                        partners={
                            navigationPartners
                        }
                    />

                    <main className="bp-main bp-public-main">
                        <div className="bp-content bp-public-content">
                            <PublicHeader
                                user={
                                    user
                                }
                            />

                            <div className="bp-public-page-content">
                                {
                                    children
                                }
                            </div>

                            <PublicFooter />
                        </div>
                    </main>

                    <MobileBottomNav
                        mode="public"
                        user={
                            navigationUser
                        }
                        hasPartners={
                            navigationPartners
                                .length >
                            0
                        }
                    />
                </div>
            </div>
        </PublicCartProvider>
    );
}
