"use client";

import {
    ChangeEvent,
    DragEvent,
    FormEvent,
    useRef,
    useState,
} from "react";

import {
    CalendarDays,
    ExternalLink,
    Eye,
    ImagePlus,
    LayoutGrid,
    List,
    MonitorPlay,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Trash2,
    Upload,
    X,
} from "lucide-react";

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
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";
import {
    Table,
} from "@/components/ui/Table";
import {
    Textarea,
} from "@/components/ui/Textarea";

import {
    MarkdownContent,
} from "@/components/content/MarkdownContent";

type EventoBanner = {
    sys_arquivo_id: number;
    public_url: string | null;
    original_name: string;
};

type EventoStatus =
    | "ativo"
    | "inativo"
    | "oculto"
    | "agendado"
    | "encerrado";

type Evento = {
    id: number;
    titulo: string;
    descricao: string | null;
    url: string | null;
    par_parceiro_id:
        number | null;

    parceiro: {
        id: number;
        slug: string;
        nome: string;
    } | null;
    banner_sys_arquivo_id:
        | number
        | null;
    banner: EventoBanner | null;
    evento_at: string | Date | null;
    inicio_exibicao:
        | string
        | Date
        | null;
    fim_exibicao:
        | string
        | Date
        | null;
    ordem: number;
    destaque: number;
    ativo: number;
    visivel_publico: number;
    exibir_tv: number;
    status: EventoStatus;
};

type AdminEventosData = {
    eventos: Evento[];

    parceiros: Array<{
        id: number;
        nome: string;
        slug: string;
    }>;
};

type AdminEventosClientProps = {
    initialData: AdminEventosData;
};

type EventoFormState = {
    titulo: string;
    descricao: string;
    url: string;
    par_parceiro_id:
        string;
    evento_at: string;
    inicio_exibicao: string;
    fim_exibicao: string;
    ordem: string;
    destaque: boolean;
    ativo: boolean;
    visivel_publico: boolean;
    exibir_tv: boolean;
};

const emptyForm: EventoFormState = {
    titulo: "",
    descricao: "",
    url: "",
    par_parceiro_id:"",
    evento_at: "",
    inicio_exibicao: "",
    fim_exibicao: "",
    ordem: "0",
    destaque: false,
    ativo: true,
    visivel_publico: true,
    exibir_tv: false,
};

function toDateTimeLocal(
    value: string | Date | null,
) {
    if (!value) return "";

    const date = new Date(value);

    const pad = (number: number) =>
        String(number).padStart(2, "0");

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

function formatDateTime(
    value: string | Date | null,
) {
    if (!value) return "Não informado";

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(new Date(value));
}

function getStatusBadge(
    status: EventoStatus,
) {
    switch (status) {
        case "ativo":
            return {
                label: "Ativo",
                color: "success" as const,
            };
        case "agendado":
            return {
                label: "Agendado",
                color: "info" as const,
            };
        case "encerrado":
            return {
                label: "Encerrado",
                color: "warning" as const,
            };
        case "oculto":
            return {
                label: "Oculto",
                color: "secondary" as const,
            };
        case "inativo":
        default:
            return {
                label: "Inativo",
                color: "danger" as const,
            };
    }
}

function eventoToForm(
    evento: Evento,
): EventoFormState {
    return {
        titulo: evento.titulo,
        descricao:
            evento.descricao ?? "",
        url: evento.url ?? "",
        par_parceiro_id:
            evento
                .par_parceiro_id
                ? String(
                    evento
                        .par_parceiro_id,
                )
                : "",
        evento_at:
            toDateTimeLocal(
                evento.evento_at,
            ),
        inicio_exibicao:
            toDateTimeLocal(
                evento.inicio_exibicao,
            ),
        fim_exibicao:
            toDateTimeLocal(
                evento.fim_exibicao,
            ),
        ordem: String(evento.ordem),
        destaque:
            Boolean(evento.destaque),
        ativo:
            Boolean(evento.ativo),
        visivel_publico:
            Boolean(
                evento.visivel_publico,
            ),
        exibir_tv:
            Boolean(
                evento.exibir_tv,
            ),
    };
}

export default function AdminEventosClient({
                                               initialData,
                                           }: AdminEventosClientProps) {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [data, setData] =
        useState(initialData);

    const [viewMode, setViewMode] =
        useState<"list" | "preview">(
            "list",
        );

    const [modalOpen, setModalOpen] =
        useState(false);

    const [
        editingEvento,
        setEditingEvento,
    ] =
        useState<Evento | null>(null);

    const [form, setForm] =
        useState<EventoFormState>(
            emptyForm,
        );

    const [
        bannerFile,
        setBannerFile,
    ] = useState<File | null>(null);

    const [
        bannerPreviewUrl,
        setBannerPreviewUrl,
    ] =
        useState<string | null>(null);

    const [
        removerBanner,
        setRemoverBanner,
    ] = useState(false);

    const [dragging, setDragging] =
        useState(false);

    const [salvando, setSalvando] =
        useState(false);

    const [
        alterandoEventoId,
        setAlterandoEventoId,
    ] =
        useState<number | null>(null);

    const [
        previewEvento,
        setPreviewEvento,
    ] =
        useState<Evento | null>(null);

    const [snackbar, setSnackbar] =
        useState<SnackbarState | null>(
            null,
        );

    function updateForm<
        K extends keyof EventoFormState,
    >(
        key: K,
        value: EventoFormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function limparBannerNovo() {
        if (bannerPreviewUrl) {
            URL.revokeObjectURL(
                bannerPreviewUrl,
            );
        }

        setBannerFile(null);
        setBannerPreviewUrl(null);

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    }

    function resetBanner() {
        limparBannerNovo();
        setRemoverBanner(false);
    }

    function abrirCriacao() {
        resetBanner();
        setEditingEvento(null);
        setForm(emptyForm);
        setSnackbar(null);
        setModalOpen(true);
    }

    function abrirEdicao(
        evento: Evento,
    ) {
        resetBanner();
        setEditingEvento(evento);
        setForm(
            eventoToForm(evento),
        );
        setSnackbar(null);
        setModalOpen(true);
    }

    function fecharModal() {
        if (salvando) return;

        resetBanner();
        setModalOpen(false);
        setEditingEvento(null);
        setForm(emptyForm);
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
                color: "danger",
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
                color: "warning",
                title:
                    "Arquivo muito grande",
                message:
                    "O banner ultrapassa o limite de 5MB.",
            });
            return;
        }

        limparBannerNovo();

        setBannerFile(file);
        setBannerPreviewUrl(
            URL.createObjectURL(file),
        );
        setRemoverBanner(false);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (file) {
            selecionarBanner(file);
        }

        event.target.value = "";
    }

    function handleDrop(
        event: DragEvent<HTMLDivElement>,
    ) {
        event.preventDefault();
        setDragging(false);

        const file =
            event.dataTransfer.files?.[0];

        if (file) {
            selecionarBanner(file);
        }
    }

    function removerBannerAtual() {
        limparBannerNovo();
        setRemoverBanner(true);
    }

    function buildFormData() {
        const payload =
            new FormData();

        payload.set(
            "titulo",
            form.titulo,
        );
        payload.set(
            "descricao",
            form.descricao,
        );
        payload.set(
            "url",
            form.url,
        );
        payload.set(
            "par_parceiro_id",
            form.par_parceiro_id,
        );
        payload.set(
            "evento_at",
            form.evento_at,
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
            "ordem",
            form.ordem,
        );
        payload.set(
            "destaque",
            form.destaque
                ? "1"
                : "0",
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
            "exibir_tv",
            form.exibir_tv
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
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSalvando(true);
            setSnackbar(null);

            const isEditing =
                Boolean(editingEvento);

            const response =
                await fetch(
                    isEditing
                        ? `/api/admin/eventos/${editingEvento!.id}`
                        : "/api/admin/eventos",
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
                    result.message ||
                    "Não foi possível salvar o evento.",
                );
            }

            const evento =
                result.data
                    .evento as Evento;

            setData((current) => {
                const exists =
                    current.eventos.some(
                        (item) =>
                            item.id ===
                            evento.id,
                    );

                return {
                    ...current,
                    eventos: exists
                        ? current.eventos.map(
                            (item) =>
                                item.id ===
                                evento.id
                                    ? evento
                                    : item,
                        )
                        : [
                            evento,
                            ...current.eventos,
                        ],
                };
            });

            resetBanner();
            setModalOpen(false);
            setEditingEvento(null);
            setForm(emptyForm);

            setSnackbar({
                color: "success",
                title: isEditing
                    ? "Evento atualizado"
                    : "Evento criado",
                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao salvar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar o evento.",
                autoClose: false,
            });
        } finally {
            setSalvando(false);
        }
    }

    async function alternarAtivo(
        evento: Evento,
    ) {
        try {
            setAlterandoEventoId(
                evento.id,
            );
            setSnackbar(null);

            const novoAtivo =
                !Boolean(evento.ativo);

            const response =
                await fetch(
                    `/api/admin/eventos/${evento.id}`,
                    {
                        method: "PATCH",
                        headers: {
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
                    result.message ||
                    "Não foi possível alterar o evento.",
                );
            }

            const atualizado =
                result.data
                    .evento as Evento;

            setData((current) => ({
                ...current,
                eventos:
                    current.eventos.map(
                        (item) =>
                            item.id ===
                            atualizado.id
                                ? atualizado
                                : item,
                    ),
            }));

            setSnackbar({
                color: "success",
                title: novoAtivo
                    ? "Evento ativado"
                    : "Evento desativado",
                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao alterar evento",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o evento.",
                autoClose: false,
            });
        } finally {
            setAlterandoEventoId(null);
        }
    }

    async function alternarTv(
        evento:
            Evento,
    ) {
        try {
            setAlterandoEventoId(
                evento.id,
            );

            setSnackbar(
                null,
            );


            const exibirTv =
                !Boolean(
                    evento
                        .exibir_tv,
                );


            const response =
                await fetch(
                    `/api/admin/eventos/${evento.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "set_tv",

                                exibir_tv:
                                    exibirTv,
                            }),
                    },
                );


            const result =
                await response
                    .json();


            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível alterar a exibição do evento na TV.",
                );
            }


            const atualizado =
                result
                    .data
                    .evento as Evento;


            setData(
                (
                    current,
                ) => ({
                    ...current,

                    eventos:
                        current
                            .eventos
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


            setSnackbar({
                color:
                    "success",

                title:
                    exibirTv
                        ? "Evento adicionado à TV"
                        : "Evento pausado na TV",

                message:
                    result.message,
            });
        } catch (
            error
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar TV",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar a exibição do evento na TV.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoEventoId(
                null,
            );
        }
    }


    async function excluirEvento(
        evento: Evento,
    ) {
        const confirmado =
            window.confirm(
                `Excluir "${evento.titulo}"? O evento será removido das listagens.`,
            );

        if (!confirmado) {
            return;
        }

        try {
            setAlterandoEventoId(
                evento.id,
            );
            setSnackbar(null);

            const response =
                await fetch(
                    `/api/admin/eventos/${evento.id}`,
                    {
                        method:
                            "DELETE",
                        headers: {
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
                    result.message ||
                    "Não foi possível excluir o evento.",
                );
            }

            setData((current) => ({
                ...current,
                eventos:
                    current.eventos.filter(
                        (item) =>
                            item.id !==
                            evento.id,
                    ),
            }));

            if (
                previewEvento?.id ===
                evento.id
            ) {
                setPreviewEvento(null);
            }

            setSnackbar({
                color: "success",
                title:
                    "Evento excluído",
                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao excluir evento",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o evento.",
                autoClose: false,
            });
        } finally {
            setAlterandoEventoId(null);
        }
    }

    const bannerAtualUrl =
        bannerPreviewUrl ??
        (!removerBanner
            ? editingEvento?.banner
                ?.public_url ??
            null
            : null);

    return (
        <>
            <PageHeader
                title="Eventos"
                subtitle="Gerencie eventos e links temporários."
                actions={
                    <div className="bp-event-page-actions">
                        <div
                            className="bp-event-view-switch"
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
                                    size={16}
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
                                    size={16}
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
                                size={17}
                            />
                            Criar evento
                        </Button>
                    </div>
                }
            />

            {data.eventos.length === 0 ? (
                <EmptyState
                    icon={
                        <CalendarDays
                            size={24}
                        />
                    }
                    title="Nenhum evento cadastrado"
                    description="Crie o primeiro evento para começar a divulgar ações e links temporários."
                    action={
                        <Button
                            onClick={
                                abrirCriacao
                            }
                        >
                            <Plus
                                size={17}
                            />
                            Criar evento
                        </Button>
                    }
                />
            ) : viewMode === "list" ? (
                <>
                    <Table
                        headers={[
                            "Evento",
                            "Data",
                            "Exibição",
                            "Ordem",
                            "Status",
                            "TV",
                            "Ações",
                        ]}
                    >
                        {data.eventos.map(
                            (evento) => {
                                const status =
                                    getStatusBadge(
                                        evento.status,
                                    );

                                const busy =
                                    alterandoEventoId ===
                                    evento.id;

                                return (
                                    <tr
                                        key={
                                            evento.id
                                        }
                                    >
                                        <td>
                                            <div className="bp-event-table-name">
                                                <button
                                                    type="button"
                                                    className="bp-event-table-banner"
                                                    onClick={() =>
                                                        setPreviewEvento(
                                                            evento,
                                                        )
                                                    }
                                                >
                                                    {evento
                                                        .banner
                                                        ?.public_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                evento
                                                                    .banner
                                                                    .public_url
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <ImagePlus
                                                            size={
                                                                20
                                                            }
                                                        />
                                                    )}
                                                </button>

                                                <div>
                                                    <strong>
                                                        {
                                                            evento.titulo
                                                        }
                                                    </strong>

                                                    {evento.parceiro ? (
                                                        <div className="bp-event-table-meta">
                                                            {
                                                                evento
                                                                    .parceiro
                                                                    .nome
                                                            }
                                                        </div>
                                                    ) : null}

                                                    {evento.destaque ? (
                                                        <div className="bp-event-table-meta">
                                                            Destaque
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {formatDateTime(
                                                evento.evento_at,
                                            )}
                                        </td>

                                        <td>
                                            <div>
                                                <span className="bp-event-table-meta">
                                                    Início
                                                </span>
                                                <div>
                                                    {formatDateTime(
                                                        evento.inicio_exibicao,
                                                    )}
                                                </div>

                                                <span className="bp-event-table-meta">
                                                    Fim
                                                </span>
                                                <div>
                                                    {formatDateTime(
                                                        evento.fim_exibicao,
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {
                                                evento.ordem
                                            }
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
                                            <Badge
                                                color={
                                                    evento
                                                        .exibir_tv
                                                        ? "success"
                                                        : "secondary"
                                                }
                                            >
                                                {evento.exibir_tv
                                                    ? "Na TV"
                                                    : "Fora da TV"}
                                            </Badge>
                                        </td>

                                        <td>
                                            <div className="bp-event-row-actions">
                                                <Button
                                                    color="secondary"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setPreviewEvento(
                                                            evento,
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
                                                        evento.ativo
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        alternarAtivo(
                                                            evento,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    {evento.ativo ? (
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

                                                    {evento.ativo
                                                        ? "Desativar"
                                                        : "Ativar"}
                                                </Button>

                                                <Button
                                                    color={
                                                        evento
                                                            .exibir_tv
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        alternarTv(
                                                            evento,
                                                        )
                                                    }
                                                    disabled={
                                                        busy
                                                    }
                                                >
                                                    <MonitorPlay
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    {evento.exibir_tv
                                                        ? "Pausar na TV"
                                                        : "Ativar na TV"}
                                                </Button>

                                                <Button
                                                    color="secondary"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        abrirEdicao(
                                                            evento,
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
                                                        excluirEvento(
                                                            evento,
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

                    <div className="bp-event-admin-mobile-list">
                        {data.eventos.map(
                            (evento) => {
                                const status =
                                    getStatusBadge(
                                        evento.status,
                                    );

                                const busy =
                                    alterandoEventoId ===
                                    evento.id;

                                return (
                                    <article
                                        key={
                                            evento.id
                                        }
                                        className="bp-event-admin-mobile-card"
                                    >
                                        <button
                                            type="button"
                                            className="bp-event-admin-mobile-banner"
                                            onClick={() =>
                                                setPreviewEvento(
                                                    evento,
                                                )
                                            }
                                        >
                                            {evento
                                                .banner
                                                ?.public_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={
                                                        evento
                                                            .banner
                                                            .public_url
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <ImagePlus
                                                    size={
                                                        28
                                                    }
                                                />
                                            )}
                                        </button>

                                        <div className="bp-event-admin-mobile-body">
                                            <div className="bp-event-admin-mobile-title">
                                                <div>
                                                    <strong>
                                                        {
                                                            evento.titulo
                                                        }
                                                    </strong>

                                                    <span>
                                                        {formatDateTime(
                                                            evento.evento_at,
                                                        )}
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

                                            <div className="bp-event-admin-mobile-info">
                                                <div>
                                                    <span>
                                                        Início
                                                    </span>
                                                    <strong>
                                                        {formatDateTime(
                                                            evento.inicio_exibicao,
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Fim
                                                    </span>
                                                    <strong>
                                                        {formatDateTime(
                                                            evento.fim_exibicao,
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Ordem
                                                    </span>
                                                    <strong>
                                                        {
                                                            evento.ordem
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Destaque
                                                    </span>
                                                    <strong>
                                                        {evento.destaque
                                                            ? "Sim"
                                                            : "Não"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        TV
                                                    </span>
                                                    <strong>
                                                        {evento.exibir_tv
                                                            ? "Exibindo"
                                                            : "Não"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bp-event-admin-mobile-actions">
                                            <Button
                                                color="secondary"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    setPreviewEvento(
                                                        evento,
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
                                                    evento
                                                        .exibir_tv
                                                        ? "warning"
                                                        : "success"
                                                }
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    alternarTv(
                                                        evento,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                <MonitorPlay
                                                    size={
                                                        16
                                                    }
                                                />

                                                {evento.exibir_tv
                                                    ? "Pausar na TV"
                                                    : "Ativar na TV"}
                                            </Button>

                                            <Button
                                                color="secondary"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    abrirEdicao(
                                                        evento,
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
                                                    evento.ativo
                                                        ? "warning"
                                                        : "success"
                                                }
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    alternarAtivo(
                                                        evento,
                                                    )
                                                }
                                                disabled={
                                                    busy
                                                }
                                            >
                                                {evento.ativo ? (
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
                                                {evento.ativo
                                                    ? "Desativar"
                                                    : "Ativar"}
                                            </Button>

                                            <Button
                                                color="danger"
                                                variant="soft"
                                                size="sm"
                                                onClick={() =>
                                                    excluirEvento(
                                                        evento,
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
                <div className="bp-event-preview-grid">
                    {data.eventos.map(
                        (evento) => {
                            const status =
                                getStatusBadge(
                                    evento.status,
                                );

                            return (
                                <button
                                    key={
                                        evento.id
                                    }
                                    type="button"
                                    className="bp-event-preview-card"
                                    onClick={() =>
                                        setPreviewEvento(
                                            evento,
                                        )
                                    }
                                >
                                    <div className="bp-event-preview-card-banner">
                                        {evento
                                            .banner
                                            ?.public_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={
                                                    evento
                                                        .banner
                                                        .public_url
                                                }
                                                alt={
                                                    evento.titulo
                                                }
                                            />
                                        ) : (
                                            <CalendarDays
                                                size={
                                                    36
                                                }
                                            />
                                        )}

                                        <div className="bp-event-preview-card-badges">
                                            {evento.destaque ? (
                                                <Badge color="success">
                                                    Destaque
                                                </Badge>
                                            ) : null}

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

                                    <div className="bp-event-preview-card-body">
                                        <span className="bp-event-preview-date">
                                            {formatDateTime(
                                                evento.evento_at,
                                            )}
                                        </span>

                                        <strong>
                                            {
                                                evento.titulo
                                            }
                                        </strong>

                                        {evento.descricao ? (
                                            <MarkdownContent
                                                className="bp-markdown-compact"
                                            >
                                                {evento.descricao}
                                            </MarkdownContent>
                                        ) : (
                                            <p>
                                                Sem descrição.
                                            </p>
                                        )}

                                        {evento.url ? (
                                            <span className="bp-event-preview-link">
                                                <ExternalLink
                                                    size={
                                                        14
                                                    }
                                                />
                                                Acessar evento
                                            </span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        },
                    )}
                </div>
            )}

            <Modal
                open={modalOpen}
                size="xl"
                title={
                    editingEvento
                        ? "Editar evento"
                        : "Criar evento"
                }
                description={
                    editingEvento
                        ? "Atualize o banner, conteúdo e publicação do evento."
                        : "Cadastre um evento para divulgação no sistema."
                }
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
                            form="evento-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : editingEvento
                                    ? "Salvar alterações"
                                    : "Criar evento"}
                        </Button>
                    </>
                }
            >
                <form
                    id="evento-form"
                    className="bp-event-form"
                    onSubmit={salvar}
                >
                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Banner do evento
                                </h3>
                                <span className="bp-field-help">
                                    Use uma imagem horizontal. Máximo de 5MB.
                                </span>
                            </div>

                            <ImagePlus
                                size={20}
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
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        bannerAtualUrl
                                    }
                                    alt="Prévia do banner"
                                />

                                <div className="bp-event-banner-editor-actions">
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
                            <h3 className="bp-product-section-title">
                                Informações do evento
                            </h3>
                        </div>

                        <div className="bp-event-grid">
                            <Input
                                label="Título"
                                value={
                                    form.titulo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "titulo",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                maxLength={
                                    150
                                }
                                required
                            />

                            <Input
                                label="URL externa"
                                type="url"
                                value={
                                    form.url
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "url",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="https://..."
                                maxLength={
                                    1000
                                }
                                helperText="Opcional. Instagram, WhatsApp, formulário, Sympla ou outro site."
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="evento-parceiro"
                                className="bp-label"
                            >
                                Parceiro
                            </label>

                            <select
                                id="evento-parceiro"
                                className="bp-select"
                                value={
                                    form
                                        .par_parceiro_id
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        updateForm(
                                            "par_parceiro_id",
                                            event
                                                .target
                                                .value,
                                        )
                                }
                            >
                                <option value="">
                                    AAACCU / sem parceiro
                                </option>

                                {data.parceiros.map(
                                    (
                                        parceiro,
                                    ) => (
                                        <option
                                            key={
                                                parceiro.id
                                            }
                                            value={
                                                parceiro.id
                                            }
                                        >
                                            {
                                                parceiro.nome
                                            }
                                        </option>
                                    ),
                                )}
                            </select>

                            <span className="bp-helper">
        Opcional. Vincule quando o evento pertencer a um parceiro específico.
    </span>
                        </div>
                        <Textarea
                            label="Descrição"
                            helperText="Suporta Markdown: **negrito**, *itálico*, listas, títulos, links, tabelas e código."
                            value={
                                form.descricao
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "descricao",
                                    event.target
                                        .value,
                                )
                            }
                            rows={4}
                            placeholder="Descrição do evento"
                        />
                    </section>

                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <h3 className="bp-product-section-title">
                                Data e publicação
                            </h3>
                        </div>

                        <div className="bp-event-grid">
                            <Input
                                label="Data do evento"
                                type="datetime-local"
                                value={
                                    form.evento_at
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "evento_at",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />

                            <Input
                                label="Ordem"
                                type="number"
                                min="0"
                                step="1"
                                value={
                                    form.ordem
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "ordem",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                required
                            />

                            <Input
                                label="Início da exibição"
                                type="datetime-local"
                                value={
                                    form.inicio_exibicao
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
                                    form.fim_exibicao
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
                                Evento ativo
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.visivel_publico
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
                                        form.exibir_tv
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "exibir_tv",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />
                                Exibir na TV
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.destaque
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "destaque",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />
                                Destacar evento
                            </label>
                        </div>
                    </section>
                </form>
            </Modal>

            <Modal
                open={Boolean(
                    previewEvento,
                )}
                size="full"
                title={
                    previewEvento?.titulo ??
                    "Prévia do evento"
                }
                description="Prévia administrativa de como o evento poderá aparecer para o público."
                onCloseAction={() =>
                    setPreviewEvento(null)
                }
                footer={
                    previewEvento?.url ? (
                        <>
                            <Button
                                type="button"
                                color="secondary"
                                variant="ghost"
                                onClick={() =>
                                    setPreviewEvento(
                                        null,
                                    )
                                }
                            >
                                Fechar
                            </Button>

                            <a
                                className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                                href={
                                    previewEvento.url
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink
                                    size={17}
                                />
                                Acessar evento
                            </a>
                        </>
                    ) : (
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() =>
                                setPreviewEvento(
                                    null,
                                )
                            }
                        >
                            Fechar
                        </Button>
                    )
                }
            >
                {previewEvento ? (
                    <div className="bp-event-full-preview">
                        <div className="bp-event-full-preview-banner">
                            {previewEvento
                                .banner
                                ?.public_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        previewEvento
                                            .banner
                                            .public_url
                                    }
                                    alt={
                                        previewEvento.titulo
                                    }
                                />
                            ) : (
                                <CalendarDays
                                    size={56}
                                />
                            )}
                        </div>

                        <div className="bp-event-full-preview-content">
                            <div className="bp-badge-row">
                                {previewEvento.destaque ? (
                                    <Badge color="success">
                                        Destaque
                                    </Badge>
                                ) : null}

                                <Badge
                                    color={
                                        getStatusBadge(
                                            previewEvento.status,
                                        )
                                            .color
                                    }
                                >
                                    {
                                        getStatusBadge(
                                            previewEvento.status,
                                        )
                                            .label
                                    }
                                </Badge>
                            </div>

                            <span className="bp-event-full-preview-date">
                                {formatDateTime(
                                    previewEvento.evento_at,
                                )}
                            </span>

                            <h2>
                                {
                                    previewEvento.titulo
                                }
                            </h2>

                            {previewEvento.descricao ? (
                                <MarkdownContent>
                                    {previewEvento.descricao}
                                </MarkdownContent>
                            ) : (
                                <p>
                                    Sem descrição informada.
                                </p>
                            )}

                            {previewEvento.url ? (
                                <a
                                    className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                                    href={
                                        previewEvento.url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink
                                        size={
                                            17
                                        }
                                    />
                                    Acessar evento
                                </a>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </Modal>

            {snackbar && (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(null)
                    }
                />
            )}
        </>
    );
}
