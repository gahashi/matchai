import {
    NextRequest,
    NextResponse,
} from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { inboxService } from "../../../../../../lib/sys/inbox/inbox-service";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    const access =
        await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await params;
        const inboxItemId = Number(id);

        if (
            !Number.isInteger(inboxItemId) ||
            inboxItemId <= 0
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Item inválido.",
                },
                {
                    status: 400,
                }
            );
        }

        const result =
            await inboxService.markAsUnread({
                sysUsuarioId:
                access.session.user.id,
                inboxItemId,
            });

        if (result.count === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Item não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.error(
            "Erro ao marcar item como não lido:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível marcar o item como não lido.",
            },
            {
                status: 500,
            }
        );
    }
}