export type PublicEvento = {
    id: number;
    titulo: string;
    descricao: string | null;
    url: string | null;
    evento_at: string | null;
    destaque: boolean;

    banner: {
        public_url: string | null;
    } | null;
};
