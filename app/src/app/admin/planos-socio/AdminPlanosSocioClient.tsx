"use client";

import {
    ChangeEvent,
    DragEvent,
    FormEvent,
    useRef,
    useState,
} from "react";
import {
    CreditCard,
    Eye,
    ImageOff,
    ImagePlus,
    LayoutGrid,
    List,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Trash2,
    Upload,
    WalletCards,
    X,
} from "lucide-react";

import {
    MarkdownContent,
} from "@/components/content/MarkdownContent";
import {
    Badge,
} from "@/components/ui/Badge";
import {
    Button,
} from "@/components/ui/Button";
import {
    EmptyState,
} from "@/components/ui/EmptyState";
import {
    Input,
} from "@/components/ui/Input";
import {
    Modal,
} from "@/components/ui/Modal";
import {
    PageHeader,
} from "@/components/ui/PageHeader";
import {
    Select,
} from "@/components/ui/Select";
import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";
import {
    Table,
} from "@/components/ui/Table";
import {
    Textarea,
} from "@/components/ui/Textarea";

type PlanoStatus =
    | "ativo"
    | "inativo"
    | "oculto"
    | "agendado"
    | "encerrado";

type ProdutoAssociacao = {
    id: number;
    codigo: string;
    nome: string;
    preco_normal: number;
    ativo: number;
    visivel_publico: number;
    status:
        | "ativo"
        | "inativo"
        | "oculto"
        | "agendado"
        | "encerrado";
    imagem_principal: {
        prd_produto_imagem_id:
            number;
        sys_arquivo_id:
            number;
        public_url:
            string | null;
    } | null;
};

type Plano = {
    id: number;
    prd_produto_id:
        | number
        | null;
    codigo: string;
    nome: string;
    descricao:
        | string
        | null;
    duracao_dias: number;
    ativo: number;
    visivel_publico: number;
    inicio_exibicao:
        | string
        | Date
        | null;
    fim_exibicao:
        | string
        | Date
        | null;
    exibir_apos_encerramento:
        number;
    banner: {
        id: number;
        public_url:
            string | null;
        original_name:
            string | null;
        mime_type:
            string | null;
    } | null;
    status: PlanoStatus;
    prd_produto:
        | ProdutoAssociacao
        | null;
};

type AdminPlanosData = {
    planos: Plano[];
    produtosAssociacao:
        ProdutoAssociacao[];
};

type Props = {
    initialData:
        AdminPlanosData;
};

type FormState = {
    prd_produto_id: string;
    codigo: string;
    nome: string;
    descricao: string;
    duracao_dias: string;
    ativo: boolean;
    visivel_publico: boolean;
    inicio_exibicao: string;
    fim_exibicao: string;
    exibir_apos_encerramento:
        boolean;
};

const emptyForm: FormState = {
    prd_produto_id: "",
    codigo: "",
    nome: "",
    descricao: "",
    duracao_dias: "180",
    ativo: true,
    visivel_publico: true,
    inicio_exibicao: "",
    fim_exibicao: "",
    exibir_apos_encerramento:
        false,
};

function toDateTimeLocal(
    value:
        | string
        | Date
        | null,
) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    const pad =
        (number: number) =>
            String(number)
                .padStart(
                    2,
                    "0",
                );

    return [
        date.getFullYear(),
        "-",
        pad(
            date.getMonth() +
            1,
        ),
        "-",
        pad(date.getDate()),
        "T",
        pad(date.getHours()),
        ":",
        pad(date.getMinutes()),
    ].join("");
}

function formatDateTime(
    value:
        | string
        | Date
        | null,
) {
    if (!value) {
        return "Sem limite";
    }

    return new Intl
        .DateTimeFormat(
            "pt-BR",
            {
                dateStyle:
                    "short",
                timeStyle:
                    "short",
            },
        )
        .format(
            new Date(value),
        );
}

function formatCurrency(
    value:
        | number
        | null
        | undefined,
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    return new Intl
        .NumberFormat(
            "pt-BR",
            {
                style:
                    "currency",
                currency:
                    "BRL",
            },
        )
        .format(value);
}

function formatDuracao(
    dias: number,
) {
    if (
        dias % 365 === 0
    ) {
        const anos =
            dias / 365;

        return anos === 1
            ? "1 ano"
            : `${anos} anos`;
    }

    if (
        dias % 30 === 0
    ) {
        const meses =
            dias / 30;

        return meses === 1
            ? "1 mês"
            : `${meses} meses`;
    }

    return dias === 1
        ? "1 dia"
        : `${dias} dias`;
}

function getStatusBadge(
    status: PlanoStatus,
) {
    switch (status) {
        case "ativo":
            return {
                label: "Ativo",
                color:
                    "success" as const,
            };
        case "agendado":
            return {
                label:
                    "Agendado",
                color:
                    "info" as const,
            };
        case "encerrado":
            return {
                label:
                    "Encerrado",
                color:
                    "warning" as const,
            };
        case "oculto":
            return {
                label: "Oculto",
                color:
                    "secondary" as const,
            };
        case "inativo":
        default:
            return {
                label:
                    "Inativo",
                color:
                    "danger" as const,
            };
    }
}

function planoToForm(
    plano: Plano,
): FormState {
    return {
        prd_produto_id:
            plano
                .prd_produto_id
                ? String(
                    plano
                        .prd_produto_id,
                )
                : "",
        codigo:
        plano.codigo,
        nome:
        plano.nome,
        descricao:
            plano.descricao ??
            "",
        duracao_dias:
            String(
                plano.duracao_dias,
            ),
        ativo:
            Boolean(
                plano.ativo,
            ),
        visivel_publico:
            Boolean(
                plano
                    .visivel_publico,
            ),
        inicio_exibicao:
            toDateTimeLocal(
                plano
                    .inicio_exibicao,
            ),
        fim_exibicao:
            toDateTimeLocal(
                plano
                    .fim_exibicao,
            ),
        exibir_apos_encerramento:
            Boolean(
                plano
                    .exibir_apos_encerramento,
            ),
    };
}

function getPlanoImageUrl(
    plano: Plano,
) {
    return (
        plano.banner
            ?.public_url ??
        plano.prd_produto
            ?.imagem_principal
            ?.public_url ??
        null
    );
}


export default function AdminPlanosSocioClient({
                                                   initialData,
                                               }: Props) {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [
        data,
        setData,
    ] =
        useState(
            initialData,
        );

    const [
        viewMode,
        setViewMode,
    ] =
        useState<
            "list" |
            "preview"
        >("list");

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(false);

    const [
        editingPlano,
        setEditingPlano,
    ] =
        useState<
            Plano | null
        >(null);

    const [
        previewPlano,
        setPreviewPlano,
    ] =
        useState<
            Plano | null
        >(null);

    const [
        form,
        setForm,
    ] =
        useState<FormState>(
            emptyForm,
        );

    const [
        bannerFile,
        setBannerFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        bannerPreviewUrl,
        setBannerPreviewUrl,
    ] =
        useState<string | null>(
            null,
        );

    const [
        removerBanner,
        setRemoverBanner,
    ] =
        useState(false);

    const [
        dragging,
        setDragging,
    ] =
        useState(false);

    const [
        salvando,
        setSalvando,
    ] =
        useState(false);

    const [
        alterandoPlanoId,
        setAlterandoPlanoId,
    ] =
        useState<
            number | null
        >(null);

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<
            SnackbarState | null
        >(null);

    function updateForm<
        K extends keyof FormState,
    >(
        key: K,
        value:
        FormState[K],
    ) {
        setForm(
            (current) => ({
                ...current,
                [key]:
                value,
            }),
        );
    }

    function limparBannerNovo() {
        if (bannerPreviewUrl) {
            URL.revokeObjectURL(
                bannerPreviewUrl,
            );
        }

        setBannerFile(null);
        setBannerPreviewUrl(
            null,
        );

        if (
            fileInputRef.current
        ) {
            fileInputRef
                .current
                .value = "";
        }
    }

    function resetBanner() {
        limparBannerNovo();
        setRemoverBanner(
            false,
        );
        setDragging(
            false,
        );
    }

    function abrirCriacao() {
        resetBanner();
        setEditingPlano(
            null,
        );
        setForm(
            emptyForm,
        );
        setSnackbar(
            null,
        );
        setModalOpen(
            true,
        );
    }

    function abrirEdicao(
        plano: Plano,
    ) {
        resetBanner();
        setEditingPlano(
            plano,
        );
        setForm(
            planoToForm(
                plano,
            ),
        );
        setSnackbar(
            null,
        );
        setModalOpen(
            true,
        );
    }

    function fecharModal() {
        if (salvando) {
            return;
        }

        resetBanner();
        setModalOpen(
            false,
        );
        setEditingPlano(
            null,
        );
        setForm(
            emptyForm,
        );
    }

    function selecionarBanner(
        file: File,
    ) {
        if (
            !file.type.startsWith(
                "image/",
            )
        ) {
            setSnackbar({
                color:
                    "danger",
                title:
                    "Imagem inválida",
                message:
                    "Selecione um arquivo de imagem.",
            });

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setSnackbar({
                color:
                    "warning",
                title:
                    "Arquivo muito grande",
                message:
                    "O banner ultrapassa o limite de 5MB.",
            });

            return;
        }

        limparBannerNovo();

        setBannerFile(
            file,
        );
        setBannerPreviewUrl(
            URL.createObjectURL(
                file,
            ),
        );
        setRemoverBanner(
            false,
        );
    }

    function handleFileChange(
        event:
        ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target
                .files?.[0];

        if (file) {
            selecionarBanner(
                file,
            );
        }

        event.target.value =
            "";
    }

    function handleDrop(
        event:
        DragEvent<HTMLDivElement>,
    ) {
        event.preventDefault();
        setDragging(
            false,
        );

        const file =
            event.dataTransfer
                .files?.[0];

        if (file) {
            selecionarBanner(
                file,
            );
        }
    }

    function removerBannerAtual() {
        limparBannerNovo();
        setRemoverBanner(
            true,
        );
    }

    function buildFormData() {
        const payload =
            new FormData();

        payload.set(
            "prd_produto_id",
            form.prd_produto_id,
        );
        payload.set(
            "codigo",
            form.codigo,
        );
        payload.set(
            "nome",
            form.nome,
        );
        payload.set(
            "descricao",
            form.descricao,
        );
        payload.set(
            "duracao_dias",
            form.duracao_dias,
        );
        payload.set(
            "ativo",
            form.ativo
                ? "1"
                : "0",
        );
        payload.set(
            "visivel_publico",
            form.visivel_publico
                ? "1"
                : "0",
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
            form
                .exibir_apos_encerramento
                ? "1"
                : "0",
        );
        payload.set(
            "remover_banner",
            removerBanner
                ? "1"
                : "0",
        );

        if (bannerFile) {
            payload.set(
                "banner",
                bannerFile,
            );
        }

        return payload;
    }

    async function salvar(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !Number.isInteger(
                Number(
                    form
                        .duracao_dias,
                ),
            ) ||
            Number(
                form
                    .duracao_dias,
            ) < 1
        ) {
            setSnackbar({
                color:
                    "warning",
                title:
                    "Duração inválida",
                message:
                    "Informe uma duração de pelo menos 1 dia.",
            });

            return;
        }

        try {
            setSalvando(
                true,
            );
            setSnackbar(
                null,
            );

            const isEditing =
                Boolean(
                    editingPlano,
                );

            const response =
                await fetch(
                    isEditing
                        ? `/api/admin/planos-socio/${editingPlano!.id}`
                        : "/api/admin/planos-socio",
                    {
                        method:
                            isEditing
                                ? "PATCH"
                                : "POST",
                        body:
                            buildFormData(),
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result
                        .message ||
                    "Não foi possível salvar o plano.",
                );
            }

            const plano =
                result.data
                    .plano as Plano;

            setData(
                (current) => {
                    const exists =
                        current
                            .planos
                            .some(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    plano.id,
                            );

                    return {
                        ...current,
                        planos:
                            exists
                                ? current
                                    .planos
                                    .map(
                                        (
                                            item,
                                        ) =>
                                            item.id ===
                                            plano.id
                                                ? plano
                                                : item,
                                    )
                                : [
                                    plano,
                                    ...current
                                        .planos,
                                ],
                    };
                },
            );

            resetBanner();

            setModalOpen(
                false,
            );
            setEditingPlano(
                null,
            );
            setForm(
                emptyForm,
            );

            setSnackbar({
                color:
                    "success",
                title:
                    isEditing
                        ? "Plano atualizado"
                        : "Plano criado",
                message:
                result
                    .message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",
                title:
                    "Erro ao salvar",
                message:
                    error instanceof
                    Error
                        ? error
                            .message
                        : "Não foi possível salvar o plano.",
                autoClose:
                    false,
            });
        } finally {
            setSalvando(
                false,
            );
        }
    }

    async function alternarAtivo(
        plano: Plano,
    ) {
        try {
            setAlterandoPlanoId(
                plano.id,
            );
            setSnackbar(
                null,
            );

            const novoAtivo =
                !Boolean(
                    plano.ativo,
                );

            const response =
                await fetch(
                    `/api/admin/planos-socio/${plano.id}`,
                    {
                        method:
                            "PATCH",
                        headers:
                            {
                                "Content-Type":
                                    "application/json",
                                Accept:
                                    "application/json",
                            },
                        body:
                            JSON.stringify({
                                action:
                                    "set_ativo",
                                ativo:
                                novoAtivo,
                            }),
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result
                        .message ||
                    "Não foi possível alterar o plano.",
                );
            }

            const atualizado =
                result.data
                    .plano as Plano;

            setData(
                (current) => ({
                    ...current,
                    planos:
                        current
                            .planos
                            .map(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    atualizado.id
                                        ? atualizado
                                        : item,
                            ),
                }),
            );

            if (
                previewPlano
                    ?.id ===
                atualizado.id
            ) {
                setPreviewPlano(
                    atualizado,
                );
            }

            setSnackbar({
                color:
                    "success",
                title:
                    novoAtivo
                        ? "Plano ativado"
                        : "Plano desativado",
                message:
                result
                    .message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",
                title:
                    "Erro ao alterar plano",
                message:
                    error instanceof
                    Error
                        ? error
                            .message
                        : "Não foi possível alterar o plano.",
                autoClose:
                    false,
            });
        } finally {
            setAlterandoPlanoId(
                null,
            );
        }
    }

    async function excluirPlano(
        plano: Plano,
    ) {
        const confirmado =
            window.confirm(
                `Excluir "${plano.nome}"? O plano será removido das listagens.`,
            );

        if (!confirmado) {
            return;
        }

        try {
            setAlterandoPlanoId(
                plano.id,
            );
            setSnackbar(
                null,
            );

            const response =
                await fetch(
                    `/api/admin/planos-socio/${plano.id}`,
                    {
                        method:
                            "DELETE",
                        headers:
                            {
                                Accept:
                                    "application/json",
                            },
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result
                        .message ||
                    "Não foi possível excluir o plano.",
                );
            }

            setData(
                (current) => ({
                    ...current,
                    planos:
                        current
                            .planos
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    plano.id,
                            ),
                }),
            );

            if (
                previewPlano
                    ?.id ===
                plano.id
            ) {
                setPreviewPlano(
                    null,
                );
            }

            setSnackbar({
                color:
                    "success",
                title:
                    "Plano excluído",
                message:
                result
                    .message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",
                title:
                    "Erro ao excluir plano",
                message:
                    error instanceof
                    Error
                        ? error
                            .message
                        : "Não foi possível excluir o plano.",
                autoClose:
                    false,
            });
        } finally {
            setAlterandoPlanoId(
                null,
            );
        }
    }

    const produtoOptions =
        data
            .produtosAssociacao
            .map(
                (produto) => ({
                    value:
                    produto.id,
                    label:
                        `${produto.nome} · ${formatCurrency(
                            produto.preco_normal,
                        )}${
                            produto.status !==
                            "ativo"
                                ? ` · ${produto.status}`
                                : ""
                        }`,
                }),
            );

    const bannerAtualUrl =
        bannerPreviewUrl ??
        (
            !removerBanner
                ? editingPlano
                    ?.banner
                    ?.public_url ??
                null
                : null
        );

    return (
        <>
            <PageHeader
                title="Planos de sócio"
                subtitle="Gerencie planos, duração e associação com produtos de venda."
                actions={
                    <div className="bp-plan-page-actions">
                        <div
                            className="bp-plan-view-switch"
                            aria-label="Modo de visualização"
                        >
                            <button
                                type="button"
                                className={
                                    viewMode ===
                                    "list"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode(
                                        "list",
                                    )
                                }
                            >
                                <List
                                    size={
                                        16
                                    }
                                />
                                Lista
                            </button>

                            <button
                                type="button"
                                className={
                                    viewMode ===
                                    "preview"
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    setViewMode(
                                        "preview",
                                    )
                                }
                            >
                                <LayoutGrid
                                    size={
                                        16
                                    }
                                />
                                Prévia
                            </button>
                        </div>

                        <Button
                            onClick={
                                abrirCriacao
                            }
                        >
                            <Plus
                                size={
                                    17
                                }
                            />
                            Criar plano
                        </Button>
                    </div>
                }
            />

            {data.planos.length ===
            0 ? (
                <EmptyState
                    icon={
                        <WalletCards
                            size={
                                24
                            }
                        />
                    }
                    title="Nenhum plano cadastrado"
                    description="Crie o primeiro plano de sócio e vincule um produto do tipo Associação quando ele também puder ser comprado."
                    action={
                        <Button
                            onClick={
                                abrirCriacao
                            }
                        >
                            <Plus
                                size={
                                    17
                                }
                            />
                            Criar plano
                        </Button>
                    }
                />
            ) : viewMode ===
            "list" ? (
                <>
                    <Table
                        headers={[
                            "Plano",
                            "Produto associado",
                            "Duração",
                            "Publicação",
                            "Status",
                            "Ações",
                        ]}
                    >
                        {data.planos.map(
                            (
                                plano,
                            ) => {
                                const status =
                                    getStatusBadge(
                                        plano.status,
                                    );

                                const busy =
                                    alterandoPlanoId ===
                                    plano.id;

                                return (
                                    <tr
                                        key={
                                            plano.id
                                        }
                                    >
                                        <td>
                                            <div className="bp-plan-table-name">
                                                <div className="bp-plan-table-icon">
                                                    <WalletCards
                                                        size={
                                                            19
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            plano.nome
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            plano.codigo
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {plano.prd_produto ? (
                                                <div className="bp-plan-product-inline">
                                                    <strong>
                                                        {
                                                            plano
                                                                .prd_produto
                                                                .nome
                                                        }
                                                    </strong>
                                                    <span>
                                                        {formatCurrency(
                                                            plano
                                                                .prd_produto
                                                                .preco_normal,
                                                        )}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="bp-plan-muted">
                                                    Somente manual
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                {formatDuracao(
                                                    plano
                                                        .duracao_dias,
                                                )}
                                            </strong>
                                            <span className="bp-plan-muted">
                                                {
                                                    plano.duracao_dias
                                                }{" "}
                                                dias
                                            </span>
                                        </td>

                                        <td>
                                            <div className="bp-plan-publication">
                                                <span>
                                                    {formatDateTime(
                                                        plano
                                                            .inicio_exibicao,
                                                    )}
                                                </span>
                                                <span>
                                                    até{" "}
                                                    {formatDateTime(
                                                        plano
                                                            .fim_exibicao,
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <Badge
                                                color={
                                                    status.color
                                                }
                                            >
                                                {
                                                    status.label
                                                }
                                            </Badge>
                                        </td>

                                        <td>
                                            <div className="bp-plan-row-actions">
                                                <Button
                                                    color="secondary"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPreviewPlano(
                                                            plano,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    <Eye
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Ver
                                                </Button>

                                                <Button
                                                    color={
                                                        plano.ativo
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        alternarAtivo(
                                                            plano,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    {plano.ativo ? (
                                                        <PowerOff
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    ) : (
                                                        <Power
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    )}
                                                    {plano.ativo
                                                        ? "Desativar"
                                                        : "Ativar"}
                                                </Button>

                                                <Button
                                                    color="secondary"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        abrirEdicao(
                                                            plano,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    <Pencil
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Editar
                                                </Button>

                                                <Button
                                                    color="danger"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        excluirPlano(
                                                            plano,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Excluir
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            },
                        )}
                    </Table>

                    <div className="bp-plan-admin-mobile-list">
                        {data.planos.map(
                            (
                                plano,
                            ) => {
                                const status =
                                    getStatusBadge(
                                        plano.status,
                                    );

                                const busy =
                                    alterandoPlanoId ===
                                    plano.id;

                                return (
                                    <article
                                        key={
                                            plano.id
                                        }
                                        className="bp-plan-admin-mobile-card"
                                    >
                                        <div className="bp-plan-admin-mobile-head">
                                            <div className="bp-plan-admin-mobile-icon">
                                                <WalletCards
                                                    size={
                                                        23
                                                    }
                                                />
                                            </div>

                                            <div className="bp-plan-admin-mobile-title">
                                                <strong>
                                                    {
                                                        plano.nome
                                                    }
                                                </strong>
                                                <span>
                                                    {
                                                        plano.codigo
                                                    }
                                                </span>
                                            </div>

                                            <Badge
                                                color={
                                                    status.color
                                                }
                                            >
                                                {
                                                    status.label
                                                }
                                            </Badge>
                                        </div>

                                        <div className="bp-plan-admin-mobile-info">
                                            <div>
                                                <span>
                                                    Duração
                                                </span>
                                                <strong>
                                                    {formatDuracao(
                                                        plano
                                                            .duracao_dias,
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Valor
                                                </span>
                                                <strong>
                                                    {formatCurrency(
                                                        plano
                                                            .prd_produto
                                                            ?.preco_normal,
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Produto
                                                </span>
                                                <strong>
                                                    {plano
                                                            .prd_produto
                                                            ?.nome ??
                                                        "Somente manual"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Após encerramento
                                                </span>
                                                <strong>
                                                    {plano
                                                        .exibir_apos_encerramento
                                                        ? "Exibir"
                                                        : "Ocultar"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="bp-plan-admin-mobile-actions">
                                            <Button
                                                color="secondary"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    setPreviewPlano(
                                                        plano,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                <Eye
                                                    size={
                                                        16
                                                    }
                                                />
                                                Ver
                                            </Button>

                                            <Button
                                                color="secondary"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    abrirEdicao(
                                                        plano,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                <Pencil
                                                    size={
                                                        16
                                                    }
                                                />
                                                Editar
                                            </Button>

                                            <Button
                                                color={
                                                    plano.ativo
                                                        ? "warning"
                                                        : "success"
                                                }
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    alternarAtivo(
                                                        plano,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                {plano.ativo ? (
                                                    <PowerOff
                                                        size={
                                                            16
                                                        }
                                                    />
                                                ) : (
                                                    <Power
                                                        size={
                                                            16
                                                        }
                                                    />
                                                )}
                                                {plano.ativo
                                                    ? "Desativar"
                                                    : "Ativar"}
                                            </Button>

                                            <Button
                                                color="danger"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    excluirPlano(
                                                        plano,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                <Trash2
                                                    size={
                                                        16
                                                    }
                                                />
                                                Excluir
                                            </Button>
                                        </div>
                                    </article>
                                );
                            },
                        )}
                    </div>
                </>
            ) : (
                <div className="bp-plan-preview-grid">
                    {data.planos.map(
                        (plano) => {
                            const status =
                                getStatusBadge(
                                    plano.status,
                                );

                            return (
                                <button
                                    key={
                                        plano.id
                                    }
                                    type="button"
                                    className="bp-plan-preview-card"
                                    onClick={() =>
                                        setPreviewPlano(
                                            plano,
                                        )
                                    }
                                >
                                    <div className="bp-plan-preview-media">
                                        {getPlanoImageUrl(
                                            plano,
                                        ) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={
                                                    getPlanoImageUrl(
                                                        plano,
                                                    )!
                                                }
                                                alt=""
                                            />
                                        ) : (
                                            <WalletCards
                                                size={
                                                    44
                                                }
                                            />
                                        )}

                                        <div className="bp-plan-preview-badge">
                                            <Badge
                                                color={
                                                    status.color
                                                }
                                            >
                                                {
                                                    status.label
                                                }
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bp-plan-preview-card-body">
                                        <span className="bp-plan-preview-eyebrow">
                                            Plano de sócio
                                        </span>

                                        <strong>
                                            {
                                                plano.nome
                                            }
                                        </strong>

                                        <div className="bp-plan-preview-price">
                                            {formatCurrency(
                                                plano
                                                    .prd_produto
                                                    ?.preco_normal,
                                            )}
                                        </div>

                                        <span className="bp-plan-preview-duration">
                                            {formatDuracao(
                                                plano
                                                    .duracao_dias,
                                            )}{" "}
                                            de associação
                                        </span>

                                        {plano.descricao ? (
                                            <MarkdownContent
                                                className="bp-markdown-compact"
                                            >
                                                {
                                                    plano.descricao
                                                }
                                            </MarkdownContent>
                                        ) : (
                                            <p>
                                                Sem descrição.
                                            </p>
                                        )}

                                        <span className="bp-plan-preview-cta">
                                            Ver plano
                                        </span>
                                    </div>
                                </button>
                            );
                        },
                    )}
                </div>
            )}

            <Modal
                open={
                    modalOpen
                }
                size="xl"
                title={
                    editingPlano
                        ? "Editar plano de sócio"
                        : "Criar plano de sócio"
                }
                description="Defina as regras da associação. O plano pode ter banner próprio; preço e venda continuam vindo do produto do tipo Associação vinculado."
                onCloseAction={
                    fecharModal
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={
                                fecharModal
                            }
                            disabled={
                                salvando
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="plano-socio-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : editingPlano
                                    ? "Salvar alterações"
                                    : "Criar plano"}
                        </Button>
                    </>
                }
            >
                <form
                    id="plano-socio-form"
                    className="bp-plan-form"
                    onSubmit={
                        salvar
                    }
                >
                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Banner do plano
                                </h3>
                                <span className="bp-field-help">
                                    Imagem própria do plano. Se não houver banner, a prévia usa a imagem do produto associado como fallback. Máximo de 5MB.
                                </span>
                            </div>

                            <ImagePlus
                                size={
                                    20
                                }
                            />
                        </div>

                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="image/*"
                            onChange={
                                handleFileChange
                            }
                            hidden
                        />

                        {bannerAtualUrl ? (
                            <div className="bp-plan-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        bannerAtualUrl
                                    }
                                    alt="Prévia do banner do plano"
                                />

                                <div className="bp-plan-banner-editor-actions">
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="soft"
                                        size="sm"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Upload
                                            size={
                                                15
                                            }
                                        />
                                        Trocar banner
                                    </Button>

                                    <Button
                                        type="button"
                                        color="danger"
                                        variant="soft"
                                        size="sm"
                                        onClick={
                                            removerBannerAtual
                                        }
                                    >
                                        <X
                                            size={
                                                15
                                            }
                                        />
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        ) : (
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
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter" ||
                                        event.key ===
                                        " "
                                    ) {
                                        event.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                onDragEnter={(
                                    event,
                                ) => {
                                    event.preventDefault();
                                    setDragging(
                                        true,
                                    );
                                }}
                                onDragOver={(
                                    event,
                                ) => {
                                    event.preventDefault();
                                    setDragging(
                                        true,
                                    );
                                }}
                                onDragLeave={() =>
                                    setDragging(
                                        false,
                                    )
                                }
                                onDrop={
                                    handleDrop
                                }
                            >
                                <div className="bp-product-dropzone-content">
                                    <Upload
                                        size={
                                            26
                                        }
                                    />
                                    <strong>
                                        Arraste o banner aqui ou clique para selecionar
                                    </strong>
                                    <span>
                                        PNG, JPG, WEBP e outros formatos de imagem.
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Identificação
                                </h3>
                                <span className="bp-field-help">
                                    O plano guarda as regras da associação; o produto associado guarda o preço e a venda.
                                </span>
                            </div>

                            <WalletCards
                                size={
                                    20
                                }
                            />
                        </div>

                        <div className="bp-plan-form-grid">
                            <Input
                                label="Código"
                                value={
                                    form.codigo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "codigo",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="socio-semestral"
                                maxLength={
                                    60
                                }
                                helperText="Identificador interno único."
                                required
                            />

                            <Input
                                label="Nome"
                                value={
                                    form.nome
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "nome",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Sócio Semestral"
                                maxLength={
                                    150
                                }
                                required
                            />
                        </div>

                        <Textarea
                            label="Descrição"
                            helperText="Suporta Markdown: **negrito**, listas, títulos, links, tabelas e código."
                            value={
                                form.descricao
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "descricao",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            rows={6}
                            placeholder="Benefícios, regras e informações do plano."
                        />
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Associação e venda
                                </h3>
                                <span className="bp-field-help">
                                    Somente produtos do tipo Associação podem ser vinculados. Um mesmo produto não pode representar dois planos.
                                </span>
                            </div>

                            <CreditCard
                                size={
                                    20
                                }
                            />
                        </div>

                        <div className="bp-plan-form-grid">
                            <Input
                                label="Duração em dias"
                                type="number"
                                min="1"
                                max="36500"
                                step="1"
                                value={
                                    form
                                        .duracao_dias
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "duracao_dias",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                helperText="Ex.: 180 dias para um plano semestral."
                                required
                            />

                            <Select
                                label="Produto associado"
                                value={
                                    form
                                        .prd_produto_id
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "prd_produto_id",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                options={[
                                    {
                                        value:
                                            "",
                                        label:
                                            "Nenhum — plano apenas manual",
                                    },
                                    ...produtoOptions,
                                ]}
                                helperText={
                                    data
                                        .produtosAssociacao
                                        .length ===
                                    0
                                        ? "Nenhum produto do tipo Associação foi cadastrado em Produtos."
                                        : "Preço, imagem e venda serão controlados pelo produto selecionado."
                                }
                            />
                        </div>
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <h3 className="bp-product-section-title">
                                Publicação
                            </h3>
                        </div>

                        <div className="bp-plan-form-grid">
                            <Input
                                label="Início da exibição"
                                type="datetime-local"
                                value={
                                    form
                                        .inicio_exibicao
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "inicio_exibicao",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />

                            <Input
                                label="Fim da exibição"
                                type="datetime-local"
                                value={
                                    form
                                        .fim_exibicao
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "fim_exibicao",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        <div className="bp-product-switches">
                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.ativo
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "ativo",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />
                                Plano ativo
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form
                                            .visivel_publico
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "visivel_publico",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />
                                Visível publicamente
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form
                                            .exibir_apos_encerramento
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "exibir_apos_encerramento",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />
                                Exibir após encerramento
                            </label>
                        </div>
                    </section>
                </form>
            </Modal>

            <Modal
                open={
                    Boolean(
                        previewPlano,
                    )
                }
                size="full"
                title={
                    previewPlano
                        ?.nome ??
                    "Prévia do plano"
                }
                description="Prévia administrativa da experiência pública do plano de sócio."
                onCloseAction={() =>
                    setPreviewPlano(
                        null,
                    )
                }
                footer={
                    <Button
                        type="button"
                        color="secondary"
                        variant="ghost"
                        onClick={() =>
                            setPreviewPlano(
                                null,
                            )
                        }
                    >
                        Fechar
                    </Button>
                }
            >
                {previewPlano ? (
                    <div className="bp-plan-full-preview">
                        <div className="bp-plan-full-preview-media">
                            {getPlanoImageUrl(
                                previewPlano,
                            ) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        getPlanoImageUrl(
                                            previewPlano,
                                        )!
                                    }
                                    alt=""
                                />
                            ) : (
                                <div className="bp-plan-full-preview-placeholder">
                                    <ImageOff
                                        size={
                                            48
                                        }
                                    />
                                    <span>
                                        Cadastre um banner no plano ou associe um produto com imagem.
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="bp-plan-full-preview-content">
                            <div className="bp-badge-row">
                                <Badge
                                    color={
                                        getStatusBadge(
                                            previewPlano.status,
                                        )
                                            .color
                                    }
                                >
                                    {
                                        getStatusBadge(
                                            previewPlano.status,
                                        )
                                            .label
                                    }
                                </Badge>

                                {previewPlano.prd_produto ? (
                                    <Badge color="secondary">
                                        Produto vinculado
                                    </Badge>
                                ) : (
                                    <Badge color="warning">
                                        Plano manual
                                    </Badge>
                                )}
                            </div>

                            <span className="bp-plan-full-preview-eyebrow">
                                Seja sócio
                            </span>

                            <h2>
                                {
                                    previewPlano.nome
                                }
                            </h2>

                            <div className="bp-plan-full-preview-price">
                                {formatCurrency(
                                    previewPlano
                                        .prd_produto
                                        ?.preco_normal,
                                )}
                            </div>

                            <div className="bp-plan-full-preview-duration">
                                <WalletCards
                                    size={
                                        18
                                    }
                                />
                                {formatDuracao(
                                    previewPlano
                                        .duracao_dias,
                                )}{" "}
                                de associação
                            </div>

                            {previewPlano.descricao ? (
                                <MarkdownContent>
                                    {
                                        previewPlano.descricao
                                    }
                                </MarkdownContent>
                            ) : (
                                <p className="bp-plan-muted">
                                    Sem descrição informada.
                                </p>
                            )}

                            <Button
                                type="button"
                                disabled
                                fullWidth
                            >
                                Tornar-se sócio
                            </Button>

                            <span className="bp-plan-muted">
                                O CTA é apenas visual nesta etapa. O fluxo de compra será ligado ao carrinho posteriormente.
                            </span>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(
                            null,
                        )
                    }
                />
            ) : null}
        </>
    );
}
