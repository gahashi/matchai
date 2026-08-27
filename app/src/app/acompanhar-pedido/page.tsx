import type {
    Metadata,
} from "next";

import {
    PublicStoreShell,
} from "@/components/public/PublicStoreShell";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    AcompanharPedidoClient,
} from "./AcompanharPedidoClient";

export const metadata: Metadata = {
    title:
        "Acompanhar pedido | AAACCU",
};

export default async function AcompanharPedidoPage() {
    const session =
        await getAuthSession();

    return (
        <PublicStoreShell
            user={
                session
                    ? {
                        nome:
                        session.user.nome,

                        avatar_url:
                            session.user.avatar_url ??
                            null,

                        isAdmin:
                            session.user.sys_usuario_tipo
                                .codigo ===
                            "admin",
                    }
                    : null
            }
        >
            <AcompanharPedidoClient />
        </PublicStoreShell>
    );
}