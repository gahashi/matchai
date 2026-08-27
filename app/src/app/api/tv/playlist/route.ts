import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    tvPlaylistService,
} from "@/lib/tv/tv-playlist-service";


export const dynamic =
    "force-dynamic";


export async function GET(
    request: NextRequest,
) {
    try {
        const slug =
            request
                .nextUrl
                .searchParams
                .get(
                    "slug",
                );

        const data =
            await tvPlaylistService
                .getPlaylist(
                    slug,
                );

        if (
            !data
        ) {
            return NextResponse.json(
                {
                    ok:
                        false,

                    message:
                        "Parceiro não encontrado.",
                },
                {
                    status:
                        404,

                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                },
            );
        }

        return NextResponse.json(
            {
                ok:
                    true,

                message:
                    "Playlist carregada.",

                data,
            },
            {
                headers: {
                    "Cache-Control":
                        "no-store",
                },
            },
        );
    } catch (
        error
    ) {
        console.error(
            "[tv.playlist]",
            error,
        );

        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    "Não foi possível carregar a playlist da TV.",
            },
            {
                status:
                    500,

                headers: {
                    "Cache-Control":
                        "no-store",
                },
            },
        );
    }
}
