import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireApiAccess,
} from "@/lib/auth/require-api-access";
import {
    inboxService,
} from "@/lib/sys/inbox/inbox-service";

export async function GET(
    request: NextRequest
) {
    const access =
        await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const unreadCount =
            await inboxService.countUnread({
                sysUsuarioId:
                access.session.user.id,
            });

        return NextResponse.json({
            ok: true,
            unreadCount,
        });
    } catch (error) {
        console.error(
            "Erro ao contar mensagens não lidas:",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                unreadCount: 0,
                message:
                    "Não foi possível carregar o contador da Inbox.",
            },
            {
                status: 500,
            }
        );
    }
}