import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { inboxService } from "@/lib/inbox/inbox-service";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    const { id } = await params;
    const inboxItemId = Number(id);

    if (!Number.isInteger(inboxItemId) || inboxItemId <= 0) {
        return NextResponse.json(
            {
                success: false,
                message: "Item inválido.",
            },
            {
                status: 400,
            },
        );
    }

    const result = await inboxService.archive({
        sysUsuarioId: access.session.user.id,
        inboxItemId,
    });

    if (result.count === 0) {
        return NextResponse.json(
            {
                success: false,
                message: "Item não encontrado.",
            },
            {
                status: 404,
            },
        );
    }

    return NextResponse.json({
        success: true,
    });
}