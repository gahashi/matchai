import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageAccess } from "@/lib/auth/require-access";

export default async function AdminSociosPage() {
    await requirePageAccess(
        "/admin/socios",
    );

    return (
        <AppShell>
            <PageHeader
                title="Sócios"
                subtitle="Consulte e gerencie as associações."
            />
        </AppShell>
    );
}