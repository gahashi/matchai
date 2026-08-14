import type {
    Metadata,
} from "next";

import {
    CheckoutClient,
} from "@/components/public/CheckoutClient";
import {
    PublicStoreShell,
} from "@/components/public/PublicStoreShell";
import {
    getAuthSession,
} from "@/lib/auth/session";
import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";

export const metadata: Metadata = {
    title: "Checkout | AAACCU",
};

export default async function CheckoutPage() {
    const session = await getAuthSession();

    const profile = session
        ? await pedidoPublicService.getCheckoutCustomer(
            session.user.id,
        )
        : null;

    return (
        <PublicStoreShell
            user={
                session
                    ? {
                        nome: session.user.nome,
                        avatar_url:
                            session.user.avatar_url ??
                            null,
                        isAdmin:
                            session.user.sys_usuario_tipo
                                .codigo === "admin",
                    }
                    : null
            }
        >
            <div className="bp-public-container bp-public-checkout-container">
                <CheckoutClient
                    publicKey={
                        process.env
                            .NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ??
                        ""
                    }
                    initialCustomer={{
                        isAuthenticated: Boolean(session),
                        nome:
                            profile?.nome ??
                            session?.user.nome ??
                            "",
                        email:
                            profile?.email ??
                            session?.user.email ??
                            "",
                        telefone:
                            profile?.telefone ??
                            "",
                        documento:
                            profile?.documento ??
                            "",
                    }}
                />
            </div>
        </PublicStoreShell>
    );
}
