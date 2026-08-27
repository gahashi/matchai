import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    eventoService,
} from "@/lib/cad/evento-service";

import AdminEventosClient from "./AdminEventosClient";

export default async function AdminEventosPage() {
    await requirePageAccess(
        "/admin/eventos",
    );

    const data =
        await eventoService.listAdminData();

    return (
        <AppShell>
            <AdminEventosClient
                initialData={data}
            />
        </AppShell>
    );
}
