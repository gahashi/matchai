import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    produtoService,
} from "@/lib/prd/produto-service";

import {
    pedidoService,
} from "@/lib/vnd/pedido-service";

import AdminPedidosClient from "./AdminPedidosClient";


export default async function AdminPedidosPage() {
    await requirePageAccess(
        "/admin/pedidos",
    );

    const [
        pedidosData,
        produtosData,
    ] =
        await Promise.all([
            pedidoService.listAdminData(),
            produtoService.listAdminData(),
        ]);

    return (
        <AppShell>
            <AdminPedidosClient
                initialData={
                    pedidosData
                }
                initialProdutos={
                    produtosData.produtos
                }
            />
        </AppShell>
    );
}
