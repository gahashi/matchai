import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageAccess } from "@/lib/auth/require-access";

export default async function AdminEventosPage() {
    await requirePageAccess(
        "/admin/eventos",
    );

    return (
        <AppShell>
            <PageHeader
                title="Eventos"
                subtitle="Gerencie eventos e links temporários."
            />
        </AppShell>
    );
}