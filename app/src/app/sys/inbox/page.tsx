import { AppShell } from "@/components/layout/AppShell";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { inboxService } from "@/lib/inbox/inbox-service";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
    const { session } =
        await requireAuthPageAccess("/sys/inbox");

    const result = await inboxService.listItems({
        sysUsuarioId: session.user.id,
        filter: "all",
        sort: "recent",
        page: 1,
        pageSize: 20,
    });

    return (
        <AppShell>
            <InboxClient
                initialItems={result.items}
                initialPagination={result.pagination}
            />
        </AppShell>
    );
}