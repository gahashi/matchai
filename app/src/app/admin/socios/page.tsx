import { AppShell } from "@/components/layout/AppShell";
import { requirePageAccess } from "@/lib/auth/require-access";
import { socioService } from "@/lib/soc/socio-service";

import SociosAdminClient from "./SociosAdminClient";

export default async function AdminSociosPage() {
    await requirePageAccess("/admin/socios");

    const data = await socioService.listAdminData();

    return (
        <AppShell>
            <SociosAdminClient initialData={data} />
        </AppShell>
    );
}
