"use client";

import {
    Clock,
    Eye,
    FileText,
    Filter,
    Inbox,
    RotateCcw,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
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

type SolicitacaoClientProps = {
    initialItems: SolicitacaoListItem[];
    pagination: Pagination;
    allowedScopes: {
        analise: boolean;
        todas: boolean;
    };
    filters: {
        scope: SolicitacaoListScope;
        statusCodigo?: SolicitacaoStatusCodigo;
        tipoCodigo?: SolicitacaoTipoCodigo;
        sort: SolicitacaoListSort;
    };
};

const scopeOptions: {
    label: string;
    value: SolicitacaoListScope;
}[] = [
    { label: "Minhas", value: "minhas" },
    { label: "Para análise", value: "analise" },
    { label: "Todas", value: "todas" },
];

const statusOptions: {
    label: string;
    value?: SolicitacaoStatusCodigo;
}[] = [
    { label: "Todos", value: undefined },
    { label: "Rascunho", value: "rascunho" },
    { label: "Enviada", value: "enviada" },
    { label: "Em análise", value: "em_analise" },
    { label: "Ajuste solicitado", value: "ajuste_solicitado" },
    { label: "Aprovada", value: "aprovada" },
    { label: "Recusada", value: "recusada" },
    { label: "Cancelada", value: "cancelada" },
    { label: "Concluída", value: "concluida" },
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
    statusCodigo?: SolicitacaoStatusCodigo;
    tipoCodigo?: SolicitacaoTipoCodigo;
    sort?: SolicitacaoListSort;
    page?: number;
}) {
    const searchParams = new URLSearchParams();

    if (params.scope && params.scope !== "minhas") {
        searchParams.set("scope", params.scope);
    }

    if (params.statusCodigo) {
        searchParams.set("status", params.statusCodigo);
    }

    if (params.tipoCodigo) {
        searchParams.set("tipo", params.tipoCodigo);
    }

    if (params.sort && params.sort !== "recent") {
        searchParams.set("sort", params.sort);
    }

    if (params.page && params.page > 1) {
        searchParams.set("page", String(params.page));
    }

    const query = searchParams.toString();

    return query ? `/sys/solicitacao?${query}` : "/sys/solicitacao";
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

export function SolicitacaoClient({
                                      initialItems,
                                      pagination,
                                      filters,
                                      allowedScopes,
                                  }: SolicitacaoClientProps) {
    const baseParams = {
        scope: filters.scope,
        statusCodigo: filters.statusCodigo,
        tipoCodigo: filters.tipoCodigo,
        sort: filters.sort,
    };

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
                                <Filter size={14} /> Filtros
                            </p>
                            <h2 className="bp-section-title">
                                Visão das solicitações
                            </h2>
                        </div>

                        <div className="bp-action-row">
                            <Badge color="secondary" variant="soft">
                                {pagination.total} registro(s)
                            </Badge>

                            <AppLink
                                href="/sys/solicitacao"
                                color="secondary"
                                variant="ghost"
                                aria-label="Limpar filtros"
                            >
                                <RotateCcw size={15} />
                            </AppLink>
                        </div>
                    </div>

                    <div className="bp-action-row bp-mt-16">
                        {scopeOptions
                            .filter((option) => {
                                if (option.value === "analise") {
                                    return allowedScopes.analise;
                                }

                                if (option.value === "todas") {
                                    return allowedScopes.todas;
                                }

                                return true;
                            })
                            .map((option) => (
                            <AppLink
                                key={option.value}
                                href={buildHref({
                                    ...baseParams,
                                    scope: option.value,
                                    page: 1,
                                })}
                                color={
                                    filters.scope === option.value
                                        ? "primary"
                                        : "secondary"
                                }
                                variant={
                                    filters.scope === option.value
                                        ? "solid"
                                        : "soft"
                                }
                            >
                                {option.label}
                            </AppLink>
                        ))}
                    </div>

                    <div className="bp-action-row bp-mt-16">
                        {statusOptions.map((option) => {
                            const active =
                                filters.statusCodigo === option.value ||
                                (!filters.statusCodigo && !option.value);

                            return (
                                <AppLink
                                    key={option.value ?? "todos"}
                                    href={buildHref({
                                        ...baseParams,
                                        statusCodigo: option.value,
                                        page: 1,
                                    })}
                                    color={active ? "primary" : "secondary"}
                                    variant={active ? "solid" : "soft"}
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
                    icon={<Inbox size={28} />}
                    title="Nenhuma solicitação encontrada"
                    description="Quando houver solicitações, elas aparecerão aqui com status, histórico e ações disponíveis."
                />
            ) : (
                <div className="bp-feature-list">
                    {initialItems.map((item) => (
                        <Card key={item.id}>
                            <CardBody>
                                <div className="bp-row-between">
                                    <div>
                                        <div className="bp-badge-row bp-mb-16">
                                            <Badge
                                                color={getBadgeColor(
                                                    item.sys_solicitacao_tipo.color
                                                )}
                                                variant="soft"
                                            >
                                                {item.sys_solicitacao_tipo.nome}
                                            </Badge>

                                            <Badge
                                                color={getBadgeColor(
                                                    item.sys_solicitacao_status.color
                                                )}
                                                variant="soft"
                                            >
                                                {
                                                    item.sys_solicitacao_status
                                                        .nome
                                                }
                                            </Badge>
                                        </div>

                                        <h3 className="bp-section-title">
                                            {item.titulo}
                                        </h3>

                                        {item.descricao ? (
                                            <p className="bp-section-subtitle">
                                                {item.descricao}
                                            </p>
                                        ) : null}
                                    </div>

                                    <AppLink
                                        href={`/sys/solicitacao/${item.id}`}
                                        color="secondary"
                                        variant="soft"
                                    >
                                        <Eye size={15} />
                                        Ver
                                    </AppLink>
                                </div>

                                <div className="bp-action-row bp-mt-16">
                                    <Badge color="secondary" variant="outline">
                                        <FileText size={13} /> #{item.id}
                                    </Badge>

                                    <Badge color="secondary" variant="outline">
                                        <Clock size={13} />{" "}
                                        {formatDate(item.created_at)}
                                    </Badge>

                                    <Badge color="secondary" variant="outline">
                                        Solicitante:{" "}
                                        {item.solicitado_por_usuario.nome}
                                    </Badge>

                                    {item.responsavel_usuario ? (
                                        <Badge
                                            color="secondary"
                                            variant="outline"
                                        >
                                            Responsável:{" "}
                                            {item.responsavel_usuario.nome}
                                        </Badge>
                                    ) : null}
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    <Card>
                        <CardBody>
                            <div className="bp-row-between">
                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="soft"
                                    disabled={!pagination.hasPreviousPage}
                                    onClick={() => {
                                        window.location.href = buildHref({
                                            ...baseParams,
                                            page: pagination.page - 1,
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
                                    disabled={!pagination.hasNextPage}
                                    onClick={() => {
                                        window.location.href = buildHref({
                                            ...baseParams,
                                            page: pagination.page + 1,
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
        </>
    );
}