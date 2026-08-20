"use client";

import {
    ChangeEvent,
    DragEvent,
    FormEvent,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Eye,
    ImagePlus,
    LayoutGrid,
    List,
    Package,
    Pencil,
    Plus,
    Power,
    PowerOff,
    ShoppingCart,
    Star,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SelectMenu } from "@/components/ui/SelectMenu";
import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";
import { Table } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";

type ProdutoTipo = {
    id: number;
    codigo: string;
    nome: string;
};

type ProdutoImagem = {
    prd_produto_imagem_id: number;
    sys_arquivo_id: number;
    ordem: number;
    principal: number;
    public_url: string | null;
};

type ProdutoVariacao = {
    id: number;
    sku: string | null;
    nome: string;
    atributo_1: string | null;
    valor_1: string | null;
    atributo_2: string | null;
    valor_2: string | null;
    ordem: number;
    estoque_atual: number | null;
    ativo: number;
};

type ProdutoCampo = {
    id: number;
    codigo: string;
    nome: string;
    descricao: string | null;
    tipo: "texto" | "numero";
    obrigatorio: number;
    valor_unico: number;
    ordem: number;
    ativo: number;
};

type ProdutoComponente = {
    id: number;
    prd_produto_componente_id: number;
    quantidade: number;
    ordem: number;
    ativo: number;
    produto: {
        id: number;
        codigo: string;
        nome: string;
        ativo: number;
        controla_estoque: number;
        estoque_atual: number | null;
        variacoes: Array<{
            id: number;
            nome: string;
            estoque_atual: number | null;
        }>;
    };
};

type Produto = {
    id: number;
    prd_produto_tipo_id: number;
    codigo: string;
    slug: string;
    nome: string;
    descricao: string | null;
    preco_custo: number | null;
    preco_normal: number;
    preco_socio: number | null;
    modalidade_venda: "estoque" | "pre_venda";
    controla_estoque: number;
    estoque_atual: number | null;
    ativo: number;
    destaque: number;
    visivel_publico: number;
    inicio_exibicao: string | Date | null;
    fim_exibicao: string | Date | null;
    exibir_apos_encerramento: number;

    prd_produto_tipo: {
        id: number;
        codigo: string;
        nome: string;
    };

    imagens: ProdutoImagem[];
    imagem_principal: ProdutoImagem | null;
    variacoes: ProdutoVariacao[];
    campos: ProdutoCampo[];
    componentes: ProdutoComponente[];
    eh_kit: boolean;

    status:
        | "ativo"
        | "inativo"
        | "oculto"
        | "agendado"
        | "encerrado";
};

type AdminProdutosData = {
    tipos: ProdutoTipo[];
    produtos: Produto[];
};

type AdminProdutosClientProps = {
    initialData: AdminProdutosData;
};

type ProdutoFormState = {
    prd_produto_tipo_id: string;
    codigo: string;
    nome: string;
    descricao: string;
    preco_custo: string;
    preco_normal: string;
    preco_socio: string;
    modalidade_venda: "estoque" | "pre_venda";
    controla_estoque: boolean;
    estoque_atual: string;
    ativo: boolean;
    destaque: boolean;
    visivel_publico: boolean;
    inicio_exibicao: string;
    fim_exibicao: string;
    exibir_apos_encerramento: boolean;
};

type VariacaoForm = {
    clientKey: string;
    id?: number;
    nome: string;
    sku: string;
    atributo_1: string;
    valor_1: string;
    atributo_2: string;
    valor_2: string;
    estoque_atual: string;
    ativo: boolean;
};

type ComponenteForm = {
    clientKey: string;
    produtoId: string;
    quantidade: string;
};

type CampoForm = {
    clientKey: string;
    id?: number;
    codigo: string;
    nome: string;
    descricao: string;
    tipo: "texto" | "numero";
    obrigatorio: boolean;
    valorUnico: boolean;
    ativo: boolean;
};

type NovaImagem = {
    key: string;
    file: File;
    previewUrl: string;
};

const emptyForm: ProdutoFormState = {
    prd_produto_tipo_id: "",
    codigo: "",
    nome: "",
    descricao: "",
    preco_custo: "",
    preco_normal: "",
    preco_socio: "",
    modalidade_venda: "estoque",
    controla_estoque: false,
    estoque_atual: "",
    ativo: true,
    destaque: false,
    visivel_publico: true,
    inicio_exibicao: "",
    fim_exibicao: "",
    exibir_apos_encerramento: false,
};

function createClientKey(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDateTimeLocal(value: string | Date | null) {
    if (!value) return "";

    const date = new Date(value);
    const pad = (number: number) => String(number).padStart(2, "0");

    return [
        date.getFullYear(),
        "-",
        pad(date.getMonth() + 1),
        "-",
        pad(date.getDate()),
        "T",
        pad(date.getHours()),
        ":",
        pad(date.getMinutes()),
    ].join("");
}

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function suggestProductCode(nome: string) {
    const normalized = nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, " ")
        .trim();

    if (!normalized) return "";

    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .join("-")
        .slice(0, 60);
}

function getStatusBadge(status: Produto["status"]) {
    switch (status) {
        case "ativo":
            return { label: "Ativo", color: "success" as const };
        case "agendado":
            return { label: "Agendado", color: "info" as const };
        case "encerrado":
            return { label: "Encerrado", color: "warning" as const };
        case "oculto":
            return { label: "Oculto", color: "secondary" as const };
        case "inativo":
        default:
            return { label: "Inativo", color: "danger" as const };
    }
}

function produtoToForm(produto: Produto): ProdutoFormState {
    return {
        prd_produto_tipo_id: String(produto.prd_produto_tipo_id),
        codigo: produto.codigo,
        nome: produto.nome,
        descricao: produto.descricao ?? "",
        preco_custo:
            produto.preco_custo !== null
                ? String(produto.preco_custo)
                : "",
        preco_normal: String(produto.preco_normal),
        preco_socio:
            produto.preco_socio !== null
                ? String(produto.preco_socio)
                : "",
        modalidade_venda: produto.modalidade_venda ?? "estoque",
        controla_estoque: Boolean(produto.controla_estoque),
        estoque_atual:
            produto.estoque_atual !== null
                ? String(produto.estoque_atual)
                : "",
        ativo: Boolean(produto.ativo),
        destaque: Boolean(produto.destaque),
        visivel_publico: Boolean(produto.visivel_publico),
        inicio_exibicao: toDateTimeLocal(produto.inicio_exibicao),
        fim_exibicao: toDateTimeLocal(produto.fim_exibicao),
        exibir_apos_encerramento: Boolean(
            produto.exibir_apos_encerramento,
        ),
    };
}

function produtoVariacoesToForm(
    variacoes: ProdutoVariacao[],
): VariacaoForm[] {
    return variacoes.map((variacao) => ({
        clientKey: createClientKey("variacao"),
        id: variacao.id,
        nome: variacao.nome,
        sku: variacao.sku ?? "",
        atributo_1: variacao.atributo_1 ?? "",
        valor_1: variacao.valor_1 ?? "",
        atributo_2: variacao.atributo_2 ?? "",
        valor_2: variacao.valor_2 ?? "",
        estoque_atual:
            variacao.estoque_atual !== null
                ? String(variacao.estoque_atual)
                : "",
        ativo: Boolean(variacao.ativo),
    }));
}

function produtoComponentesToForm(
    componentes: ProdutoComponente[],
): ComponenteForm[] {
    return componentes
        .filter((componente) => Boolean(componente.ativo))
        .map((componente) => ({
            clientKey: createClientKey("componente"),
            produtoId: String(componente.prd_produto_componente_id),
            quantidade: String(componente.quantidade),
        }));
}

function produtoCamposToForm(
    campos: ProdutoCampo[],
): CampoForm[] {
    return campos.map((campo) => ({
        clientKey: createClientKey("campo"),
        id: campo.id,
        codigo: campo.codigo,
        nome: campo.nome,
        descricao: campo.descricao ?? "",
        tipo: campo.tipo,
        obrigatorio: Boolean(campo.obrigatorio),
        valorUnico: Boolean(campo.valor_unico),
        ativo: Boolean(campo.ativo),
    }));
}

export default function AdminProdutosClient({
                                                initialData,
                                            }: AdminProdutosClientProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [data, setData] = useState(initialData);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduto, setEditingProduto] =
        useState<Produto | null>(null);
    const [form, setForm] =
        useState<ProdutoFormState>(emptyForm);
    const [codigoManual, setCodigoManual] = useState(false);

    const [novasImagens, setNovasImagens] =
        useState<NovaImagem[]>([]);
    const [imagemIdsRemover, setImagemIdsRemover] =
        useState<number[]>([]);
    const [principalImageKey, setPrincipalImageKey] =
        useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const [variacoes, setVariacoes] =
        useState<VariacaoForm[]>([]);
    const [componentes, setComponentes] =
        useState<ComponenteForm[]>([]);
    const [campos, setCampos] =
        useState<CampoForm[]>([]);
    const [salvando, setSalvando] = useState(false);
    const [snackbar, setSnackbar] =
        useState<SnackbarState | null>(null);

    const [viewMode, setViewMode] =
        useState<"table" | "preview">("table");
    const [previewProduto, setPreviewProduto] =
        useState<Produto | null>(null);
    const [previewImagemUrl, setPreviewImagemUrl] =
        useState<string | null>(null);
    const [previewVariacaoId, setPreviewVariacaoId] =
        useState<number | null>(null);
    const [alterandoProdutoId, setAlterandoProdutoId] =
        useState<number | null>(null);

    const tiposOptions = useMemo(
        () =>
            data.tipos.map((tipo) => ({
                value: tipo.id,
                label: tipo.nome,
            })),
        [data.tipos],
    );

    const produtosComponenteOptions = useMemo(
        () =>
            data.produtos
                .filter(
                    (produto) =>
                        produto.id !== editingProduto?.id &&
                        Boolean(produto.ativo),
                )
                .map((produto) => ({
                    value: produto.id,
                    label: `${produto.nome} · ${produto.codigo}`,
                })),
        [data.produtos, editingProduto?.id],
    );

    const ehKit = componentes.length > 0;

    const imagensExistentesVisiveis = useMemo(
        () =>
            (editingProduto?.imagens ?? []).filter(
                (imagem) =>
                    !imagemIdsRemover.includes(
                        imagem.prd_produto_imagem_id,
                    ),
            ),
        [editingProduto, imagemIdsRemover],
    );

    function updateForm<K extends keyof ProdutoFormState>(
        key: K,
        value: ProdutoFormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function limparNovasImagens() {
        for (const imagem of novasImagens) {
            URL.revokeObjectURL(imagem.previewUrl);
        }

        setNovasImagens([]);
    }

    function resetImagens() {
        limparNovasImagens();
        setImagemIdsRemover([]);
        setPrincipalImageKey(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function abrirCriacao() {
        resetImagens();
        setEditingProduto(null);
        setVariacoes([]);
        setComponentes([]);
        setCampos([]);
        setCodigoManual(false);
        setForm({
            ...emptyForm,
            prd_produto_tipo_id: data.tipos[0]
                ? String(data.tipos[0].id)
                : "",
        });
        setSnackbar(null);
        setModalOpen(true);
    }

    function abrirEdicao(produto: Produto) {
        resetImagens();
        setEditingProduto(produto);
        setVariacoes(
            produtoVariacoesToForm(produto.variacoes ?? []),
        );
        setComponentes(
            produtoComponentesToForm(produto.componentes ?? []),
        );
        setCampos(
            produtoCamposToForm(produto.campos ?? []),
        );
        setCodigoManual(true);
        setForm(produtoToForm(produto));
        setPrincipalImageKey(
            produto.imagem_principal
                ? `existing:${produto.imagem_principal.prd_produto_imagem_id}`
                : produto.imagens[0]
                    ? `existing:${produto.imagens[0].prd_produto_imagem_id}`
                    : null,
        );
        setSnackbar(null);
        setModalOpen(true);
    }

    function fecharModal() {
        if (salvando) return;

        resetImagens();
        setModalOpen(false);
        setEditingProduto(null);
        setVariacoes([]);
        setComponentes([]);
        setCampos([]);
        setForm(emptyForm);
        setCodigoManual(false);
    }

    function handleNomeChange(value: string) {
        setForm((current) => ({
            ...current,
            nome: value,
            codigo: codigoManual
                ? current.codigo
                : suggestProductCode(value),
        }));
    }

    function handleCodigoChange(value: string) {
        setCodigoManual(true);
        updateForm(
            "codigo",
            value
                .toUpperCase()
                .replace(/\s+/g, "-")
                .slice(0, 60),
        );
    }

    function selecionarImagens(files: File[]) {
        const validas: NovaImagem[] = [];

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                setSnackbar({
                    color: "danger",
                    title: "Imagem inválida",
                    message: `${file.name} não é uma imagem válida.`,
                });
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({
                    color: "warning",
                    title: "Arquivo muito grande",
                    message: `${file.name} ultrapassa o limite de 5MB.`,
                });
                continue;
            }

            validas.push({
                key: createClientKey("imagem"),
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }

        if (validas.length === 0) return;

        setNovasImagens((current) => {
            const next = [...current, ...validas];

            if (!principalImageKey && next[0]) {
                setPrincipalImageKey(`new:${next[0].key}`);
            }

            return next;
        });
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        selecionarImagens(
            Array.from(event.target.files ?? []),
        );
        event.target.value = "";
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);

        selecionarImagens(
            Array.from(event.dataTransfer.files ?? []),
        );
    }

    function definirPrincipal(key: string) {
        setPrincipalImageKey(key);
    }

    function removerImagemExistente(imagem: ProdutoImagem) {
        const key =
            `existing:${imagem.prd_produto_imagem_id}`;

        setImagemIdsRemover((current) => [
            ...current,
            imagem.prd_produto_imagem_id,
        ]);

        if (principalImageKey === key) {
            const outraExistente =
                imagensExistentesVisiveis.find(
                    (item) =>
                        item.prd_produto_imagem_id !==
                        imagem.prd_produto_imagem_id,
                );

            if (outraExistente) {
                setPrincipalImageKey(
                    `existing:${outraExistente.prd_produto_imagem_id}`,
                );
            } else if (novasImagens[0]) {
                setPrincipalImageKey(
                    `new:${novasImagens[0].key}`,
                );
            } else {
                setPrincipalImageKey(null);
            }
        }
    }

    function removerNovaImagem(imagem: NovaImagem) {
        URL.revokeObjectURL(imagem.previewUrl);

        const restantes = novasImagens.filter(
            (item) => item.key !== imagem.key,
        );

        setNovasImagens(restantes);

        if (principalImageKey === `new:${imagem.key}`) {
            const existente = imagensExistentesVisiveis[0];

            if (existente) {
                setPrincipalImageKey(
                    `existing:${existente.prd_produto_imagem_id}`,
                );
            } else if (restantes[0]) {
                setPrincipalImageKey(
                    `new:${restantes[0].key}`,
                );
            } else {
                setPrincipalImageKey(null);
            }
        }
    }

    function adicionarVariacao() {
        setVariacoes((current) => [
            ...current,
            {
                clientKey: createClientKey("variacao"),
                nome: "",
                sku: "",
                atributo_1: "",
                valor_1: "",
                atributo_2: "",
                valor_2: "",
                estoque_atual: "",
                ativo: true,
            },
        ]);
    }

    function updateVariacao(
        clientKey: string,
        field: keyof Omit<VariacaoForm, "clientKey" | "id">,
        value: string | boolean,
    ) {
        setVariacoes((current) =>
            current.map((variacao) =>
                variacao.clientKey === clientKey
                    ? {
                        ...variacao,
                        [field]: value,
                    }
                    : variacao,
            ),
        );
    }

    function removerVariacao(clientKey: string) {
        setVariacoes((current) =>
            current.filter(
                (variacao) =>
                    variacao.clientKey !== clientKey,
            ),
        );
    }

    function adicionarComponente() {
        setComponentes((current) => [
            ...current,
            {
                clientKey: createClientKey("componente"),
                produtoId: "",
                quantidade: "1",
            },
        ]);

        if (form.controla_estoque) {
            updateForm("controla_estoque", false);
        }
    }

    function updateComponente(
        clientKey: string,
        field: "produtoId" | "quantidade",
        value: string,
    ) {
        setComponentes((current) =>
            current.map((componente) =>
                componente.clientKey === clientKey
                    ? {
                        ...componente,
                        [field]: value,
                    }
                    : componente,
            ),
        );
    }

    function removerComponente(clientKey: string) {
        setComponentes((current) =>
            current.filter(
                (componente) =>
                    componente.clientKey !== clientKey,
            ),
        );
    }

    function adicionarCampo() {
        setCampos((current) => [
            ...current,
            {
                clientKey: createClientKey("campo"),
                codigo: "",
                nome: "",
                descricao: "",
                tipo: "texto",
                obrigatorio: false,
                valorUnico: false,
                ativo: true,
            },
        ]);
    }

    function updateCampo(
        clientKey: string,
        field: keyof Omit<CampoForm, "clientKey" | "id">,
        value: string | boolean,
    ) {
        setCampos((current) =>
            current.map((campo) =>
                campo.clientKey === clientKey
                    ? {
                        ...campo,
                        [field]: value,
                    }
                    : campo,
            ),
        );
    }

    function removerCampo(clientKey: string) {
        setCampos((current) =>
            current.filter(
                (campo) => campo.clientKey !== clientKey,
            ),
        );
    }

    function buildPrincipalRef() {
        if (!principalImageKey) return "";

        if (principalImageKey.startsWith("existing:")) {
            return principalImageKey;
        }

        const key = principalImageKey.replace("new:", "");
        const index = novasImagens.findIndex(
            (imagem) => imagem.key === key,
        );

        return index >= 0 ? `new:${index}` : "";
    }

    function buildFormData() {
        const payload = new FormData();

        payload.set(
            "prd_produto_tipo_id",
            form.prd_produto_tipo_id,
        );
        payload.set("codigo", form.codigo);
        payload.set("nome", form.nome);
        payload.set("descricao", form.descricao);
        payload.set("preco_custo", form.preco_custo);
        payload.set("preco_normal", form.preco_normal);
        payload.set("preco_socio", form.preco_socio);
        payload.set("modalidade_venda", form.modalidade_venda);
        payload.set(
            "controla_estoque",
            !ehKit && form.controla_estoque ? "1" : "0",
        );
        payload.set(
            "estoque_atual",
            ehKit || variacoes.length > 0
                ? ""
                : form.estoque_atual,
        );
        payload.set("ativo", form.ativo ? "1" : "0");
        payload.set(
            "destaque",
            form.destaque ? "1" : "0",
        );
        payload.set(
            "visivel_publico",
            form.visivel_publico ? "1" : "0",
        );
        payload.set(
            "inicio_exibicao",
            form.inicio_exibicao,
        );
        payload.set(
            "fim_exibicao",
            form.fim_exibicao,
        );
        payload.set(
            "exibir_apos_encerramento",
            form.exibir_apos_encerramento ? "1" : "0",
        );

        payload.set(
            "variacoes",
            JSON.stringify(
                variacoes.map((variacao) => ({
                    id: variacao.id,
                    nome: variacao.nome,
                    sku: variacao.sku || null,
                    atributo_1:
                        variacao.atributo_1 || null,
                    valor_1: variacao.valor_1 || null,
                    atributo_2:
                        variacao.atributo_2 || null,
                    valor_2: variacao.valor_2 || null,
                    estoque_atual:
                        variacao.estoque_atual === ""
                            ? null
                            : Number(
                                variacao.estoque_atual,
                            ),
                    ativo: variacao.ativo,
                })),
            ),
        );

        payload.set(
            "componentes",
            JSON.stringify(
                componentes.map((componente) => ({
                    prd_produto_componente_id: Number(
                        componente.produtoId,
                    ),
                    quantidade: Number(
                        componente.quantidade,
                    ),
                })),
            ),
        );

        payload.set(
            "campos",
            JSON.stringify(
                campos.map((campo) => ({
                    id: campo.id,
                    codigo: campo.codigo,
                    nome: campo.nome,
                    descricao: campo.descricao || null,
                    tipo: campo.tipo,
                    obrigatorio: campo.obrigatorio,
                    valor_unico: campo.valorUnico,
                    ativo: campo.ativo,
                })),
            ),
        );

        payload.set(
            "remover_imagem_ids",
            JSON.stringify(imagemIdsRemover),
        );
        payload.set(
            "imagem_principal_ref",
            buildPrincipalRef(),
        );

        for (const imagem of novasImagens) {
            payload.append("imagens", imagem.file);
        }

        return payload;
    }

    async function salvar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!form.prd_produto_tipo_id) {
            setSnackbar({
                color: "warning",
                title: "Tipo obrigatório",
                message: "Selecione o tipo do produto.",
            });
            return;
        }

        if (
            variacoes.some(
                (variacao) =>
                    variacao.nome.trim().length === 0,
            )
        ) {
            setSnackbar({
                color: "warning",
                title: "Variação incompleta",
                message:
                    "Informe um nome para todas as variações.",
            });
            return;
        }

        if (componentes.length > 0 && variacoes.length > 0) {
            setSnackbar({
                color: "warning",
                title: "Kit com variação própria",
                message:
                    "Um kit não deve possuir variações próprias. As opções são escolhidas nas variações dos produtos que compõem o kit.",
            });
            return;
        }

        if (
            componentes.some(
                (componente) =>
                    !componente.produtoId ||
                    !Number.isInteger(Number(componente.quantidade)) ||
                    Number(componente.quantidade) <= 0,
            )
        ) {
            setSnackbar({
                color: "warning",
                title: "Componente incompleto",
                message:
                    "Selecione o produto e informe uma quantidade válida para todos os componentes do kit.",
            });
            return;
        }

        if (
            new Set(
                componentes.map((componente) => componente.produtoId),
            ).size !== componentes.length
        ) {
            setSnackbar({
                color: "warning",
                title: "Componente repetido",
                message:
                    "O mesmo produto não pode aparecer duas vezes no kit.",
            });
            return;
        }

        if (
            campos.some(
                (campo) =>
                    campo.nome.trim().length < 2 ||
                    campo.codigo.trim().length === 0,
            )
        ) {
            setSnackbar({
                color: "warning",
                title: "Campo personalizado incompleto",
                message:
                    "Informe nome e código para todos os campos personalizados.",
            });
            return;
        }

        try {
            setSalvando(true);
            setSnackbar(null);

            const isEditing = Boolean(editingProduto);

            const response = await fetch(
                isEditing
                    ? `/api/admin/produtos/${editingProduto!.id}`
                    : "/api/admin/produtos",
                {
                    method: isEditing ? "PATCH" : "POST",
                    body: buildFormData(),
                },
            );

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar o produto.",
                );
            }

            const produto =
                result.data.produto as Produto;

            setData((current) => {
                const exists = current.produtos.some(
                    (item) => item.id === produto.id,
                );

                return {
                    ...current,
                    produtos: exists
                        ? current.produtos.map((item) =>
                            item.id === produto.id
                                ? produto
                                : item,
                        )
                        : [produto, ...current.produtos],
                };
            });

            resetImagens();
            setModalOpen(false);
            setEditingProduto(null);
            setVariacoes([]);
            setComponentes([]);
            setCampos([]);
            setForm(emptyForm);
            setCodigoManual(false);

            setSnackbar({
                color: "success",
                title: isEditing
                    ? "Produto atualizado"
                    : "Produto criado",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao salvar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar o produto.",
                autoClose: false,
            });
        } finally {
            setSalvando(false);
        }
    }


    function abrirPreview(produto: Produto) {
        setPreviewProduto(produto);
        setPreviewImagemUrl(
            produto.imagem_principal?.public_url ??
            produto.imagens.find((imagem) => imagem.public_url)
                ?.public_url ??
            null,
        );

        const primeiraVariacaoAtiva =
            produto.variacoes.find(
                (variacao) => Boolean(variacao.ativo),
            );

        setPreviewVariacaoId(
            primeiraVariacaoAtiva?.id ?? null,
        );
    }

    function fecharPreview() {
        setPreviewProduto(null);
        setPreviewImagemUrl(null);
        setPreviewVariacaoId(null);
    }

    async function alternarAtivo(produto: Produto) {
        try {
            setAlterandoProdutoId(produto.id);
            setSnackbar(null);

            const novoAtivo = !Boolean(produto.ativo);

            const response = await fetch(
                `/api/admin/produtos/${produto.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        action: "set_ativo",
                        ativo: novoAtivo,
                    }),
                },
            );

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Não foi possível alterar o produto.",
                );
            }

            const atualizado =
                result.data.produto as Produto;

            setData((current) => ({
                ...current,
                produtos: current.produtos.map((item) =>
                    item.id === atualizado.id
                        ? atualizado
                        : item,
                ),
            }));

            setSnackbar({
                color: "success",
                title: novoAtivo
                    ? "Produto ativado"
                    : "Produto desativado",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao alterar produto",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o produto.",
                autoClose: false,
            });
        } finally {
            setAlterandoProdutoId(null);
        }
    }

    async function excluirProduto(produto: Produto) {
        const confirmado = window.confirm(
            `Excluir "${produto.nome}"? O produto será removido das listagens, mas o histórico será preservado.`,
        );

        if (!confirmado) return;

        try {
            setAlterandoProdutoId(produto.id);
            setSnackbar(null);

            const response = await fetch(
                `/api/admin/produtos/${produto.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                    },
                },
            );

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Não foi possível excluir o produto.",
                );
            }

            setData((current) => ({
                ...current,
                produtos: current.produtos.filter(
                    (item) => item.id !== produto.id,
                ),
            }));

            if (previewProduto?.id === produto.id) {
                fecharPreview();
            }

            setSnackbar({
                color: "success",
                title: "Produto excluído",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao excluir produto",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o produto.",
                autoClose: false,
            });
        } finally {
            setAlterandoProdutoId(null);
        }
    }

    const previewVariacaoSelecionada =
        previewProduto?.variacoes.find(
            (variacao) =>
                variacao.id === previewVariacaoId,
        ) ?? null;

    return (
        <>
            <PageHeader
                title="Produtos"
                subtitle="Cadastre e gerencie os produtos disponíveis para venda."
                actions={
                    <div className="bp-product-page-actions">
                        <div
                            className="bp-product-view-switch"
                            aria-label="Modo de visualização"
                        >
                            <button
                                type="button"
                                className={
                                    viewMode === "table"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode("table")
                                }
                            >
                                <List size={16} />
                                Tabela
                            </button>

                            <button
                                type="button"
                                className={
                                    viewMode === "preview"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode("preview")
                                }
                            >
                                <LayoutGrid size={16} />
                                Prévia da loja
                            </button>
                        </div>

                        <Button onClick={abrirCriacao}>
                            <Plus size={17} />
                            Criar produto
                        </Button>
                    </div>
                }
            />

            {data.produtos.length === 0 ? (
                <EmptyState
                    icon={<Package size={24} />}
                    title="Nenhum produto cadastrado"
                    description="Crie o primeiro produto para começar a organizar as vendas."
                    action={
                        <Button onClick={abrirCriacao}>
                            <Plus size={17} />
                            Criar produto
                        </Button>
                    }
                />
            ) : viewMode === "table" ? (

                <>
                    <Table
                        headers={[
                            "Produto",
                            "Tipo",
                            "Preço",
                            "Estoque",
                            "Status",
                            "Ações",
                        ]}
                    >
                        {data.produtos.map((produto) => {
                            const status =
                                getStatusBadge(produto.status);
                            const busy =
                                alterandoProdutoId ===
                                produto.id;

                            return (
                                <tr key={produto.id}>
                                    <td>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="bp-product-table-thumb"
                                                onClick={() =>
                                                    abrirPreview(
                                                        produto,
                                                    )
                                                }
                                                title="Abrir prévia"
                                            >
                                                {produto
                                                    .imagem_principal
                                                    ?.public_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            produto
                                                                .imagem_principal
                                                                .public_url
                                                        }
                                                        alt=""
                                                    />
                                                ) : (
                                                    <Package
                                                        size={19}
                                                    />
                                                )}
                                            </button>

                                            <div>
                                                <strong>
                                                    {produto.nome}
                                                </strong>
                                                <div className="bp-product-table-meta">
                                                    {produto.codigo}
                                                    {produto.eh_kit
                                                        ? ` · Kit com ${produto.componentes.length} item(ns)`
                                                        : produto
                                                            .variacoes
                                                            .length > 0
                                                            ? ` · ${produto.variacoes.length} variação(ões)`
                                                            : ""}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {
                                            produto
                                                .prd_produto_tipo
                                                .nome
                                        }
                                    </td>

                                    <td>
                                        <div>
                                            <strong>
                                                {money(
                                                    produto.preco_normal,
                                                )}
                                            </strong>
                                            {produto.preco_socio !==
                                                null && (
                                                    <div className="bp-product-table-meta">
                                                        Sócio:{" "}
                                                        {money(
                                                            produto.preco_socio,
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </td>

                                    <td>
                                        {produto.eh_kit
                                            ? "Por componentes"
                                            : produto.variacoes.length >
                                            0
                                                ? "Por variação"
                                                : produto.controla_estoque
                                                    ? produto.estoque_atual ??
                                                    0
                                                    : "Livre"}
                                    </td>

                                    <td>
                                        <Badge
                                            color={status.color}
                                        >
                                            {status.label}
                                        </Badge>
                                    </td>

                                    <td>
                                        <div className="bp-product-row-actions">
                                            <Button
                                                color="secondary"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    abrirPreview(
                                                        produto,
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                <Eye size={16} />
                                                Ver
                                            </Button>

                                            <Button
                                                color={
                                                    produto.ativo
                                                        ? "warning"
                                                        : "success"
                                                }
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    alternarAtivo(
                                                        produto,
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                {produto.ativo ? (
                                                    <PowerOff
                                                        size={16}
                                                    />
                                                ) : (
                                                    <Power
                                                        size={16}
                                                    />
                                                )}
                                                {produto.ativo
                                                    ? "Desativar"
                                                    : "Ativar"}
                                            </Button>

                                            <Button
                                                color="secondary"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    abrirEdicao(
                                                        produto,
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                <Pencil
                                                    size={16}
                                                />
                                                Editar
                                            </Button>

                                            <Button
                                                color="danger"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    excluirProduto(
                                                        produto,
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                <Trash2
                                                    size={16}
                                                />
                                                Excluir
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>

                    <div className="bp-product-admin-mobile-list">
                        {data.produtos.map((produto) => {
                            const status =
                                getStatusBadge(produto.status);
                            const busy =
                                alterandoProdutoId === produto.id;

                            return (
                                <article
                                    key={produto.id}
                                    className="bp-product-admin-mobile-card"
                                >
                                    <div className="bp-product-admin-mobile-head">
                                        <button
                                            type="button"
                                            className="bp-product-admin-mobile-image"
                                            onClick={() =>
                                                abrirPreview(produto)
                                            }
                                            aria-label={`Ver prévia de ${produto.nome}`}
                                        >
                                            {produto
                                                .imagem_principal
                                                ?.public_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={
                                                        produto
                                                            .imagem_principal
                                                            .public_url
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <Package size={24} />
                                            )}
                                        </button>

                                        <div className="bp-product-admin-mobile-title">
                                            <div className="bp-product-admin-mobile-title-row">
                                                <strong>
                                                    {produto.nome}
                                                </strong>

                                                <Badge
                                                    color={status.color}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>

                                            <span>
                                                {produto.codigo}
                                            </span>

                                            <small>
                                                {
                                                    produto
                                                        .prd_produto_tipo
                                                        .nome
                                                }
                                            </small>
                                        </div>
                                    </div>

                                    <div className="bp-product-admin-mobile-info">
                                        <div>
                                            <span>Preço</span>
                                            <strong>
                                                {money(
                                                    produto.preco_normal,
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Sócio</span>
                                            <strong>
                                                {produto.preco_socio !==
                                                null
                                                    ? money(
                                                        produto.preco_socio,
                                                    )
                                                    : "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Estoque</span>
                                            <strong>
                                                {produto.eh_kit
                                                    ? "Por componentes"
                                                    : produto
                                                        .variacoes
                                                        .length > 0
                                                        ? "Por variação"
                                                        : produto.controla_estoque
                                                            ? String(
                                                                produto.estoque_atual ??
                                                                0,
                                                            )
                                                            : "Livre"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Variações</span>
                                            <strong>
                                                {
                                                    produto
                                                        .variacoes
                                                        .length
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="bp-product-admin-mobile-actions">
                                        <Button
                                            color="secondary"
                                            variant="soft"
                                            size="sm"
                                            onClick={() =>
                                                abrirPreview(produto)
                                            }
                                            disabled={busy}
                                        >
                                            <Eye size={16} />
                                            Ver
                                        </Button>

                                        <Button
                                            color="secondary"
                                            variant="soft"
                                            size="sm"
                                            onClick={() =>
                                                abrirEdicao(produto)
                                            }
                                            disabled={busy}
                                        >
                                            <Pencil size={16} />
                                            Editar
                                        </Button>

                                        <Button
                                            color={
                                                produto.ativo
                                                    ? "warning"
                                                    : "success"
                                            }
                                            variant="soft"
                                            size="sm"
                                            onClick={() =>
                                                alternarAtivo(
                                                    produto,
                                                )
                                            }
                                            disabled={busy}
                                        >
                                            {produto.ativo ? (
                                                <PowerOff
                                                    size={16}
                                                />
                                            ) : (
                                                <Power size={16} />
                                            )}

                                            {produto.ativo
                                                ? "Desativar"
                                                : "Ativar"}
                                        </Button>

                                        <Button
                                            color="danger"
                                            variant="soft"
                                            size="sm"
                                            onClick={() =>
                                                excluirProduto(
                                                    produto,
                                                )
                                            }
                                            disabled={busy}
                                        >
                                            <Trash2 size={16} />
                                            Excluir
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="bp-product-preview-grid">
                    {data.produtos.map((produto) => {
                        const status =
                            getStatusBadge(produto.status);

                        return (
                            <button
                                key={produto.id}
                                type="button"
                                className="bp-store-product-card"
                                onClick={() =>
                                    abrirPreview(produto)
                                }
                            >
                                <div className="bp-store-product-card-image">
                                    {produto
                                        .imagem_principal
                                        ?.public_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={
                                                produto
                                                    .imagem_principal
                                                    .public_url
                                            }
                                            alt={
                                                produto.nome
                                            }
                                        />
                                    ) : (
                                        <Package
                                            size={34}
                                        />
                                    )}

                                    <div className="bp-store-product-card-badges">
                                        {produto.destaque ? (
                                            <Badge color="success">
                                                Destaque
                                            </Badge>
                                        ) : null}
                                        <Badge
                                            color={
                                                status.color
                                            }
                                        >
                                            {status.label}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="bp-store-product-card-body">
                                    <span className="bp-store-product-type">
                                        {
                                            produto
                                                .prd_produto_tipo
                                                .nome
                                        }
                                    </span>

                                    <strong className="bp-store-product-name">
                                        {produto.nome}
                                    </strong>

                                    <span className="bp-store-product-description">
                                        {produto.descricao ||
                                            "Sem descrição."}
                                    </span>

                                    <div className="bp-store-product-price">
                                        <strong>
                                            {money(
                                                produto.preco_normal,
                                            )}
                                        </strong>

                                        {produto.preco_socio !==
                                        null ? (
                                            <span>
                                                Sócio{" "}
                                                {money(
                                                    produto.preco_socio,
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <Modal
                open={modalOpen}
                size="xl"
                title={
                    editingProduto
                        ? "Editar produto"
                        : "Criar produto"
                }
                description={
                    editingProduto
                        ? "Atualize as informações, imagens, variações, kit e personalização do produto."
                        : "Cadastre o produto e configure, quando necessário, variações, kit e personalização."
                }
                onCloseAction={fecharModal}
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={fecharModal}
                            disabled={salvando}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="produto-form"
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : editingProduto
                                    ? "Salvar alterações"
                                    : "Criar produto"}
                        </Button>
                    </>
                }
            >
                <form
                    onSubmit={salvar}
                    id="produto-form"

                    className="bp-product-form"
                >
                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Imagens do produto
                                </h3>
                                <span className="bp-field-help">
                                    A imagem marcada como principal
                                    será usada nas listagens.
                                </span>
                            </div>
                            <ImagePlus size={20} />
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            hidden
                        />

                        <div
                            role="button"
                            tabIndex={0}
                            className={`bp-product-dropzone ${
                                dragging
                                    ? "is-dragging"
                                    : ""
                            }`}
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() =>
                                setDragging(false)
                            }
                            onDrop={handleDrop}
                        >
                            <div className="bp-product-dropzone-content">
                                <Upload size={26} />
                                <strong>
                                    Arraste imagens aqui ou clique
                                    para selecionar
                                </strong>
                                <span>
                                    Você pode selecionar várias
                                    imagens. Máximo de 5MB por
                                    arquivo.
                                </span>
                            </div>
                        </div>

                        {(imagensExistentesVisiveis.length >
                            0 ||
                            novasImagens.length > 0) && (
                            <div className="bp-product-image-grid">
                                {imagensExistentesVisiveis.map(
                                    (imagem) => {
                                        const key =
                                            `existing:${imagem.prd_produto_imagem_id}`;
                                        const principal =
                                            principalImageKey ===
                                            key;

                                        return (
                                            <div
                                                key={key}
                                                className={`bp-product-image-card ${
                                                    principal
                                                        ? "is-principal"
                                                        : ""
                                                }`}
                                            >
                                                {imagem.public_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            imagem.public_url
                                                        }
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            minHeight:
                                                                128,
                                                            display:
                                                                "grid",
                                                            placeItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Package
                                                            size={
                                                                24
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                <div className="bp-product-image-actions">
                                                    <button
                                                        type="button"
                                                        className={`bp-product-image-chip ${
                                                            principal
                                                                ? "is-active"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            definirPrincipal(
                                                                key,
                                                            )
                                                        }
                                                    >
                                                        <Star
                                                            size={
                                                                12
                                                            }
                                                        />{" "}
                                                        {principal
                                                            ? "Principal"
                                                            : "Definir"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="bp-product-image-remove"
                                                        onClick={() =>
                                                            removerImagemExistente(
                                                                imagem,
                                                            )
                                                        }
                                                        aria-label="Remover imagem"
                                                    >
                                                        <X
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}

                                {novasImagens.map(
                                    (imagem) => {
                                        const key =
                                            `new:${imagem.key}`;
                                        const principal =
                                            principalImageKey ===
                                            key;

                                        return (
                                            <div
                                                key={imagem.key}
                                                className={`bp-product-image-card ${
                                                    principal
                                                        ? "is-principal"
                                                        : ""
                                                }`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={
                                                        imagem.previewUrl
                                                    }
                                                    alt={
                                                        imagem.file
                                                            .name
                                                    }
                                                />

                                                <div className="bp-product-image-actions">
                                                    <button
                                                        type="button"
                                                        className={`bp-product-image-chip ${
                                                            principal
                                                                ? "is-active"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            definirPrincipal(
                                                                key,
                                                            )
                                                        }
                                                    >
                                                        <Star
                                                            size={
                                                                12
                                                            }
                                                        />{" "}
                                                        {principal
                                                            ? "Principal"
                                                            : "Definir"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="bp-product-image-remove"
                                                        onClick={() =>
                                                            removerNovaImagem(
                                                                imagem,
                                                            )
                                                        }
                                                        aria-label="Remover imagem"
                                                    >
                                                        <X
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <h3 className="bp-product-section-title">
                                Informações do produto
                            </h3>
                        </div>

                        <div className="bp-product-grid">
                            <SelectMenu
                                label="Tipo"
                                value={
                                    form.prd_produto_tipo_id
                                }
                                onChange={(value) =>
                                    updateForm(
                                        "prd_produto_tipo_id",
                                        value,
                                    )
                                }
                                options={tiposOptions}
                                placeholder="Selecione"
                                required
                            />

                            <Input
                                label="Nome"
                                value={form.nome}
                                onChange={(event) =>
                                    handleNomeChange(
                                        event.target.value,
                                    )
                                }
                                placeholder="Nome do produto"
                                maxLength={150}
                                required
                            />

                            <Input
                                label="Código"
                                value={form.codigo}
                                onChange={(event) =>
                                    handleCodigoChange(
                                        event.target.value,
                                    )
                                }
                                placeholder="Ex.: CANECA-AAACCU"
                                maxLength={60}
                                helperText="Gerado pelo nome até você editar manualmente."
                                required
                            />
                        </div>

                        <Textarea
                            label="Descrição"
                            value={form.descricao}
                            onChange={(event) =>
                                updateForm(
                                    "descricao",
                                    event.target.value,
                                )
                            }
                            rows={4}
                            placeholder="Descrição do produto"
                        />
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <h3 className="bp-product-section-title">
                                Preços
                            </h3>
                        </div>

                        <div className="bp-product-grid">
                            <Input
                                label="Preço normal"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.preco_normal}
                                onChange={(event) =>
                                    updateForm(
                                        "preco_normal",
                                        event.target.value,
                                    )
                                }
                                required
                            />

                            <Input
                                label="Preço de sócio"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.preco_socio}
                                onChange={(event) =>
                                    updateForm(
                                        "preco_socio",
                                        event.target.value,
                                    )
                                }
                                helperText="Opcional."
                            />

                            <Input
                                label="Preço de custo"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.preco_custo}
                                onChange={(event) =>
                                    updateForm(
                                        "preco_custo",
                                        event.target.value,
                                    )
                                }
                                helperText="Opcional, para controle interno."
                            />
                        </div>
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Variações
                                </h3>
                                <span className="bp-field-help">
                                    Deixe vazio quando o produto
                                    tiver uma única configuração.
                                    Exemplos: Preto / M ou Preta /
                                    850ml.
                                </span>
                            </div>

                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                size="sm"
                                onClick={adicionarVariacao}
                            >
                                <Plus size={15} />
                                Adicionar variação
                            </Button>
                        </div>

                        {variacoes.length === 0 ? (
                            <div className="bp-field-help">
                                Sem variações. O cliente compra o
                                produto diretamente.
                            </div>
                        ) : (
                            <div className="bp-product-variation-list">
                                {variacoes.map(
                                    (variacao, index) => (
                                        <div
                                            key={
                                                variacao.clientKey
                                            }
                                            className="bp-product-variation"
                                        >
                                            <div className="bp-product-section-header">
                                                <strong>
                                                    Variação{" "}
                                                    {index + 1}
                                                </strong>

                                                <Button
                                                    type="button"
                                                    color="danger"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removerVariacao(
                                                            variacao.clientKey,
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={
                                                            15
                                                        }
                                                    />
                                                    Remover
                                                </Button>
                                            </div>

                                            <div className="bp-product-variation-grid">
                                                <Input
                                                    label="Nome"
                                                    value={
                                                        variacao.nome
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "nome",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Ex.: Preto / M"
                                                    required
                                                />

                                                <Input
                                                    label="SKU"
                                                    value={
                                                        variacao.sku
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "sku",
                                                            event
                                                                .target
                                                                .value
                                                                .toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="Opcional"
                                                />

                                                <Input
                                                    label="Opção 1"
                                                    value={
                                                        variacao.atributo_1
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "atributo_1",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Cor"
                                                />

                                                <Input
                                                    label="Valor 1"
                                                    value={
                                                        variacao.valor_1
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "valor_1",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Preto"
                                                />

                                                <Input
                                                    label="Estoque"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={
                                                        variacao.estoque_atual
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "estoque_atual",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Opcional"
                                                />
                                            </div>

                                            <div className="bp-product-grid">
                                                <Input
                                                    label="Opção 2"
                                                    value={
                                                        variacao.atributo_2
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "atributo_2",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Tamanho / Capacidade"
                                                />

                                                <Input
                                                    label="Valor 2"
                                                    value={
                                                        variacao.valor_2
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateVariacao(
                                                            variacao.clientKey,
                                                            "valor_2",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="M / 850ml"
                                                />

                                                <label className="bp-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            variacao.ativo
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateVariacao(
                                                                variacao.clientKey,
                                                                "ativo",
                                                                event
                                                                    .target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    Variação ativa
                                                </label>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Composição do kit
                                </h3>
                                <span className="bp-field-help">
                                    Adicione produtos quando este cadastro representar um pacote. Se um componente possuir variações, como tamanho de camiseta, o cliente escolherá a variação desse componente na compra.
                                </span>
                            </div>

                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                size="sm"
                                onClick={adicionarComponente}
                            >
                                <Plus size={15} />
                                Adicionar produto
                            </Button>
                        </div>

                        {componentes.length === 0 ? (
                            <div className="bp-field-help">
                                Este produto não é um kit.
                            </div>
                        ) : (
                            <div className="bp-product-variation-list">
                                {componentes.map(
                                    (componente, index) => {
                                        const produtoSelecionado =
                                            data.produtos.find(
                                                (produto) =>
                                                    produto.id ===
                                                    Number(
                                                        componente.produtoId,
                                                    ),
                                            );

                                        return (
                                            <div
                                                key={
                                                    componente.clientKey
                                                }
                                                className="bp-product-variation"
                                            >
                                                <div className="bp-product-section-header">
                                                    <strong>
                                                        Componente{" "}
                                                        {index + 1}
                                                    </strong>

                                                    <Button
                                                        type="button"
                                                        color="danger"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removerComponente(
                                                                componente.clientKey,
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            size={15}
                                                        />
                                                        Remover
                                                    </Button>
                                                </div>

                                                <div className="bp-product-grid">
                                                    <SelectMenu
                                                        label="Produto"
                                                        value={
                                                            componente.produtoId
                                                        }
                                                        onChange={(
                                                            value,
                                                        ) =>
                                                            updateComponente(
                                                                componente.clientKey,
                                                                "produtoId",
                                                                String(
                                                                    value,
                                                                ),
                                                            )
                                                        }
                                                        options={
                                                            produtosComponenteOptions
                                                        }
                                                        placeholder="Selecione um produto"
                                                    />

                                                    <Input
                                                        label="Quantidade no kit"
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={
                                                            componente.quantidade
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateComponente(
                                                                componente.clientKey,
                                                                "quantidade",
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>

                                                {produtoSelecionado ? (
                                                    <div className="bp-field-help">
                                                        {produtoSelecionado
                                                            .variacoes
                                                            .length >
                                                        0
                                                            ? `${produtoSelecionado.nome} possui ${produtoSelecionado.variacoes.length} variação(ões). A escolha será feita pelo cliente dentro do kit.`
                                                            : `${produtoSelecionado.nome} não possui variações.`}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        )}

                        {ehKit ? (
                            <div
                                className="bp-field-help"
                                style={{ marginTop: 12 }}
                            >
                                Kits não possuem estoque próprio. A disponibilidade será calculada pelo estoque dos componentes selecionados.
                            </div>
                        ) : null}
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Campos de personalização
                                </h3>
                                <span className="bp-field-help">
                                    Use para dados que o cliente precisa informar na compra, como nome nas costas ou número da camiseta.
                                </span>
                            </div>

                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                size="sm"
                                onClick={adicionarCampo}
                            >
                                <Plus size={15} />
                                Adicionar campo
                            </Button>
                        </div>

                        {campos.length === 0 ? (
                            <div className="bp-field-help">
                                Nenhuma personalização configurada.
                            </div>
                        ) : (
                            <div className="bp-product-variation-list">
                                {campos.map((campo, index) => (
                                    <div
                                        key={campo.clientKey}
                                        className="bp-product-variation"
                                    >
                                        <div className="bp-product-section-header">
                                            <strong>
                                                Campo {index + 1}
                                            </strong>

                                            <Button
                                                type="button"
                                                color="danger"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removerCampo(
                                                        campo.clientKey,
                                                    )
                                                }
                                            >
                                                <Trash2 size={15} />
                                                Remover
                                            </Button>
                                        </div>

                                        <div className="bp-product-grid">
                                            <Input
                                                label="Nome"
                                                value={campo.nome}
                                                onChange={(event) =>
                                                    updateCampo(
                                                        campo.clientKey,
                                                        "nome",
                                                        event.target
                                                            .value,
                                                    )
                                                }
                                                placeholder="Ex.: Nome nas costas"
                                                required
                                            />

                                            <Input
                                                label="Código"
                                                value={campo.codigo}
                                                onChange={(event) =>
                                                    updateCampo(
                                                        campo.clientKey,
                                                        "codigo",
                                                        event.target.value
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                "_",
                                                            )
                                                            .slice(
                                                                0,
                                                                60,
                                                            ),
                                                    )
                                                }
                                                placeholder="nome_costas"
                                                helperText="Identificador interno do campo."
                                                required
                                            />

                                            <SelectMenu
                                                label="Tipo"
                                                value={campo.tipo}
                                                onChange={(value) =>
                                                    updateCampo(
                                                        campo.clientKey,
                                                        "tipo",
                                                        String(
                                                            value,
                                                        ) ===
                                                        "numero"
                                                            ? "numero"
                                                            : "texto",
                                                    )
                                                }
                                                options={[
                                                    {
                                                        value: "texto",
                                                        label: "Texto",
                                                    },
                                                    {
                                                        value: "numero",
                                                        label: "Número",
                                                    },
                                                ]}
                                            />
                                        </div>

                                        <Textarea
                                            label="Descrição"
                                            value={campo.descricao}
                                            onChange={(event) =>
                                                updateCampo(
                                                    campo.clientKey,
                                                    "descricao",
                                                    event.target.value,
                                                )
                                            }
                                            rows={2}
                                            placeholder="Orientação opcional para o cliente."
                                        />

                                        <div className="bp-product-switches">
                                            <label className="bp-check">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        campo.obrigatorio
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateCampo(
                                                            campo.clientKey,
                                                            "obrigatorio",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                Campo obrigatório
                                            </label>

                                            <label className="bp-check">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        campo.valorUnico
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateCampo(
                                                            campo.clientKey,
                                                            "valorUnico",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                <span>
                                                    Valor único
                                                    <span className="bp-field-help">
                                                        Impede repetir o mesmo valor dentro do contexto de venda. Ex.: número da jersey.
                                                    </span>
                                                </span>
                                            </label>

                                            <label className="bp-check">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        campo.ativo
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateCampo(
                                                            campo.clientKey,
                                                            "ativo",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                Campo ativo
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <h3 className="bp-product-section-title">
                                Estoque e publicação
                            </h3>
                        </div>

                        <div className="bp-product-grid">
                            <SelectMenu
                                label="Modalidade da venda"
                                value={form.modalidade_venda}
                                onChange={(value) =>
                                    updateForm(
                                        "modalidade_venda",
                                        value as "estoque" | "pre_venda",
                                    )
                                }
                                options={[
                                    { value: "estoque", label: "Estoque" },
                                    { value: "pre_venda", label: "Pré-venda" },
                                ]}
                                helperText={
                                    form.modalidade_venda === "pre_venda"
                                        ? "Pré-venda não limita a compra pelo estoque físico."
                                        : "Venda normal usando estoque e reservas."
                                }
                            />

                            <Input
                                label="Início da exibição"
                                type="datetime-local"
                                value={form.inicio_exibicao}
                                onChange={(event) =>
                                    updateForm(
                                        "inicio_exibicao",
                                        event.target.value,
                                    )
                                }
                            />

                            <Input
                                label="Fim da exibição"
                                type="datetime-local"
                                value={form.fim_exibicao}
                                onChange={(event) =>
                                    updateForm(
                                        "fim_exibicao",
                                        event.target.value,
                                    )
                                }
                            />

                            {!ehKit &&
                            form.controla_estoque &&
                            variacoes.length === 0 ? (
                                <Input
                                    label="Estoque atual"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.estoque_atual}
                                    onChange={(event) =>
                                        updateForm(
                                            "estoque_atual",
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            ) : null}
                        </div>

                        <div className="bp-product-switches">
                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        !ehKit &&
                                        form.controla_estoque
                                    }
                                    disabled={ehKit}
                                    onChange={(event) =>
                                        updateForm(
                                            "controla_estoque",
                                            event.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    Controlar estoque
                                    {ehKit ? (
                                        <span className="bp-field-help">
                                            O estoque do kit será calculado pelos componentes.
                                        </span>
                                    ) : variacoes.length > 0 ? (
                                        <span className="bp-field-help">
                                            O estoque será informado
                                            em cada variação.
                                        </span>
                                    ) : null}
                                </span>
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={form.ativo}
                                    onChange={(event) =>
                                        updateForm(
                                            "ativo",
                                            event.target.checked,
                                        )
                                    }
                                />
                                Produto ativo
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.visivel_publico
                                    }
                                    onChange={(event) =>
                                        updateForm(
                                            "visivel_publico",
                                            event.target.checked,
                                        )
                                    }
                                />
                                Visível publicamente
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={form.destaque}
                                    onChange={(event) =>
                                        updateForm(
                                            "destaque",
                                            event.target.checked,
                                        )
                                    }
                                />
                                Destacar produto
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.exibir_apos_encerramento
                                    }
                                    onChange={(event) =>
                                        updateForm(
                                            "exibir_apos_encerramento",
                                            event.target.checked,
                                        )
                                    }
                                />
                                Continuar exibindo após o
                                encerramento
                            </label>
                        </div>
                    </section>


                </form>
            </Modal>

            <Modal
                open={Boolean(previewProduto)}
                size="full"
                title={previewProduto?.nome ?? "Prévia do produto"}
                description="Prévia administrativa de como o produto poderá aparecer para compra."
                onCloseAction={fecharPreview}
                footer={
                    previewProduto ? (
                        <>
                            <Button
                                type="button"
                                color="secondary"
                                variant="ghost"
                                onClick={fecharPreview}
                            >
                                Fechar prévia
                            </Button>

                            <Button
                                type="button"
                                disabled
                                title="Carrinho será implementado em uma etapa futura."
                            >
                                <ShoppingCart size={17} />
                                Adicionar ao carrinho
                            </Button>
                        </>
                    ) : undefined
                }
            >
                {previewProduto ? (
                    <div className="bp-store-preview-detail">
                        <div className="bp-store-preview-gallery">
                            <div className="bp-store-preview-main-image">
                                {previewImagemUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={previewImagemUrl}
                                        alt={previewProduto.nome}
                                    />
                                ) : (
                                    <Package size={48} />
                                )}
                            </div>

                            {previewProduto.imagens.length >
                            1 ? (
                                <div className="bp-store-preview-thumbs">
                                    {previewProduto.imagens.map(
                                        (imagem) =>
                                            imagem.public_url ? (
                                                <button
                                                    key={
                                                        imagem.prd_produto_imagem_id
                                                    }
                                                    type="button"
                                                    className={
                                                        previewImagemUrl ===
                                                        imagem.public_url
                                                            ? "is-active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setPreviewImagemUrl(
                                                            imagem.public_url,
                                                        )
                                                    }
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={
                                                            imagem.public_url
                                                        }
                                                        alt=""
                                                    />
                                                </button>
                                            ) : null,
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="bp-store-preview-info">
                            <div>
                                <span className="bp-store-product-type">
                                    {
                                        previewProduto
                                            .prd_produto_tipo
                                            .nome
                                    }
                                </span>

                                <h2>
                                    {previewProduto.nome}
                                </h2>

                                <p>
                                    {previewProduto.descricao ||
                                        "Sem descrição informada."}
                                </p>
                            </div>

                            <div className="bp-store-preview-price">
                                <strong>
                                    {money(
                                        previewProduto.preco_normal,
                                    )}
                                </strong>

                                {previewProduto.preco_socio !==
                                null ? (
                                    <span>
                                        Preço de sócio:{" "}
                                        {money(
                                            previewProduto.preco_socio,
                                        )}
                                    </span>
                                ) : null}
                            </div>

                            {previewProduto.eh_kit ? (
                                <div className="bp-store-preview-variations">
                                    <span className="bp-label">
                                        Itens do kit
                                    </span>

                                    <div
                                        style={{
                                            display: "grid",
                                            gap: 8,
                                        }}
                                    >
                                        {previewProduto.componentes
                                            .filter(
                                                (componente) =>
                                                    Boolean(
                                                        componente.ativo,
                                                    ),
                                            )
                                            .map((componente) => (
                                                <div
                                                    key={
                                                        componente.id
                                                    }
                                                    className="bp-store-preview-stock"
                                                >
                                                    <strong>
                                                        {
                                                            componente
                                                                .produto
                                                                .nome
                                                        }
                                                    </strong>{" "}
                                                    ×{" "}
                                                    {
                                                        componente.quantidade
                                                    }
                                                    {componente
                                                        .produto
                                                        .variacoes
                                                        .length >
                                                    0 ? (
                                                        <span>
                                                            {" "}
                                                            · escolha de
                                                            variação na
                                                            compra
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : null}

                            {previewProduto.campos.length > 0 ? (
                                <div className="bp-store-preview-variations">
                                    <span className="bp-label">
                                        Personalização
                                    </span>

                                    <div
                                        style={{
                                            display: "grid",
                                            gap: 10,
                                        }}
                                    >
                                        {previewProduto.campos
                                            .filter((campo) =>
                                                Boolean(campo.ativo),
                                            )
                                            .map((campo) => (
                                                <Input
                                                    key={campo.id}
                                                    label={`${campo.nome}${
                                                        campo.obrigatorio
                                                            ? " *"
                                                            : ""
                                                    }`}
                                                    type={
                                                        campo.tipo ===
                                                        "numero"
                                                            ? "number"
                                                            : "text"
                                                    }
                                                    placeholder={
                                                        campo.descricao ??
                                                        undefined
                                                    }
                                                    disabled
                                                />
                                            ))}
                                    </div>
                                </div>
                            ) : null}

                            {previewProduto.variacoes.length >
                            0 ? (
                                <div className="bp-store-preview-variations">
                                    <span className="bp-label">
                                        Escolha uma variação
                                    </span>

                                    <div className="bp-store-preview-variation-options">
                                        {previewProduto.variacoes
                                            .filter(
                                                (variacao) =>
                                                    Boolean(
                                                        variacao.ativo,
                                                    ),
                                            )
                                            .map(
                                                (
                                                    variacao,
                                                ) => (
                                                    <button
                                                        key={
                                                            variacao.id
                                                        }
                                                        type="button"
                                                        className={
                                                            previewVariacaoId ===
                                                            variacao.id
                                                                ? "is-active"
                                                                : ""
                                                        }
                                                        onClick={() =>
                                                            setPreviewVariacaoId(
                                                                variacao.id,
                                                            )
                                                        }
                                                    >
                                                        {
                                                            variacao.nome
                                                        }
                                                    </button>
                                                ),
                                            )}
                                    </div>

                                    {previewVariacaoSelecionada ? (
                                        <div className="bp-store-preview-variation-meta">
                                            {previewVariacaoSelecionada.atributo_1 &&
                                            previewVariacaoSelecionada.valor_1 ? (
                                                <span>
                                                    {
                                                        previewVariacaoSelecionada.atributo_1
                                                    }
                                                    :{" "}
                                                    <strong>
                                                        {
                                                            previewVariacaoSelecionada.valor_1
                                                        }
                                                    </strong>
                                                </span>
                                            ) : null}

                                            {previewVariacaoSelecionada.atributo_2 &&
                                            previewVariacaoSelecionada.valor_2 ? (
                                                <span>
                                                    {
                                                        previewVariacaoSelecionada.atributo_2
                                                    }
                                                    :{" "}
                                                    <strong>
                                                        {
                                                            previewVariacaoSelecionada.valor_2
                                                        }
                                                    </strong>
                                                </span>
                                            ) : null}

                                            {previewProduto.controla_estoque ? (
                                                <span>
                                                    Estoque:{" "}
                                                    <strong>
                                                        {previewVariacaoSelecionada.estoque_atual ??
                                                            0}
                                                    </strong>
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            ) : previewProduto.controla_estoque ? (
                                <div className="bp-store-preview-stock">
                                    Estoque disponível:{" "}
                                    <strong>
                                        {previewProduto.estoque_atual ??
                                            0}
                                    </strong>
                                </div>
                            ) : null}

                            <div className="bp-store-preview-cart">
                                <div className="bp-store-preview-quantity">
                                    <button
                                        type="button"
                                        disabled
                                    >
                                        −
                                    </button>
                                    <span>1</span>
                                    <button
                                        type="button"
                                        disabled
                                    >
                                        +
                                    </button>
                                </div>

                                <Button
                                    type="button"
                                    disabled
                                    title="Carrinho será implementado em uma etapa futura."
                                >
                                    <ShoppingCart
                                        size={17}
                                    />
                                    Adicionar ao carrinho
                                </Button>
                            </div>

                            <span className="bp-field-help">
                                Esta é apenas a prévia do fluxo de
                                compra. O carrinho ainda não está
                                ativo nesta etapa.
                            </span>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {snackbar && (
                <Snackbar
                    {...snackbar}
                    onClose={() => setSnackbar(null)}
                />
            )}
        </>
    );
}
