import {
    tvProgramacaoService,
} from "@/lib/tv/tv-programacao-service";

export type {
    TvPlaylistData,
    TvPlaylistItem,
} from "@/lib/tv/tv-programacao-service";


class TvPlaylistService {
    async getPlaylist(
        slugValue?:
            string |
            null,
    ) {
        return tvProgramacaoService
            .getPlaylist(
                slugValue,
            );
    }
}


export const tvPlaylistService =
    new TvPlaylistService();
