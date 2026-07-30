import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { userHasGlobalPermission } from "@/lib/auth/permissions";
import {
    SolicitacaoForbiddenError,
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";
import { SolicitacaoDetalheClient } from "./SolicitacaoDetalheClient";
import {AppLink} from "@/components/ui/AppLink";
import {ArrowLeft} from "lucide-react";

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

type CriarAtleticaPoloDetalhe = {
    id: number;
    nome: string;
    codigo: string | null;
    cidade: string | null;
    estado: string | null;
    principal: boolean;
};

type CriarAtleticaCursoDetalhe = {
    id: number;
    nome: string;
    abreviacao: string | null;
};

export default async function SolicitacaoDetalhePage({
                                                         params,
                                                     }: SolicitacaoDetalhePageProps) {
    const { session } =
        await requireAuthPageAccess("/sys/solicitacao");

    const { id } = await params;
    const solicitacaoId = Number(id);

    if (
        !Number.isInteger(solicitacaoId) ||
        solicitacaoId <= 0
    ) {
        notFound();
    }

    let solicitacao;

    try {
        solicitacao =
            await solicitacaoService.detalhar({
                solicitacaoId,
                sysUsuarioId: session.user.id,
            });
    } catch (error) {
        if (
            error instanceof
            SolicitacaoForbiddenError
        ) {
            redirect("/sem-permissao");
        }

        throw error;
    }

    if (!solicitacao) {
        notFound();
    }

    const [
        canAnalyze,
        canApprove,
        canReject,
        canRequestAdjustment,
    ] = await Promise.all([
        userHasGlobalPermission(
            session,
            "solicitacao.analisar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.aprovar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.recusar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.solicitar_ajuste"
        ),
    ]);

    const isRequester =
        solicitacao.solicitado_por_usuario_id ===
        session.user.id;

    return (
        <AppShell>
            <div className="bp-detail-back-row">
                <AppLink
                    href="/sys/solicitacao"
                    color="secondary"
                    variant="ghost"
                    className="bp-detail-back-action"
                >
                    <ArrowLeft size={16} />
                    Voltar para solicitações
                </AppLink>
            </div>
            <PageHeader
                eyebrow="Solicitação"
                title={solicitacao.titulo}
                subtitle="Detalhes e histórico da solicitação."
                actions={
                    <div className="bp-badge-row">
                        <Badge
                            color={getBadgeColor(
                                solicitacao
                                    .sys_solicitacao_tipo
                                    .color
                            )}
                            variant="soft"
                        >
                            {
                                solicitacao
                                    .sys_solicitacao_tipo
                                    .nome
                            }
                        </Badge>

                        <Badge
                            color={getBadgeColor(
                                solicitacao
                                    .sys_solicitacao_status
                                    .color
                            )}
                            variant="soft"
                        >
                            {
                                solicitacao
                                    .sys_solicitacao_status
                                    .nome
                            }
                        </Badge>

                        <Badge
                            color="secondary"
                            variant="outline"
                        >
                            #{solicitacao.id}
                        </Badge>
                    </div>
                }
            />

            <div className="bp-grid">
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Resumo
                        </h2>

                        <p className="bp-section-subtitle">
                            {solicitacao.descricao ??
                                "Nenhuma descrição informada."}
                        </p>

                        <div className="bp-detail-info-grid bp-mt-5">
                            <div className="bp-info-row">
                                <span>Solicitante</span>
                                <strong>
                                    {
                                        solicitacao
                                            .solicitado_por_usuario
                                            .nome
                                    }
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Responsável</span>
                                <strong>
                                    {solicitacao
                                            .responsavel_usuario
                                            ?.nome ??
                                        "Ainda não definido"}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Criada em</span>
                                <strong>
                                    {formatDate(
                                        solicitacao.created_at
                                    )}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Enviada em</span>
                                <strong>
                                    {formatDate(
                                        solicitacao.enviado_at
                                    )}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Finalizada em</span>
                                <strong>
                                    {formatDate(
                                        solicitacao.finalizado_at
                                    )}
                                </strong>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {solicitacao.detalheEspecifico
                    ?.tipoCodigo ===
                "criar_atletica" ? (
                    <Card>
                        <CardBody>
                            <h2 className="bp-section-title">
                                Dados da atlética
                            </h2>

                            <div className="bp-detail-info-grid bp-mt-5">
                                <div className="bp-info-row">
                                    <span>Nome oficial</span>
                                    <strong>
                                        {
                                            solicitacao
                                                .detalheEspecifico
                                                .atletica.nome
                                        }
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Apelido</span>
                                    <strong>
                                        {
                                            solicitacao
                                                .detalheEspecifico
                                                .atletica.apelido
                                        }
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Sigla</span>
                                    <strong>
                                        {
                                            solicitacao
                                                .detalheEspecifico
                                                .atletica.sigla
                                        }
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Slug</span>
                                    <strong>
                                        /
                                        {
                                            solicitacao
                                                .detalheEspecifico
                                                .atletica.slug
                                        }
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Mascote</span>
                                    <strong>
                                        {solicitacao
                                                .detalheEspecifico
                                                .atletica.mascote ||
                                            "Não informado"}
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Instituição</span>
                                    <strong>
                                        {solicitacao
                                            .detalheEspecifico
                                            .instituicao
                                            ? solicitacao
                                                .detalheEspecifico
                                                .instituicao
                                                .abreviacao
                                                ? `${solicitacao.detalheEspecifico.instituicao.abreviacao} — ${solicitacao.detalheEspecifico.instituicao.nome}`
                                                : solicitacao
                                                    .detalheEspecifico
                                                    .instituicao
                                                    .nome
                                            : "Não encontrada"}
                                    </strong>
                                </div>
                            </div>

                            <div className="bp-mt-5">
                                <span className="bp-label">
                                    Descrição
                                </span>

                                <p className="bp-section-subtitle">
                                    {solicitacao
                                            .detalheEspecifico
                                            .atletica
                                            .descricao ??
                                        "Nenhuma descrição informada."}
                                </p>
                            </div>

                            <div className="bp-detail-columns bp-mt-5">
                                <div>
                                    <h3 className="bp-section-title">
                                        Polos
                                    </h3>

                                    <div className="bp-feature-list">
                                        {solicitacao.detalheEspecifico.polos.map(
                                            (
                                                polo: CriarAtleticaPoloDetalhe
                                            ) => (
                                                <div
                                                    key={
                                                        polo.id
                                                    }
                                                    className="bp-check-item"
                                                >
                                                    <div>
                                                        <strong>
                                                            {
                                                                polo.nome
                                                            }
                                                        </strong>
                                                        <br />
                                                        <span>
                                                            {[
                                                                    polo.cidade,
                                                                    polo.estado,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        " / "
                                                                    ) ||
                                                                "Localização não informada"}
                                                        </span>
                                                    </div>

                                                    {polo.principal ? (
                                                        <Badge
                                                            color="primary"
                                                            variant="soft"
                                                        >
                                                            Principal
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="bp-section-title">
                                        Cursos
                                    </h3>

                                    <div className="bp-feature-list">
                                        {solicitacao.detalheEspecifico.cursos.map(
                                            (
                                                curso: CriarAtleticaCursoDetalhe
                                            ) => (
                                                <div
                                                    key={
                                                        curso.id
                                                    }
                                                    className="bp-check-item"
                                                >
                                                    <strong>
                                                        {
                                                            curso.nome
                                                        }
                                                    </strong>

                                                    {curso.abreviacao ? (
                                                        <Badge
                                                            color="secondary"
                                                            variant="outline"
                                                        >
                                                            {
                                                                curso.abreviacao
                                                            }
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bp-mt-5">
                                <h3 className="bp-section-title">
                                    Gestão inicial
                                </h3>

                                <div className="bp-detail-info-grid bp-mt-4">
                                    <div className="bp-info-row">
                                        <span>Nome</span>
                                        <strong>
                                            {
                                                solicitacao
                                                    .detalheEspecifico
                                                    .gestao.nome
                                            }
                                        </strong>
                                    </div>

                                    <div className="bp-info-row">
                                        <span>
                                            Data de início
                                        </span>
                                        <strong>
                                            {formatDate(
                                                solicitacao
                                                    .detalheEspecifico
                                                    .gestao
                                                    .inicioAt
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ) : null}

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Documentos
                        </h2>

                        {solicitacao
                            .sys_solicitacao_documento
                            .length === 0 ? (
                            <p className="bp-section-subtitle">
                                Nenhum documento anexado.
                            </p>
                        ) : (
                            <div className="bp-feature-list">
                                {solicitacao.sys_solicitacao_documento.map(
                                    (
                                        documento: SolicitacaoDocumentoItem
                                    ) => (
                                        <div
                                            key={
                                                documento.id
                                            }
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
                                                        documento
                                                            .sys_arquivo
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
                        <h2 className="bp-section-title">
                            Histórico
                        </h2>

                        {solicitacao
                            .sys_solicitacao_historico
                            .length === 0 ? (
                            <p className="bp-section-subtitle">
                                Nenhuma movimentação
                                registrada.
                            </p>
                        ) : (
                            <div className="bp-feature-list">
                                {solicitacao.sys_solicitacao_historico.map(
                                    (
                                        historico: SolicitacaoHistoricoItem
                                    ) => (
                                        <div
                                            key={
                                                historico.id
                                            }
                                            className="bp-check-item"
                                        >
                                            <div>
                                                <strong>
                                                    {historico.descricao ??
                                                        historico.acao}
                                                </strong>
                                                <br />
                                                <span>
                                                    {historico
                                                            .sys_usuario
                                                            ?.nome ??
                                                        "Sistema"}{" "}
                                                    •{" "}
                                                    {formatDate(
                                                        historico.created_at
                                                    )}
                                                </span>
                                            </div>

                                            {historico.sys_solicitacao_status_novo ? (
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

                <SolicitacaoDetalheClient
                    solicitacaoId={
                        solicitacao.id
                    }
                    titulo={
                        solicitacao.titulo
                    }
                    statusCodigo={
                        solicitacao
                            .sys_solicitacao_status
                            .codigo
                    }
                    tipoCodigo={
                        solicitacao
                            .sys_solicitacao_tipo
                            .codigo
                    }
                    permissions={{
                        isRequester,
                        canAnalyze,
                        canApprove,
                        canReject,
                        canRequestAdjustment,
                    }}
                />
            </div>
        </AppShell>
    );
}
