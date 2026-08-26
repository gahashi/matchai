import {
    TvPlayer,
} from "@/components/tv/TvPlayer";

import {
    tvPlaylistService,
} from "@/lib/tv/tv-playlist-service";


export const dynamic =
    "force-dynamic";


export default async function TvPage() {
    const data =
        await tvPlaylistService
            .getPlaylist();

    if (
        !data
    ) {
        return null;
    }

    return (
        <TvPlayer
            initialData={
                data
            }
            slug={
                null
            }
        />
    );
}
