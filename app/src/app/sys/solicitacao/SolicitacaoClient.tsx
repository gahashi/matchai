"use client";
import {useState} from "react";
import {
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Filter,
    Inbox,
    Loader2,
    Pencil,
    RotateCcw,
    Trash2,
    XCircle,
} from "lucide-react";

import {Alert} from "@/components/ui/Alert";
import {AppLink} from "@/components/ui/AppLink";
import {Badge} from "@/components/ui/Badge";
import {Button} from "@/components/ui/Button";
import {Card, CardBody} from "@/components/ui/Card";
import {EmptyState} from "@/components/ui/EmptyState";
import {Modal} from "@/components/ui/Modal";
import {PageHeader} from "@/components/ui/PageHeader";
import {Snackbar} from "@/components/ui/Snackbar";
import {Textarea} from "@/components/ui/Textarea";
import {Tooltip} from "@/components/ui/Tooltip";
import {
    SolicitacaoListScope,
    SolicitacaoListSort,
    SolicitacaoStatusCodigo,
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

type SolicitacaoListItem = {
    id: number;
    titulo: string;
    descricao: string | null;
    entidade_tipo: string | null;
    entidade_id: number | null;
    enviado_at: Date | string | null;
    finalizado_at: Date | string | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    sys_solicitacao_tipo: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };
    sys_solicitacao_status: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };
    solicitado_por_usuario: {
        id: number;
        nome: string;
        nickname: string;
        email: string;
        avatar_url: string | null;
    };
    responsavel_usuario: {
        id: number;
        nome: string;
        nickname: string;
        email: string;
        avatar_url: string | null;
    } | null;
};

type Pagination = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

type ModalAction =
    | "aprovar"
    | "recusar"
    | "cancelar";

type ActiveModal = {
    action: ModalAction;
    item: SolicitacaoListItem;
} | null;

type SolicitacaoClientProps = {
    initialItems: SolicitacaoListItem[];
    pagination: Pagination;
    currentUserId: number;
    allowedScopes: {
        analise: boolean;
        todas: boolean;
    };
    allowedActions: {
        aprovar: boolean;
        recusar: boolean;
    };
    filters: {
        scope: SolicitacaoListScope;
        statusCodigos: SolicitacaoStatusCodigo[];
        tipoCodigo?: SolicitacaoTipoCodigo;
        sort: SolicitacaoListSort;
    };
};

const scopeOptions: {
    label: string;
    value: SolicitacaoListScope;
}[] = [
    {label: "Minhas", value: "minhas"},
    {label: "Para análise", value: "analise"},
    {label: "Todas", value: "todas"},
];

const statusOptions: {
    label: string;
    value?: SolicitacaoStatusCodigo;
}[] = [
    {label: "Todos", value: undefined},
    {label: "Rascunho", value: "rascunho"},
    {label: "Enviada", value: "enviada"},
    {label: "Em análise", value: "em_analise"},
    {label: "Ajuste solicitado", value: "ajuste_solicitado"},
    {label: "Aprovada", value: "aprovada"},
    {label: "Recusada", value: "recusada"},
    {label: "Cancelada", value: "cancelada"},
    {label: "Concluída", value: "concluida"},
];

function formatDate(value: Date | string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function buildHref(params: {
    scope?: SolicitacaoListScope;
    statusCodigos?: SolicitacaoStatusCodigo[];
    tipoCodigo?: SolicitacaoTipoCodigo;
    sort?: SolicitacaoListSort;
    page?: number;
}) {
    const searchParams = new URLSearchParams();

    if (params.scope && params.scope !== "minhas") {
        searchParams.set("scope", params.scope);
    }

    if (params.statusCodigos?.length) {
        searchParams.set(
            "status",
            params.statusCodigos.join(",")
        );
    }

    if (params.tipoCodigo) {
        searchParams.set(
            "tipo",
            params.tipoCodigo
        );
    }

    if (
        params.sort &&
        params.sort !== "recent"
    ) {
        searchParams.set("sort", params.sort);
    }

    if (params.page && params.page > 1) {
        searchParams.set(
            "page",
            String(params.page)
        );
    }

    const query = searchParams.toString();

    return query
        ? `/sys/solicitacao?${query}`
        : "/sys/solicitacao";
}

function getBadgeColor(color?: string | null) {
    if (
        color === "primary" ||
        color === "secondary" ||
        color === "success" ||
        color === "warning" ||
        color === "danger" ||
        color === "info"
    ) {
        return color;
    }

    return "secondary";
}

function getApprovalImpact(
    item: SolicitacaoListItem
) {
    if (
        item.sys_solicitacao_tipo.codigo ===
        "criar_atletica"
    ) {
        return "A aprovação criará a entidade da atlética, vinculará polos e cursos, criará a gestão inicial, cadastrará o solicitante como membro e presidente, atribuirá a role correspondente e enviará uma notificação.";
    }

    return "A aprovação confirmará esta solicitação e poderá executar as alterações previstas pelo módulo responsável.";
}

export function SolicitacaoClient({
                                      initialItems,
                                      pagination,
                                      filters,
                                      allowedScopes,
                                      allowedActions,
                                      currentUserId,
                                  }: SolicitacaoClientProps) {
    const [activeModal, setActiveModal] =
        useState<ActiveModal>(null);

    const [justificativa, setJustificativa] =
        useState("");

    const [justificativaError, setJustificativaError] =
        useState<string | null>(null);

    const [loadingActions, setLoadingActions] =
        useState<string[]>([]);

    const [feedback, setFeedback] = useState<{
        color: "success" | "danger";
        title: string;
        message: string;
    } | null>(null);

    const baseParams = {
        scope: filters.scope,
        statusCodigos: filters.statusCodigos,
        tipoCodigo: filters.tipoCodigo,
        sort: filters.sort,
    };

    function toggleStatus(
        statusCodigo?: SolicitacaoStatusCodigo
    ) {
        if (!statusCodigo) {
            return [];
        }

        if (
            filters.statusCodigos.includes(
                statusCodigo
            )
        ) {
            return filters.statusCodigos.filter(
                (codigo) =>
                    codigo !== statusCodigo
            );
        }

        return [
            ...filters.statusCodigos,
            statusCodigo,
        ];
    }

    function getLoadingKey(
        itemId: number,
        action: ModalAction
    ) {
        return `${itemId}:${action}`;
    }

    function isLoading(
        itemId: number,
        action: ModalAction
    ) {
        return loadingActions.includes(
            getLoadingKey(itemId, action)
        );
    }

    function isItemBusy(itemId: number) {
        return loadingActions.some((key) =>
            key.startsWith(`${itemId}:`)
        );
    }

    function openModal(
        item: SolicitacaoListItem,
        action: ModalAction
    ) {
        if (isItemBusy(item.id)) {
            return;
        }

        setJustificativa("");
        setJustificativaError(null);
        setActiveModal({
            item,
            action,
        });
    }

    function closeModal() {
        if (
            activeModal &&
            isItemBusy(activeModal.item.id)
        ) {
            return;
        }

        setActiveModal(null);
        setJustificativa("");
        setJustificativaError(null);
    }

    async function executeAction(
        item: SolicitacaoListItem,
        action: ModalAction,
        descricao?: string | null
    ) {
        const loadingKey =
            getLoadingKey(item.id, action);

        if (loadingActions.includes(loadingKey)) {
            return;
        }

        setLoadingActions((current) => [
            ...current,
            loadingKey,
        ]);

        setFeedback(null);

        try {
            const response = await fetch(
                `/api/sys/solicitacao/${item.id}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        descricao:
                            descricao?.trim() || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(
                    data.message ??
                    "Não foi possível executar a ação."
                );
            }

            setActiveModal(null);
            setJustificativa("");
            setJustificativaError(null);

            setFeedback({
                color: "success",
                title: "Solicitação atualizada",
                message:
                    action === "aprovar"
                        ? "Solicitação aprovada com sucesso."
                        : action === "recusar"
                            ? "Solicitação recusada com sucesso."
                            : "Solicitação cancelada com sucesso.",
            });

            window.location.reload();
        } catch (error) {
            setFeedback({
                color: "danger",
                title: "Erro ao atualizar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível executar a ação.",
            });
        } finally {
            setLoadingActions((current) =>
                current.filter(
                    (key) => key !== loadingKey
                )
            );
        }
    }

    async function confirmModalAction() {
        if (!activeModal) {
            return;
        }

        if (
            activeModal.action === "recusar" &&
            !justificativa.trim()
        ) {
            setJustificativaError(
                "Informe o motivo da recusa."
            );

            return;
        }

        await executeAction(
            activeModal.item,
            activeModal.action,
            justificativa
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Sistema"
                title="Solicitações"
                subtitle="Acompanhe solicitações, validações, documentos e processos institucionais do Brava Pass."
            />

            <Card className="bp-mb-24">
                <CardBody>
                    <div className="bp-row-between">
                        <div>
                            <p className="bp-section-subtitle">
                                <Filter size={14}/> Filtros
                            </p>

                            <h2 className="bp-section-title">
                                Visão das solicitações
                            </h2>
                        </div>

                        <div className="bp-action-row">
                            <Badge
                                color="secondary"
                                variant="soft"
                            >
                                {pagination.total} registro(s)
                            </Badge>

                            <Tooltip content="Limpar filtros">
                                <AppLink
                                    href="/sys/solicitacao"
                                    color="secondary"
                                    variant="ghost"
                                    className="bp-icon-action"
                                    aria-label="Limpar filtros"
                                >
                                    <RotateCcw size={15}/>
                                </AppLink>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="bp-inbox-filter-tabs bp-mt-16">
                        {scopeOptions
                            .filter((option) => {
                                if (
                                    option.value === "analise"
                                ) {
                                    return allowedScopes.analise;
                                }

                                if (
                                    option.value === "todas"
                                ) {
                                    return allowedScopes.todas;
                                }

                                return true;
                            })
                            .map((option) => {
                                const active =
                                    filters.scope ===
                                    option.value;

                                return (
                                    <AppLink
                                        key={option.value}
                                        href={buildHref({
                                            ...baseParams,
                                            scope: option.value,
                                            page: 1,
                                        })}
                                        color="secondary"
                                        variant="ghost"
                                        className={[
                                            "bp-inbox-filter-tab",
                                            active ? "active" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    >
                                        {option.label}
                                    </AppLink>
                                );
                            })}
                    </div>

                    <div className="bp-inbox-filter-tabs bp-mt-16">
                        {statusOptions.map((option) => {
                            const active = option.value
                                ? filters.statusCodigos.includes(
                                    option.value
                                )
                                : filters.statusCodigos.length ===
                                0;

                            const nextStatusCodigos =
                                toggleStatus(option.value);

                            return (
                                <AppLink
                                    key={
                                        option.value ?? "todos"
                                    }
                                    href={buildHref({
                                        ...baseParams,
                                        statusCodigos:
                                        nextStatusCodigos,
                                        page: 1,
                                    })}
                                    color="secondary"
                                    variant="ghost"
                                    className={[
                                        "bp-inbox-filter-tab",
                                        active ? "active" : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {option.label}
                                </AppLink>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {initialItems.length === 0 ? (
                <EmptyState
                    icon={<Inbox size={28}/>}
                    title="Nenhuma solicitação encontrada"
                    description="Quando houver solicitações, elas aparecerão aqui com status, histórico e ações disponíveis."
                />
            ) : (
                <div className="bp-feature-list">
                    {initialItems.map((item) => {
                        const isRequester =
                            item.solicitado_por_usuario.id ===
                            currentUserId;

                        const statusCodigo =
                            item.sys_solicitacao_status
                                .codigo;

                        const canCancel =
                            isRequester &&
                            [
                                "rascunho",
                                "enviada",
                                "ajuste_solicitado",
                            ].includes(statusCodigo);

                        const canEdit =
                            isRequester &&
                            (
                                statusCodigo === "rascunho" ||
                                statusCodigo ===
                                "ajuste_solicitado"
                            );

                        const canApprove =
                            allowedActions.aprovar &&
                            [
                                "enviada",
                                "em_analise",
                            ].includes(statusCodigo);

                        const canReject =
                            allowedActions.recusar &&
                            [
                                "enviada",
                                "em_analise",
                                "ajuste_solicitado",
                            ].includes(statusCodigo);

                        const itemBusy =
                            isItemBusy(item.id);

                        return (
                            <Card key={item.id}>
                                <CardBody>
                                    <div className="bp-row-between">
                                        <div>
                                            <div className="bp-badge-row bp-mb-16">
                                                <Badge
                                                    color={getBadgeColor(
                                                        item
                                                            .sys_solicitacao_tipo
                                                            .color
                                                    )}
                                                    variant="soft"
                                                >
                                                    {
                                                        item
                                                            .sys_solicitacao_tipo
                                                            .nome
                                                    }
                                                </Badge>

                                                <Badge
                                                    color={getBadgeColor(
                                                        item
                                                            .sys_solicitacao_status
                                                            .color
                                                    )}
                                                    variant="soft"
                                                >
                                                    {
                                                        item
                                                            .sys_solicitacao_status
                                                            .nome
                                                    }
                                                </Badge>
                                            </div>

                                            <h3 className="bp-section-title">
                                                {item.titulo}
                                            </h3>

                                            {item.descricao ? (
                                                <p className="bp-section-subtitle">
                                                    {
                                                        item.descricao
                                                    }
                                                </p>
                                            ) : null}
                                        </div>


                                    </div>

                                    <div className="bp-action-row bp-mt-16">
                                        <Badge
                                            color="secondary"
                                            variant="outline"
                                        >
                                            <FileText
                                                size={13}
                                            />{" "}
                                            #{item.id}
                                        </Badge>

                                        <Badge
                                            color="secondary"
                                            variant="outline"
                                        >
                                            <Clock
                                                size={13}
                                            />{" "}
                                            {formatDate(
                                                item.created_at
                                            )}
                                        </Badge>

                                        <Badge
                                            color="secondary"
                                            variant="outline"
                                        >
                                            Solicitante:{" "}
                                            {
                                                item
                                                    .solicitado_por_usuario
                                                    .nome
                                            }
                                        </Badge>

                                        {item.responsavel_usuario ? (
                                            <Badge
                                                color="secondary"
                                                variant="outline"
                                            >
                                                Responsável:{" "}
                                                {
                                                    item
                                                        .responsavel_usuario
                                                        .nome
                                                }
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="bp-solicitacao-card-footer">
                                        <div className="bp-solicitacao-card-actions">
                                            <Tooltip content="Visualizar solicitação">
                                                <AppLink
                                                    href={`/sys/solicitacao/${item.id}`}
                                                    color="secondary"
                                                    variant="soft"
                                                    aria-label={`Visualizar solicitação ${item.titulo}`}
                                                >
                                                    <Eye size={16}/>
                                                    Visualizar
                                                </AppLink>
                                            </Tooltip>

                                            {canEdit ? (
                                                <Tooltip content="Editar solicitação">
                                                    <AppLink
                                                        href={`/sys/solicitacao/${item.id}/editar`}
                                                        color="primary"
                                                        variant="soft"
                                                        aria-label={`Editar solicitação ${item.titulo}`}
                                                    >
                                                        <Pencil size={16}/>
                                                        Editar
                                                    </AppLink>
                                                </Tooltip>
                                            ) : null}

                                            {canCancel ? (
                                                <Tooltip content="Cancelar solicitação">
                                                    <Button
                                                        type="button"
                                                        color="secondary"
                                                        variant="soft"
                                                        aria-label={`Cancelar solicitação ${item.titulo}`}
                                                        disabled={itemBusy}
                                                        onClick={() =>
                                                            openModal(
                                                                item,
                                                                "cancelar"
                                                            )
                                                        }
                                                    >
                                                        {isLoading(
                                                            item.id,
                                                            "cancelar"
                                                        ) ? (
                                                            <Loader2 size={16}/>
                                                        ) : (
                                                            <Trash2 size={16}/>
                                                        )}

                                                        Cancelar
                                                    </Button>
                                                </Tooltip>
                                            ) : null}

                                            {canReject ? (
                                                <Tooltip content="Recusar solicitação">
                                                    <Button
                                                        type="button"
                                                        color="danger"
                                                        variant="soft"
                                                        aria-label={`Recusar solicitação ${item.titulo}`}
                                                        disabled={itemBusy}
                                                        onClick={() =>
                                                            openModal(
                                                                item,
                                                                "recusar"
                                                            )
                                                        }
                                                    >
                                                        {isLoading(
                                                            item.id,
                                                            "recusar"
                                                        ) ? (
                                                            <Loader2 size={16}/>
                                                        ) : (
                                                            <XCircle size={16}/>
                                                        )}

                                                        Recusar
                                                    </Button>
                                                </Tooltip>
                                            ) : null}

                                            {canApprove ? (
                                                <Tooltip content="Aprovar solicitação">
                                                    <Button
                                                        type="button"
                                                        color="success"
                                                        variant="solid"
                                                        aria-label={`Aprovar solicitação ${item.titulo}`}
                                                        disabled={itemBusy}
                                                        onClick={() =>
                                                            openModal(
                                                                item,
                                                                "aprovar"
                                                            )
                                                        }
                                                    >
                                                        {isLoading(
                                                            item.id,
                                                            "aprovar"
                                                        ) ? (
                                                            <Loader2 size={16}/>
                                                        ) : (
                                                            <CheckCircle2 size={16}/>
                                                        )}

                                                        Aprovar
                                                    </Button>
                                                </Tooltip>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}

                    <Card>
                        <CardBody>
                            <div className="bp-row-between">
                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="soft"
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                    onClick={() => {
                                        window.location.href =
                                            buildHref({
                                                ...baseParams,
                                                page:
                                                    pagination.page -
                                                    1,
                                            });
                                    }}
                                >
                                    Anterior
                                </Button>

                                <span className="bp-section-subtitle">
                                    Página {pagination.page} de{" "}
                                    {pagination.totalPages}
                                </span>

                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="soft"
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                    onClick={() => {
                                        window.location.href =
                                            buildHref({
                                                ...baseParams,
                                                page:
                                                    pagination.page +
                                                    1,
                                            });
                                    }}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            <Modal
                open={activeModal !== null}
                title={
                    activeModal?.action === "aprovar"
                        ? "Aprovar solicitação"
                        : activeModal?.action === "recusar"
                            ? "Recusar solicitação"
                            : "Cancelar solicitação"
                }
                description={
                    activeModal?.item.titulo
                }
                onCloseAction={closeModal}
            >
                {activeModal ? (
                    <div className="bp-modal-action-impact">
                        {activeModal.action ===
                        "aprovar" ? (
                            <Alert
                                color="warning"
                                variant="soft"
                                title="Confirme o impacto"
                            >
                                {getApprovalImpact(
                                    activeModal.item
                                )}
                            </Alert>
                        ) : null}

                        {activeModal.action ===
                        "recusar" ? (
                            <Textarea
                                label="Justificativa"
                                value={justificativa}
                                onChange={(event) => {
                                    setJustificativa(
                                        event.target.value
                                    );
                                    setJustificativaError(
                                        null
                                    );
                                }}
                                placeholder="Explique claramente o motivo da recusa."
                                rows={5}
                                error={
                                    justificativaError
                                }
                                required
                            />
                        ) : null}

                        {activeModal.action ===
                        "cancelar" ? (
                            <Alert
                                color="warning"
                                variant="soft"
                                title="Cancelar solicitação"
                            >
                                Esta solicitação deixará de
                                seguir para análise. Confirme
                                apenas se deseja realmente
                                cancelar.
                            </Alert>
                        ) : null}

                        <div className="bp-modal-action-footer">
                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                disabled={isItemBusy(
                                    activeModal.item.id
                                )}
                                onClick={closeModal}
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="button"
                                color={
                                    activeModal.action ===
                                    "recusar"
                                        ? "danger"
                                        : activeModal.action ===
                                        "aprovar"
                                            ? "success"
                                            : "primary"
                                }
                                variant="solid"
                                disabled={isItemBusy(
                                    activeModal.item.id
                                )}
                                onClick={
                                    confirmModalAction
                                }
                            >
                                {isLoading(
                                    activeModal.item.id,
                                    activeModal.action
                                ) ? (
                                    <Loader2 size={16}/>
                                ) : activeModal.action ===
                                "aprovar" ? (
                                    <CheckCircle2
                                        size={16}
                                    />
                                ) : activeModal.action ===
                                "recusar" ? (
                                    <XCircle size={16}/>
                                ) : (
                                    <Trash2 size={16}/>
                                )}

                                Confirmar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {feedback ? (
                <Snackbar
                    color={feedback.color}
                    title={feedback.title}
                    message={feedback.message}
                    autoClose={
                        feedback.color === "success"
                    }
                    onClose={() => setFeedback(null)}
                />
            ) : null}
        </>
    );
}