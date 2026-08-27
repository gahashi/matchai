import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    parceiroService,
} from "@/lib/par/parceiro-service";

import AdminParceirosClient from "./AdminParceirosClient";


export default async function AdminParceirosPage() {
    await requirePageAccess(
        "/admin/parceiros",
    );

    const data =
        await parceiroService.listAdminData();

    return (
        <AppShell>
            <AdminParceirosClient
                initialData={data}
            />
        </AppShell>
    );
}