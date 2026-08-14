import type { Metadata } from "next";

import { CartPageClient } from "@/components/public/CartPageClient";
import { PublicStoreShell } from "@/components/public/PublicStoreShell";
import { getAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Carrinho | AAACCU",
};

export default async function CarrinhoPage() {
    const session = await getAuthSession();

    return (
        <PublicStoreShell
            user={
                session
                    ? {
                        nome: session.user.nome,
                        avatar_url: session.user.avatar_url ?? null,
                        isAdmin:
                            session.user.sys_usuario_tipo.codigo === "admin",
                    }
                    : null
            }
        >
            <div className="bp-public-container bp-public-cart-container">
                <CartPageClient />
            </div>
        </PublicStoreShell>
    );
}
