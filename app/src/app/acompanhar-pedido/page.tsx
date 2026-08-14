import type { Metadata } from "next";
import { Package, Search } from "lucide-react";

import { PublicStoreShell } from "@/components/public/PublicStoreShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Acompanhar pedido | AAACCU",
};

export default async function AcompanharPedidoPage() {
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
            <div className="bp-public-container bp-public-order-lookup-page">
                <section className="bp-public-order-lookup-card">
                    <div className="bp-public-order-lookup-icon">
                        <Package size={27} />
                    </div>

                    <div className="bp-public-order-lookup-heading">
                        <span className="bp-public-kicker">Pedidos</span>
                        <h1>Acompanhar pedido</h1>
                        <p>
                            A consulta usará o código público do pedido e o
                            telefone informado na compra.
                        </p>
                    </div>

                    <div className="bp-public-order-lookup-form">
                        <Input
                            label="Código do pedido"
                            placeholder="Ex.: A9F6TR3KN"
                            disabled
                        />

                        <Input
                            label="Telefone da compra"
                            placeholder="(47) 99999-9999"
                            disabled
                        />

                        <Button type="button" fullWidth disabled>
                            <Search size={17} />
                            Consultar pedido
                        </Button>
                    </div>

                    <div className="bp-public-order-lookup-note">
                        A estrutura visual já está pronta. A consulta será
                        conectada ao pedido real junto com o checkout.
                    </div>
                </section>
            </div>
        </PublicStoreShell>
    );
}
