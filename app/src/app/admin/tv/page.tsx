import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    TvProgramacaoManager,
} from "@/components/tv/TvProgramacaoManager";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    tvProgramacaoService,
} from "@/lib/tv/tv-programacao-service";


export default async function AdminTvPage() {
    await requirePageAccess(
        "/admin/tv",
    );

    const data =
        await tvProgramacaoService
            .listAdminData();

    return (
        <AppShell>
            <TvProgramacaoManager
                mode="admin"
                apiBase="/api/admin/tv"
                initialData={
                    data
                }
            />
        </AppShell>
    );
}
