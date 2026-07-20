import { AppShell } from "@/components/layout/AppShell";
import { requirePageAccess } from "@/lib/auth/require-access";
import { inboxService } from "@/lib/inbox/inbox-service";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
    const { session } = await requirePageAccess("/inbox");

    const result = session
        ? await inboxService.listItems({
            sysUsuarioId: session.user.id,
            filter: "all",
            sort: "recent",
            page: 1,
            pageSize: 20,
        })
        : {
            items: [],
            pagination: {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 1,
                hasPreviousPage: false,
                hasNextPage: false,
            },
        };

    return (
        <AppShell>
            <InboxClient
                initialItems={result.items}
                initialPagination={result.pagination}
            />
        </AppShell>
    );
}