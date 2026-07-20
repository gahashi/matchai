import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { inboxService, InboxFilter, InboxSort } from "@/lib/inbox/inbox-service";

const allowedFilters = ["all", "unread", "requests", "results", "archived"] as const;
const allowedSorts = ["recent", "oldest", "unread_first"] as const;

function resolveFilter(value: string | null): InboxFilter {
    if (value && allowedFilters.includes(value as InboxFilter)) {
        return value as InboxFilter;
    }

    return "all";
}

function resolveSort(value: string | null): InboxSort {
    if (value && allowedSorts.includes(value as InboxSort)) {
        return value as InboxSort;
    }

    return "recent";
}

function resolveNumber(value: string | null, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return parsed;
}

export async function GET(request: NextRequest) {
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    const { searchParams } = new URL(request.url);

    const filter = resolveFilter(searchParams.get("filter"));
    const sort = resolveSort(searchParams.get("sort"));
    const page = resolveNumber(searchParams.get("page"), 1);
    const pageSize = resolveNumber(searchParams.get("pageSize"), 20);

    const result = await inboxService.listItems({
        sysUsuarioId: access.session.user.id,
        filter,
        sort,
        page,
        pageSize,
    });

    return NextResponse.json({
        success: true,
        ...result,
    });
}