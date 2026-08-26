import {
    notFound,
} from "next/navigation";

import {
    TvPlayer,
} from "@/components/tv/TvPlayer";

import {
    tvPlaylistService,
} from "@/lib/tv/tv-playlist-service";


export const dynamic =
    "force-dynamic";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function TvSlugPage({
    params,
}: PageProps) {
    const {
        slug,
    } =
        await params;

    const data =
        await tvPlaylistService
            .getPlaylist(
                slug,
            );

    if (
        !data
    ) {
        notFound();
    }

    return (
        <TvPlayer
            initialData={
                data
            }
            slug={
                slug
            }
        />
    );
}
