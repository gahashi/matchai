import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageAccess } from "@/lib/auth/require-access";

export default async function AdminPlanosSocioPage() {
    await requirePageAccess(
        "/admin/planos-socio",
    );

    return (
        <AppShell>
            <PageHeader
                title="Planos de sócio"
                subtitle="Gerencie os planos de associação."
            />
        </AppShell>
    );
}