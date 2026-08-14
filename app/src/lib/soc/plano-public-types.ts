export type PublicPlanoProduto = {
    id: number;
    codigo: string;
    nome: string;
    preco_normal: number;
    disponivel_compra: boolean;

    imagem_principal: {
        public_url: string | null;
    } | null;
};

export type PublicPlanoSocio = {
    id: number;
    codigo: string;
    nome: string;
    descricao: string | null;
    duracao_dias: number;

    status:
        | "disponivel"
        | "encerrado";

    banner: {
        public_url: string | null;
    } | null;

    imagem_publica_url:
        | string
        | null;

    produto:
        | PublicPlanoProduto
        | null;

    disponivel_compra:
        boolean;
};
