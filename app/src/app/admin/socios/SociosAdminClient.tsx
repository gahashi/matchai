"use client";

import { FormEvent, useMemo, useState } from "react";
import {
    Ban,
    CalendarClock,
    Eye,
    MessageCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShieldOff,
    UserRoundCheck,
    UsersRound,
} from "lucide-react";

import {
    AsyncSelect,
    type AsyncSelectOption,
} from "@/components/ui/AsyncSelect";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";
import { Table } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";

type StatusCodigo =
    | "pendente"
    | "ativo"
    | "expirado"
    | "cancelado"
    | "bloqueado";

type Socio = {
    id: number;
    sys_usuario_id: number;
    soc_plano_id: number;
    soc_socio_status_id: number;
    inicio_at: string | Date;
    fim_at: string | Date;
    observacao: string | null;
    status_efetivo: StatusCodigo;
    usuario: {
        id: number;
        nome: string;
        nickname: string;
        email: string;
        telefone: string | null;
        ativo: number;
    };
    plano: {
        id: number;
        codigo: string;
        nome: string;
        duracao_dias: number;
        ativo: number;
    };
    status: {
        id: number;
        codigo: string;
        descricao: string;
        color: string | null;
        icon: string | null;
    };
    origem: {
        id: number;
        codigo: string;
        descricao: string;
    };
};

type PlanoOption = {
    id: number;
    codigo: string;
    nome: string;
    duracao_dias: number;
    ativo: number;
};

type StatusOption = {
    id: number;
    codigo: string;
    descricao: string;
    color: string | null;
    icon: string | null;
};

type AdminSociosData = {
    socios: Socio[];
    planos: PlanoOption[];
    statuses: StatusOption[];
};

type Props = {
    initialData: AdminSociosData;
};

type FormState = {
    soc_plano_id: string;
    soc_socio_status_id: string;
    inicio_at: string;
    fim_at: string;
    observacao: string;
};

type WhatsAppTipo = "aviso" | "cobranca" | "renovacao";

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function toDateTimeLocal(value: string | Date) {
    const date = new Date(value);

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

function nowLocal() {
    return toDateTimeLocal(new Date());
}

function addDaysLocal(value: string, days: number) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return toDateTimeLocal(date);
}

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
    }).format(new Date(value));
}

function formatDateTime(value: string | Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

function getStatusBadge(codigo: StatusCodigo) {
    switch (codigo) {
        case "ativo":
            return { label: "Ativo", color: "success" as const };
        case "pendente":
            return { label: "Pendente", color: "warning" as const };
        case "expirado":
            return { label: "Expirado", color: "secondary" as const };
        case "cancelado":
            return { label: "Cancelado", color: "danger" as const };
        case "bloqueado":
        default:
            return { label: "Bloqueado", color: "danger" as const };
    }
}

function normalizeWhatsAppPhone(phone: string | null) {
    if (!phone) return null;

    let digits = phone.replace(/\D/g, "");
    if (!digits) return null;

    if (digits.length === 10 || digits.length === 11) {
        digits = `55${digits}`;
    }

    return digits;
}

function buildWhatsappMessage(socio: Socio, tipo: WhatsAppTipo) {
    const primeiroNome =
        socio.usuario.nome.trim().split(/\s+/)[0] || socio.usuario.nome;

    if (tipo === "cobranca") {
        return `Olá, ${primeiroNome}! Tudo bem?\n\nEstamos entrando em contato pela AAACCU sobre sua associação "${socio.plano.nome}". Caso exista alguma pendência referente à associação, pedimos que nos chame por aqui para regularizarmos.\n\nValidade registrada: ${formatDate(socio.fim_at)}.`;
    }

    if (tipo === "renovacao") {
        return `Olá, ${primeiroNome}! Tudo bem?\n\nSua associação "${socio.plano.nome}" está com validade até ${formatDate(socio.fim_at)}. Se quiser renovar ou tiver alguma dúvida sobre a associação da AAACCU, pode falar com a gente por aqui.`;
    }

    return `Olá, ${primeiroNome}! Tudo bem?\n\nEstamos entrando em contato pela AAACCU sobre sua associação "${socio.plano.nome}", válida até ${formatDate(socio.fim_at)}.\n\nSe precisar de alguma informação, pode responder por aqui.`;
}

function socioToForm(socio: Socio): FormState {
    return {
        soc_plano_id: String(socio.soc_plano_id),
        soc_socio_status_id: String(socio.soc_socio_status_id),
        inicio_at: toDateTimeLocal(socio.inicio_at),
        fim_at: toDateTimeLocal(socio.fim_at),
        observacao: socio.observacao ?? "",
    };
}

export default function SociosAdminClient({ initialData }: Props) {
    const [data, setData] = useState(initialData);
    const [filtroStatus, setFiltroStatus] =
        useState<"todos" | StatusCodigo>("todos");
    const [busca, setBusca] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [editSocio, setEditSocio] = useState<Socio | null>(null);
    const [viewSocio, setViewSocio] = useState<Socio | null>(null);
    const [whatsappSocio, setWhatsappSocio] =
        useState<Socio | null>(null);
    const [whatsappTipo, setWhatsappTipo] =
        useState<WhatsAppTipo>("aviso");
    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [usuarioSelecionado, setUsuarioSelecionado] =
        useState<AsyncSelectOption | null>(null);
    const [form, setForm] = useState<FormState>({
        soc_plano_id: "",
        soc_socio_status_id: "",
        inicio_at: nowLocal(),
        fim_at: nowLocal(),
        observacao: "",
    });
    const [salvando, setSalvando] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [snackbar, setSnackbar] =
        useState<SnackbarState | null>(null);

    const planosOptions = data.planos.map((plano) => ({
        value: plano.id,
        label: `${plano.nome} · ${plano.duracao_dias} dias${
            plano.ativo ? "" : " · inativo"
        }`,
    }));

    const statusOptions = data.statuses.map((status) => ({
        value: status.id,
        label: status.descricao,
    }));

    const statusAtivo = data.statuses.find(
        (status) => status.codigo === "ativo",
    );

    const filteredSocios = useMemo(() => {
        const term = busca.trim().toLowerCase();

        return data.socios
            .filter(
                (socio) =>
                    filtroStatus === "todos" ||
                    socio.status_efetivo === filtroStatus,
            )
            .filter((socio) => {
                if (!term) return true;

                return [
                    socio.usuario.nome,
                    socio.usuario.nickname,
                    socio.usuario.email,
                    socio.usuario.telefone,
                    socio.plano.nome,
                    socio.plano.codigo,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(term),
                    );
            });
    }, [busca, data.socios, filtroStatus]);

    const statusCounts = useMemo(() => {
        const counts: Partial<Record<StatusCodigo, number>> = {};
        for (const socio of data.socios) {
            counts[socio.status_efetivo] =
                (counts[socio.status_efetivo] ?? 0) + 1;
        }
        return counts;
    }, [data.socios]);

    function updateForm<K extends keyof FormState>(
        key: K,
        value: FormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function abrirCriacao() {
        const plano =
            data.planos.find((item) => item.ativo) ??
            data.planos[0] ??
            null;
        const inicio = nowLocal();

        setUsuarioSelecionado(null);
        setForm({
            soc_plano_id: plano ? String(plano.id) : "",
            soc_socio_status_id: statusAtivo
                ? String(statusAtivo.id)
                : "",
            inicio_at: inicio,
            fim_at: plano
                ? addDaysLocal(inicio, plano.duracao_dias)
                : inicio,
            observacao: "",
        });
        setCreateOpen(true);
    }

    function abrirEdicao(socio: Socio) {
        setEditSocio(socio);
        setForm(socioToForm(socio));
    }

    function handlePlanoChange(value: string) {
        updateForm("soc_plano_id", value);

        const plano = data.planos.find(
            (item) => String(item.id) === value,
        );
        if (plano && form.inicio_at) {
            updateForm(
                "fim_at",
                addDaysLocal(form.inicio_at, plano.duracao_dias),
            );
        }
    }

    function atualizarSocioLocal(socio: Socio) {
        setData((current) => ({
            ...current,
            socios: current.socios.some((item) => item.id === socio.id)
                ? current.socios.map((item) =>
                    item.id === socio.id ? socio : item,
                )
                : [socio, ...current.socios],
        }));

        if (viewSocio?.id === socio.id) {
            setViewSocio(socio);
        }
    }

    async function criarSocio(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!usuarioSelecionado) {
            setSnackbar({
                color: "warning",
                title: "Usuário obrigatório",
                message: "Selecione o usuário que será associado.",
            });
            return;
        }

        try {
            setSalvando(true);
            setSnackbar(null);

            const response = await fetch("/api/admin/socios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    sys_usuario_id: Number(usuarioSelecionado.id),
                    soc_plano_id: Number(form.soc_plano_id),
                    soc_socio_status_id: Number(
                        form.soc_socio_status_id,
                    ),
                    inicio_at: form.inicio_at,
                    fim_at: form.fim_at,
                    observacao: form.observacao,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Não foi possível adicionar o sócio.",
                );
            }

            atualizarSocioLocal(result.data.socio as Socio);
            setCreateOpen(false);
            setUsuarioSelecionado(null);
            setSnackbar({
                color: "success",
                title: "Sócio adicionado",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao adicionar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível adicionar o sócio.",
                autoClose: false,
            });
        } finally {
            setSalvando(false);
        }
    }

    async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editSocio) return;

        try {
            setSalvando(true);
            setSnackbar(null);

            const response = await fetch(
                `/api/admin/socios/${editSocio.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        soc_plano_id: Number(form.soc_plano_id),
                        soc_socio_status_id: Number(
                            form.soc_socio_status_id,
                        ),
                        inicio_at: form.inicio_at,
                        fim_at: form.fim_at,
                        observacao: form.observacao,
                    }),
                },
            );

            const result = await response.json();
            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Não foi possível atualizar a associação.",
                );
            }

            atualizarSocioLocal(result.data.socio as Socio);
            setEditSocio(null);
            setSnackbar({
                color: "success",
                title: "Associação atualizada",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao atualizar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar a associação.",
                autoClose: false,
            });
        } finally {
            setSalvando(false);
        }
    }

    async function runAction(
        socio: Socio,
        action: "renovar" | "cancelar" | "bloquear",
    ) {
        if (
            action === "cancelar" &&
            !window.confirm(
                `Cancelar a associação de ${socio.usuario.nome}?`,
            )
        ) {
            return;
        }

        if (
            action === "bloquear" &&
            !window.confirm(
                `Bloquear a associação de ${socio.usuario.nome}?`,
            )
        ) {
            return;
        }

        try {
            setBusyId(socio.id);
            setSnackbar(null);

            const response = await fetch(
                `/api/admin/socios/${socio.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ action }),
                },
            );

            const result = await response.json();
            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message || "Não foi possível executar a ação.",
                );
            }

            atualizarSocioLocal(result.data.socio as Socio);
            setSnackbar({
                color: "success",
                title:
                    action === "renovar"
                        ? "Associação renovada"
                        : action === "cancelar"
                            ? "Associação cancelada"
                            : "Associação bloqueada",
                message: result.message,
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro na associação",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível executar a ação.",
                autoClose: false,
            });
        } finally {
            setBusyId(null);
        }
    }

    function abrirWhatsapp(socio: Socio) {
        setWhatsappSocio(socio);
        setWhatsappTipo("aviso");
        setWhatsappMessage(buildWhatsappMessage(socio, "aviso"));
    }

    function changeWhatsAppTipo(tipo: WhatsAppTipo) {
        setWhatsappTipo(tipo);
        if (whatsappSocio) {
            setWhatsappMessage(
                buildWhatsappMessage(whatsappSocio, tipo),
            );
        }
    }

    function enviarWhatsapp() {
        if (!whatsappSocio) return;

        const phone = normalizeWhatsAppPhone(
            whatsappSocio.usuario.telefone,
        );

        if (!phone) {
            setSnackbar({
                color: "warning",
                title: "Telefone indisponível",
                message:
                    "Este usuário não possui um telefone válido cadastrado.",
            });
            return;
        }

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(
            whatsappMessage,
        )}`;

        window.open(url, "_blank", "noopener,noreferrer");
    }

    const filterItems: Array<{
        value: "todos" | StatusCodigo;
        label: string;
        count: number;
    }> = [
        { value: "todos", label: "Todos", count: data.socios.length },
        {
            value: "ativo",
            label: "Ativos",
            count: statusCounts.ativo ?? 0,
        },
        {
            value: "pendente",
            label: "Pendentes",
            count: statusCounts.pendente ?? 0,
        },
        {
            value: "expirado",
            label: "Expirados",
            count: statusCounts.expirado ?? 0,
        },
        {
            value: "cancelado",
            label: "Cancelados",
            count: statusCounts.cancelado ?? 0,
        },
        {
            value: "bloqueado",
            label: "Bloqueados",
            count: statusCounts.bloqueado ?? 0,
        },
    ];

    return (
        <>
            <PageHeader
                title="Sócios"
                subtitle="Consulte e gerencie associações, validade e status."
                actions={
                    <Button onClick={abrirCriacao}>
                        <Plus size={17} />
                        Adicionar sócio
                    </Button>
                }
            />

            <div className="bp-socio-toolbar">
                <div className="bp-socio-filter-tabs">
                    {filterItems.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            className={
                                filtroStatus === item.value
                                    ? "is-active"
                                    : ""
                            }
                            onClick={() =>
                                setFiltroStatus(item.value)
                            }
                        >
                            {item.label}
                            <span>{item.count}</span>
                        </button>
                    ))}
                </div>

                <div className="bp-socio-search">
                    <Search size={17} />
                    <input
                        type="search"
                        value={busca}
                        onChange={(event) =>
                            setBusca(event.target.value)
                        }
                        placeholder="Buscar por nome, email, telefone ou plano..."
                    />
                </div>
            </div>

            {data.socios.length === 0 ? (
                <EmptyState
                    icon={<UsersRound size={24} />}
                    title="Nenhum sócio cadastrado"
                    description="Adicione uma associação manual para começar a testar validade, status e benefícios de sócio."
                    action={
                        <Button onClick={abrirCriacao}>
                            <Plus size={17} />
                            Adicionar sócio
                        </Button>
                    }
                />
            ) : filteredSocios.length === 0 ? (
                <EmptyState
                    icon={<Search size={24} />}
                    title="Nenhum resultado"
                    description="Nenhum sócio corresponde aos filtros atuais."
                />
            ) : (
                <>
                    <Table
                        headers={[
                            "Usuário",
                            "Plano",
                            "Início",
                            "Validade",
                            "Status",
                            "Origem",
                            "Ações",
                        ]}
                    >
                        {filteredSocios.map((socio) => {
                            const badge = getStatusBadge(
                                socio.status_efetivo,
                            );
                            const busy = busyId === socio.id;

                            return (
                                <tr key={socio.id}>
                                    <td>
                                        <div className="bp-socio-user">
                                            <div className="bp-socio-user-icon">
                                                <UserRoundCheck size={18} />
                                            </div>
                                            <div>
                                                <strong>
                                                    {socio.usuario.nome}
                                                </strong>
                                                <span>
                                                    @{socio.usuario.nickname}
                                                </span>
                                                <span>
                                                    {socio.usuario.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{socio.plano.nome}</strong>
                                        <span className="bp-socio-muted">
                                            {socio.plano.duracao_dias} dias
                                        </span>
                                    </td>
                                    <td>{formatDate(socio.inicio_at)}</td>
                                    <td>
                                        <strong>
                                            {formatDate(socio.fim_at)}
                                        </strong>
                                    </td>
                                    <td>
                                        <Badge color={badge.color}>
                                            {badge.label}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className="bp-socio-origin">
                                            {socio.origem.descricao}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="bp-socio-row-actions">
                                            <Button
                                                color="secondary"
                                                variant="ghost"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() =>
                                                    setViewSocio(socio)
                                                }
                                            >
                                                <Eye size={16} />
                                                Ver
                                            </Button>

                                            {socio.usuario.telefone ? (
                                                <Button
                                                    color="success"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        abrirWhatsapp(socio)
                                                    }
                                                >
                                                    <MessageCircle
                                                        size={16}
                                                    />
                                                    WhatsApp
                                                </Button>
                                            ) : null}

                                            <Button
                                                color="secondary"
                                                variant="ghost"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() =>
                                                    abrirEdicao(socio)
                                                }
                                            >
                                                <Pencil size={16} />
                                                Editar
                                            </Button>

                                            <Button
                                                color="primary"
                                                variant="ghost"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() =>
                                                    runAction(
                                                        socio,
                                                        "renovar",
                                                    )
                                                }
                                            >
                                                <RefreshCw size={16} />
                                                Renovar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>

                    <div className="bp-socio-mobile-list">
                        {filteredSocios.map((socio) => {
                            const badge = getStatusBadge(
                                socio.status_efetivo,
                            );
                            const busy = busyId === socio.id;

                            return (
                                <article
                                    key={socio.id}
                                    className="bp-socio-mobile-card"
                                >
                                    <div className="bp-socio-mobile-head">
                                        <div className="bp-socio-user-icon">
                                            <UserRoundCheck size={19} />
                                        </div>
                                        <div className="bp-socio-mobile-title">
                                            <strong>
                                                {socio.usuario.nome}
                                            </strong>
                                            <span>
                                                @{socio.usuario.nickname}
                                            </span>
                                        </div>
                                        <Badge color={badge.color}>
                                            {badge.label}
                                        </Badge>
                                    </div>

                                    <div className="bp-socio-mobile-info">
                                        <div>
                                            <span>Plano</span>
                                            <strong>
                                                {socio.plano.nome}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Validade</span>
                                            <strong>
                                                {formatDate(socio.fim_at)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Origem</span>
                                            <strong>
                                                {socio.origem.descricao}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Telefone</span>
                                            <strong>
                                                {socio.usuario.telefone ??
                                                    "Não informado"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="bp-socio-mobile-actions">
                                        <Button
                                            color="secondary"
                                            variant="soft"
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                                setViewSocio(socio)
                                            }
                                        >
                                            <Eye size={16} />
                                            Ver
                                        </Button>

                                        {socio.usuario.telefone ? (
                                            <Button
                                                color="success"
                                                variant="soft"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() =>
                                                    abrirWhatsapp(socio)
                                                }
                                            >
                                                <MessageCircle size={16} />
                                                WhatsApp
                                            </Button>
                                        ) : (
                                            <Button
                                                color="secondary"
                                                variant="soft"
                                                size="sm"
                                                disabled
                                            >
                                                <MessageCircle size={16} />
                                                Sem telefone
                                            </Button>
                                        )}

                                        <Button
                                            color="secondary"
                                            variant="soft"
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                                abrirEdicao(socio)
                                            }
                                        >
                                            <Pencil size={16} />
                                            Editar
                                        </Button>

                                        <Button
                                            color="primary"
                                            variant="soft"
                                            size="sm"
                                            disabled={busy}
                                            onClick={() =>
                                                runAction(
                                                    socio,
                                                    "renovar",
                                                )
                                            }
                                        >
                                            <RefreshCw size={16} />
                                            Renovar
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            <Modal
                open={createOpen}
                size="lg"
                title="Adicionar sócio"
                description="Crie uma associação manual para um usuário já cadastrado."
                onCloseAction={() =>
                    !salvando && setCreateOpen(false)
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            disabled={salvando}
                            onClick={() => setCreateOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="socio-create-form"
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : "Adicionar sócio"}
                        </Button>
                    </>
                }
            >
                <form
                    id="socio-create-form"
                    className="bp-socio-form"
                    onSubmit={criarSocio}
                >
                    <AsyncSelect
                        label="Usuário"
                        endpoint="/api/sys/usuarios/select"
                        value={usuarioSelecionado}
                        onChange={setUsuarioSelecionado}
                        placeholder="Buscar por nome, nickname ou email..."
                        helperText="Somente usuários ativos e não excluídos aparecem na busca."
                        required
                    />

                    <div className="bp-socio-form-grid">
                        <Select
                            label="Plano"
                            value={form.soc_plano_id}
                            onChange={(event) =>
                                handlePlanoChange(event.target.value)
                            }
                            options={planosOptions}
                            placeholder="Selecione o plano"
                            required
                        />
                        <Select
                            label="Status inicial"
                            value={form.soc_socio_status_id}
                            onChange={(event) =>
                                updateForm(
                                    "soc_socio_status_id",
                                    event.target.value,
                                )
                            }
                            options={statusOptions}
                            placeholder="Selecione o status"
                            required
                        />
                        <Input
                            label="Início"
                            type="datetime-local"
                            value={form.inicio_at}
                            onChange={(event) => {
                                const inicio = event.target.value;
                                updateForm("inicio_at", inicio);

                                const plano = data.planos.find(
                                    (item) =>
                                        String(item.id) ===
                                        form.soc_plano_id,
                                );
                                if (plano) {
                                    updateForm(
                                        "fim_at",
                                        addDaysLocal(
                                            inicio,
                                            plano.duracao_dias,
                                        ),
                                    );
                                }
                            }}
                            required
                        />
                        <Input
                            label="Validade"
                            type="datetime-local"
                            value={form.fim_at}
                            onChange={(event) =>
                                updateForm(
                                    "fim_at",
                                    event.target.value,
                                )
                            }
                            required
                        />
                    </div>

                    <Textarea
                        label="Observação"
                        value={form.observacao}
                        onChange={(event) =>
                            updateForm(
                                "observacao",
                                event.target.value,
                            )
                        }
                        maxLength={500}
                        rows={4}
                        placeholder="Ex.: associação concedida manualmente, pagamento conferido presencialmente..."
                    />
                </form>
            </Modal>

            <Modal
                open={Boolean(editSocio)}
                size="lg"
                title="Editar associação"
                description={
                    editSocio
                        ? `${editSocio.usuario.nome} · ${editSocio.plano.nome}`
                        : undefined
                }
                onCloseAction={() =>
                    !salvando && setEditSocio(null)
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            disabled={salvando}
                            onClick={() => setEditSocio(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="socio-edit-form"
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar alterações"}
                        </Button>
                    </>
                }
            >
                <form
                    id="socio-edit-form"
                    className="bp-socio-form"
                    onSubmit={salvarEdicao}
                >
                    <div className="bp-socio-form-grid">
                        <Select
                            label="Plano"
                            value={form.soc_plano_id}
                            onChange={(event) =>
                                handlePlanoChange(event.target.value)
                            }
                            options={planosOptions}
                            required
                        />
                        <Select
                            label="Status"
                            value={form.soc_socio_status_id}
                            onChange={(event) =>
                                updateForm(
                                    "soc_socio_status_id",
                                    event.target.value,
                                )
                            }
                            options={statusOptions}
                            required
                        />
                        <Input
                            label="Início"
                            type="datetime-local"
                            value={form.inicio_at}
                            onChange={(event) =>
                                updateForm(
                                    "inicio_at",
                                    event.target.value,
                                )
                            }
                            required
                        />
                        <Input
                            label="Validade"
                            type="datetime-local"
                            value={form.fim_at}
                            onChange={(event) =>
                                updateForm(
                                    "fim_at",
                                    event.target.value,
                                )
                            }
                            required
                        />
                    </div>

                    <Textarea
                        label="Observação"
                        value={form.observacao}
                        onChange={(event) =>
                            updateForm(
                                "observacao",
                                event.target.value,
                            )
                        }
                        maxLength={500}
                        rows={4}
                    />
                </form>
            </Modal>

            <Modal
                open={Boolean(viewSocio)}
                size="lg"
                title={viewSocio?.usuario.nome ?? "Detalhes do sócio"}
                description="Detalhes administrativos da associação."
                onCloseAction={() => setViewSocio(null)}
                footer={
                    <>
                        {viewSocio?.usuario.telefone ? (
                            <Button
                                type="button"
                                color="success"
                                variant="soft"
                                onClick={() => abrirWhatsapp(viewSocio)}
                            >
                                <MessageCircle size={16} />
                                WhatsApp
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() => setViewSocio(null)}
                        >
                            Fechar
                        </Button>
                    </>
                }
            >
                {viewSocio ? (
                    <div className="bp-socio-detail">
                        <section className="bp-socio-detail-user">
                            <div className="bp-socio-detail-avatar">
                                <UserRoundCheck size={28} />
                            </div>
                            <div>
                                <h3>{viewSocio.usuario.nome}</h3>
                                <span>
                                    @{viewSocio.usuario.nickname}
                                </span>
                                <span>{viewSocio.usuario.email}</span>
                                <span>
                                    {viewSocio.usuario.telefone ??
                                        "Telefone não informado"}
                                </span>
                            </div>
                            <Badge
                                color={
                                    getStatusBadge(
                                        viewSocio.status_efetivo,
                                    ).color
                                }
                            >
                                {
                                    getStatusBadge(
                                        viewSocio.status_efetivo,
                                    ).label
                                }
                            </Badge>
                        </section>

                        <div className="bp-socio-detail-grid">
                            <div>
                                <span>Plano</span>
                                <strong>{viewSocio.plano.nome}</strong>
                            </div>
                            <div>
                                <span>Origem</span>
                                <strong>
                                    {viewSocio.origem.descricao}
                                </strong>
                            </div>
                            <div>
                                <span>Início</span>
                                <strong>
                                    {formatDateTime(
                                        viewSocio.inicio_at,
                                    )}
                                </strong>
                            </div>
                            <div>
                                <span>Validade</span>
                                <strong>
                                    {formatDateTime(viewSocio.fim_at)}
                                </strong>
                            </div>
                        </div>

                        {viewSocio.observacao ? (
                            <div className="bp-socio-note">
                                <span>Observação</span>
                                <p>{viewSocio.observacao}</p>
                            </div>
                        ) : null}

                        <div className="bp-socio-detail-actions">
                            <Button
                                color="secondary"
                                variant="soft"
                                onClick={() => {
                                    abrirEdicao(viewSocio);
                                    setViewSocio(null);
                                }}
                            >
                                <CalendarClock size={16} />
                                Editar validade/status
                            </Button>
                            <Button
                                color="primary"
                                variant="soft"
                                onClick={() =>
                                    runAction(viewSocio, "renovar")
                                }
                            >
                                <RefreshCw size={16} />
                                Renovar
                            </Button>
                            <Button
                                color="warning"
                                variant="soft"
                                onClick={() =>
                                    runAction(viewSocio, "bloquear")
                                }
                            >
                                <Ban size={16} />
                                Bloquear
                            </Button>
                            <Button
                                color="danger"
                                variant="soft"
                                onClick={() =>
                                    runAction(viewSocio, "cancelar")
                                }
                            >
                                <ShieldOff size={16} />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                open={Boolean(whatsappSocio)}
                size="md"
                title="Mensagem pelo WhatsApp"
                description={
                    whatsappSocio
                        ? `${whatsappSocio.usuario.nome} · ${whatsappSocio.usuario.telefone ?? ""}`
                        : undefined
                }
                onCloseAction={() => setWhatsappSocio(null)}
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() => setWhatsappSocio(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            color="success"
                            onClick={enviarWhatsapp}
                        >
                            <MessageCircle size={16} />
                            Abrir WhatsApp
                        </Button>
                    </>
                }
            >
                <div className="bp-socio-whatsapp">
                    <div className="bp-socio-whatsapp-templates">
                        {[
                            ["aviso", "Aviso"],
                            ["cobranca", "Cobrança"],
                            ["renovacao", "Renovação"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                className={
                                    whatsappTipo === value
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() =>
                                    changeWhatsAppTipo(
                                        value as WhatsAppTipo,
                                    )
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <Textarea
                        label="Mensagem"
                        value={whatsappMessage}
                        onChange={(event) =>
                            setWhatsappMessage(event.target.value)
                        }
                        rows={8}
                        helperText="A mensagem pode ser alterada antes de abrir o WhatsApp. O sistema não envia automaticamente."
                    />
                </div>
            </Modal>

            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() => setSnackbar(null)}
                />
            ) : null}
        </>
    );
}
