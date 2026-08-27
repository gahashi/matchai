import {
    AppShell,
} from "@/components/layout/AppShell";
import {
    requirePageAccess,
} from "@/lib/auth/require-access";
import {
    planoService,
} from "@/lib/soc/plano-service";

import AdminPlanosSocioClient from "./AdminPlanosSocioClient";

export default async function AdminPlanosSocioPage() {
    await requirePageAccess(
        "/admin/planos-socio",
    );

    const data =
        await planoService.listAdminData();

    return (
        <AppShell>
            <AdminPlanosSocioClient
                initialData={data}
            />
        </AppShell>
    );
}
