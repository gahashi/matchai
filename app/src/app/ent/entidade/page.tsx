import {
    Building2,
    ChevronRight,
    Clock,
    FileText,
    Pencil,
    Plus,
    Shield,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    userHasGlobalPermission,
} from "@/lib/auth/permissions";
import {
    requireAuthPageAccess,
} from "@/lib/auth/require-access";
import {
    contextoEntidadeService,
} from "@/lib/ent/contexto-entidade";
import {
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";

function getBadgeColor(
    color?: string | null
) {
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

function formatDate(
    value: Date | string | null
) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    ).format(date);
}

export default async function EntidadesPage() {
    const { session } =
        await requireAuthPageAccess(
            "/ent/entidade"
        );

    const podeVisualizarTodas =
        await userHasGlobalPermission(
            session,
            "entidade.visualizar"
        );

    const entidades =
        await contextoEntidadeService
            .listarEntidadesAcessiveis({
                sysUsuarioId:
                session.user.id,
                podeVisualizarTodas,
            });

    if (entidades.length === 1) {
        redirect(
            `/ent/entidade/${entidades[0].slug}`
        );
    }

    const solicitacaoCriarAtletica =
        entidades.length === 0
            ? await solicitacaoService
                .buscarEmAndamentoPorTipo({
                    sysUsuarioId:
                    session.user.id,
                    tipoCodigo:
                        "criar_atletica",
                })
            : null;

    const podeContinuarSolicitacao =
        solicitacaoCriarAtletica &&
        [
            "rascunho",
            "ajuste_solicitado",
        ].includes(
            solicitacaoCriarAtletica
                .sys_solicitacao_status
                .codigo
        );

    return (
        <AppShell>
            <PageHeader
                eyebrow="Entidades"
                title={
                    entidades.length > 1
                        ? "Escolha uma entidade"
                        : solicitacaoCriarAtletica
                            ? "Solicitação em andamento"
                            : "Suas entidades"
                }
                subtitle={
                    entidades.length > 1
                        ? "Selecione em qual entidade deseja operar."
                        : solicitacaoCriarAtletica
                            ? "Acompanhe o processo de criação e validação da sua atlética."
                            : "Entidades às quais sua conta possui acesso."
                }
            />

            {entidades.length === 0 &&
            solicitacaoCriarAtletica ? (
                <Card variant="elevated">
                    <CardBody>
                        <div className="bp-row-between">
                            <div>
                                <div className="bp-badge-row bp-mb-4">
                                    <Badge
                                        color={getBadgeColor(
                                            solicitacaoCriarAtletica
                                                .sys_solicitacao_tipo
                                                .color
                                        )}
                                        variant="soft"
                                    >
                                        {
                                            solicitacaoCriarAtletica
                                                .sys_solicitacao_tipo
                                                .nome
                                        }
                                    </Badge>

                                    <Badge
                                        color={getBadgeColor(
                                            solicitacaoCriarAtletica
                                                .sys_solicitacao_status
                                                .color
                                        )}
                                        variant="soft"
                                    >
                                        {
                                            solicitacaoCriarAtletica
                                                .sys_solicitacao_status
                                                .nome
                                        }
                                    </Badge>
                                </div>

                                <h2 className="bp-section-title">
                                    {
                                        solicitacaoCriarAtletica
                                            .titulo
                                    }
                                </h2>

                                <p className="bp-section-subtitle">
                                    {solicitacaoCriarAtletica
                                            .descricao ??
                                        "Sua solicitação foi registrada e está seguindo o fluxo de análise do Brava Pass."}
                                </p>
                            </div>

                            <AppLink
                                href={
                                    podeContinuarSolicitacao
                                        ? `/sys/solicitacao/${solicitacaoCriarAtletica.id}/editar`
                                        : `/sys/solicitacao/${solicitacaoCriarAtletica.id}`
                                }
                                color="primary"
                                variant="solid"
                            >
                                {podeContinuarSolicitacao ? (
                                    <>
                                        <Pencil
                                            size={16}
                                        />
                                        Continuar solicitação
                                    </>
                                ) : (
                                    <>
                                        <FileText
                                            size={16}
                                        />
                                        Acompanhar solicitação
                                    </>
                                )}
                            </AppLink>
                        </div>

                        <div className="bp-action-row bp-mt-5">
                            <Badge
                                color="secondary"
                                variant="outline"
                            >
                                <FileText
                                    size={13}
                                />
                                #
                                {
                                    solicitacaoCriarAtletica
                                        .id
                                }
                            </Badge>

                            <Badge
                                color="secondary"
                                variant="outline"
                            >
                                <Clock size={13} />
                                Criada em{" "}
                                {formatDate(
                                    solicitacaoCriarAtletica
                                        .created_at
                                )}
                            </Badge>

                            {solicitacaoCriarAtletica
                                .enviado_at ? (
                                <Badge
                                    color="secondary"
                                    variant="outline"
                                >
                                    <Clock
                                        size={13}
                                    />
                                    Enviada em{" "}
                                    {formatDate(
                                        solicitacaoCriarAtletica
                                            .enviado_at
                                    )}
                                </Badge>
                            ) : null}
                        </div>
                    </CardBody>
                </Card>
            ) : entidades.length === 0 ? (
                <EmptyState
                    icon={
                        <Building2
                            size={28}
                        />
                    }
                    title="Nenhuma entidade disponível"
                    description="Você ainda não possui vínculo ativo com uma entidade nem uma solicitação de criação em andamento."
                    action={
                        <AppLink
                            href="/ent/atletica/criar"
                            color="primary"
                            variant="solid"
                        >
                            <Plus size={16} />
                            Solicitar criação de atlética
                        </AppLink>
                    }
                />
            ) : (
                <div className="bp-feature-list">
                    {entidades.map(
                        (entidade) => {
                            const nomeExibicao =
                                entidade.apelido ||
                                entidade.nome;

                            return (
                                <Card
                                    key={
                                        entidade.id
                                    }
                                >
                                    <CardBody>
                                        <div className="bp-row-between">
                                            <div>
                                                <div className="bp-badge-row bp-mb-4">
                                                    <Badge
                                                        color="primary"
                                                        variant="soft"
                                                    >
                                                        <Shield
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        {
                                                            entidade
                                                                .tipo
                                                                .nome
                                                        }
                                                    </Badge>

                                                    <Badge
                                                        color={getBadgeColor(
                                                            entidade
                                                                .status
                                                                .color
                                                        )}
                                                        variant="soft"
                                                    >
                                                        {
                                                            entidade
                                                                .status
                                                                .nome
                                                        }
                                                    </Badge>

                                                    {entidade
                                                        .vinculo
                                                        ?.tipoNome ? (
                                                        <Badge
                                                            color="secondary"
                                                            variant="outline"
                                                        >
                                                            {
                                                                entidade
                                                                    .vinculo
                                                                    .tipoNome
                                                            }
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <h2 className="bp-section-title">
                                                    {
                                                        nomeExibicao
                                                    }
                                                </h2>

                                                <p className="bp-section-subtitle">
                                                    {
                                                        entidade
                                                            .sigla
                                                    }{" "}
                                                    ·{" "}
                                                    {entidade
                                                            .instituicao
                                                            .abreviacao ||
                                                        entidade
                                                            .instituicao
                                                            .nome}
                                                </p>
                                            </div>

                                            <AppLink
                                                href={`/ent/entidade/${entidade.slug}`}
                                                color="primary"
                                                variant="soft"
                                                aria-label={`Acessar ${nomeExibicao}`}
                                            >
                                                Acessar
                                                <ChevronRight
                                                    size={
                                                        16
                                                    }
                                                />
                                            </AppLink>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        }
                    )}
                </div>
            )}
        </AppShell>
    );
}