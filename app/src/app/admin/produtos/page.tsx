import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageAccess } from "@/lib/auth/require-access";

export default async function AdminProdutosPage() {
    await requirePageAccess(
        "/admin/produtos",
    );

    return (
        <AppShell>
            <PageHeader
                title="Produtos"
                subtitle="Gerencie os produtos disponíveis para venda."
            />
        </AppShell>
    );
}