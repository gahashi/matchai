import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageAccess } from "@/lib/auth/require-access";

export default async function AdminPedidosPage() {
    await requirePageAccess(
        "/admin/pedidos",
    );

    return (
        <AppShell>
            <PageHeader
                title="Pedidos"
                subtitle="Acompanhe e gerencie os pedidos realizados."
            />
        </AppShell>
    );
}