import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { solicitacaoService } from "@/lib/sys/solicitacao/solicitacao-service";
import { SolicitacaoDetalheClient } from "./SolicitacaoDetalheClient";

type SolicitacaoDetalhePageProps = {
    params: Promise<{
        id: string;
    }>;
};

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

type SolicitacaoDocumentoItem = NonNullable<
    Awaited<ReturnType<typeof solicitacaoService.detalhar>>
>["sys_solicitacao_documento"][number];

type SolicitacaoHistoricoItem = NonNullable<
    Awaited<ReturnType<typeof solicitacaoService.detalhar>>
>["sys_solicitacao_historico"][number];

export default async function SolicitacaoDetalhePage({
                                                         params,
                                                     }: SolicitacaoDetalhePageProps) {
    await requireAuthPageAccess("/sys/solicitacao");

    const { id } = await params;
    const solicitacaoId = Number(id);

    if (!Number.isInteger(solicitacaoId)) {
        notFound();
    }

    const solicitacao = await solicitacaoService.detalhar(solicitacaoId);

    if (!solicitacao) {
        notFound();
    }

    return (
        <AppShell>
            <PageHeader
                eyebrow="Solicitação"
                title={solicitacao.titulo}
                subtitle="Detalhes, documentos, histórico e ações disponíveis para esta solicitação."
                actions={
                    <Badge
                        color={getBadgeColor(
                            solicitacao.sys_solicitacao_status.color
                        )}
                        variant="soft"
                    >
                        {solicitacao.sys_solicitacao_status.nome}
                    </Badge>
                }
            />

            <div className="bp-section-grid">
                <Card>
                    <CardBody>
                        <div className="bp-badge-row bp-mb-16">
                            <Badge
                                color={getBadgeColor(
                                    solicitacao.sys_solicitacao_tipo.color
                                )}
                                variant="soft"
                            >
                                {solicitacao.sys_solicitacao_tipo.nome}
                            </Badge>

                            <Badge color="secondary" variant="outline">
                                #{solicitacao.id}
                            </Badge>
                        </div>

                        <h2 className="bp-section-title">Resumo</h2>

                        {solicitacao.descricao ? (
                            <p className="bp-section-subtitle">
                                {solicitacao.descricao}
                            </p>
                        ) : (
                            <p className="bp-section-subtitle">
                                Nenhuma descrição informada.
                            </p>
                        )}

                        <div className="bp-info-list bp-mt-24">
                            <div className="bp-info-row">
                                <span>Solicitante</span>
                                <strong>
                                    {solicitacao.solicitado_por_usuario.nome}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Responsável</span>
                                <strong>
                                    {solicitacao.responsavel_usuario?.nome ??
                                        "Ainda não definido"}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Criada em</span>
                                <strong>
                                    {formatDate(solicitacao.created_at)}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Enviada em</span>
                                <strong>
                                    {formatDate(solicitacao.enviado_at)}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Finalizada em</span>
                                <strong>
                                    {formatDate(solicitacao.finalizado_at)}
                                </strong>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <SolicitacaoDetalheClient
                    solicitacaoId={solicitacao.id}
                    statusCodigo={solicitacao.sys_solicitacao_status.codigo}
                    tipoCodigo={solicitacao.sys_solicitacao_tipo.codigo}
                />
            </div>

            <div className="bp-section-grid">
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Documentos</h2>

                        {solicitacao.sys_solicitacao_documento.length === 0 ? (
                            <p className="bp-section-subtitle">
                                Nenhum documento anexado nesta solicitação.
                            </p>
                        ) : (
                            <div className="bp-feature-list">
                                {solicitacao.sys_solicitacao_documento.map(
                                    (documento: SolicitacaoDocumentoItem) => (
                                        <div
                                            key={documento.id}
                                            className="bp-check-item"
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        documento
                                                            .sys_solicitacao_documento_tipo
                                                            .nome
                                                    }
                                                </strong>
                                                <br />
                                                <span>
                                                    {documento.titulo ??
                                                        documento.sys_arquivo
                                                            ?.nome_original ??
                                                        "Documento anexado"}
                                                </span>
                                            </div>

                                            <Badge
                                                color={getBadgeColor(
                                                    documento
                                                        .sys_solicitacao_documento_status
                                                        .color
                                                )}
                                                variant="soft"
                                            >
                                                {
                                                    documento
                                                        .sys_solicitacao_documento_status
                                                        .nome
                                                }
                                            </Badge>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Histórico</h2>

                        {solicitacao.sys_solicitacao_historico.length === 0 ? (
                            <p className="bp-section-subtitle">
                                Nenhuma movimentação registrada.
                            </p>
                        ) : (
                            <div className="bp-feature-list">
                                {solicitacao.sys_solicitacao_historico.map(
                                    (historico: SolicitacaoHistoricoItem) => (
                                        <div
                                            key={historico.id}
                                            className="bp-check-item"
                                        >
                                            <div>
                                                <strong>
                                                    {historico.descricao ??
                                                        historico.acao}
                                                </strong>
                                                <br />
                                                <span>
                                                    {historico.sys_usuario
                                                        ?.nome ?? "Sistema"}{" "}
                                                    •{" "}
                                                    {formatDate(
                                                        historico.created_at
                                                    )}
                                                </span>
                                            </div>

                                            {historico
                                                .sys_solicitacao_status_novo ? (
                                                <Badge
                                                    color={getBadgeColor(
                                                        historico
                                                            .sys_solicitacao_status_novo
                                                            .color
                                                    )}
                                                    variant="soft"
                                                >
                                                    {
                                                        historico
                                                            .sys_solicitacao_status_novo
                                                            .nome
                                                    }
                                                </Badge>
                                            ) : null}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppShell>
    );
}