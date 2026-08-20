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
    disponivel: boolean;
};

export type PublicProdutoCampo = {
    id: number;
    codigo: string;
    nome: string;
    descricao: string | null;
    tipo: "texto" | "numero";
    obrigatorio: boolean;
    valor_unico: boolean;
};

export type PublicProdutoComponente = {
    id: number;
    produto_id: number;
    codigo: string;
    nome: string;
    quantidade: number;
    controla_estoque: boolean;
    estoque_atual: number | null;
    disponivel: boolean;
    variacoes: PublicProdutoVariacao[];
    campos: PublicProdutoCampo[];
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
    modalidade_venda: "estoque" | "pre_venda";

    controla_estoque: boolean;
    estoque_atual: number | null;
    destaque: boolean;

    imagem_principal: {
        public_url: string | null;
    } | null;

    imagens: PublicProdutoImagem[];
    variacoes: PublicProdutoVariacao[];
    campos: PublicProdutoCampo[];
    componentes: PublicProdutoComponente[];

    eh_kit: boolean;

    status: "disponivel" | "encerrado" | "esgotado";
    disponivel_compra: boolean;
};
