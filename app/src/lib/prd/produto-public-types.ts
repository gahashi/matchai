export type PublicProdutoImagem = {
    id: number;
    ordem: number;
    principal: boolean;
    public_url: string | null;
};

export type PublicProdutoVariacao = {
    id: number;
    nome: string;
    estoque_atual: number | null;
};

export type PublicProduto = {
    id: number;
    codigo: string;
    slug: string;
    nome: string;
    descricao: string | null;

    tipo: {
        codigo: string;
        nome: string;
    };

    preco_normal: number;
    preco_socio: number | null;
    preco_aplicado: number;
    socio_aplicado: boolean;

    controla_estoque: boolean;
    estoque_atual: number | null;
    destaque: boolean;

    imagem_principal: {
        public_url: string | null;
    } | null;

    imagens: PublicProdutoImagem[];
    variacoes: PublicProdutoVariacao[];

    status: "disponivel" | "encerrado" | "esgotado";
    disponivel_compra: boolean;
};
