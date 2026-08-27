import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    produtoService,
} from "@/lib/prd/produto-service";

import AdminProdutosClient from "./AdminProdutosClient";


export default async function AdminProdutosPage() {
    await requirePageAccess(
        "/admin/produtos",
    );

    const data =
        await produtoService.listAdminData();

    return (
        <AppShell>
            <AdminProdutosClient
                initialData={data}
            />
        </AppShell>
    );
}