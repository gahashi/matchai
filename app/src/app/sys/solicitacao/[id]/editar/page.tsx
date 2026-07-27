import {
    notFound,
    redirect,
} from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import {
    SolicitacaoTipoForm,
} from "@/components/pages/sys/solicitacao/SolicitacaoTipoForm";
import { Badge } from "@/components/ui/Badge";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
import {
    PageHeader,
} from "@/components/ui/PageHeader";
import {
    requireAuthPageAccess,
} from "@/lib/auth/require-access";
import {
    SolicitacaoForbiddenError,
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";
import type {
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

type EditarSolicitacaoPageProps = {
    params: Promise<{
        id: string;
    }>;
};

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

type SolicitacaoHistoricoItem = NonNullable<
    Awaited<
        ReturnType<
            typeof solicitacaoService.detalhar
        >
    >
>["sys_solicitacao_historico"][number];

type PoloInicialDetalhe = {
    id: number;
    nome: string;
    cidade: string | null;
    estado: string | null;
};

type CursoInicialDetalhe = {
    id: number;
    nome: string;
    abreviacao: string | null;
};

export default async function EditarSolicitacaoPage({
                                                        params,
                                                    }: EditarSolicitacaoPageProps) {
    const { session } =
        await requireAuthPageAccess(
            "/sys/solicitacao"
        );

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
                sysUsuarioId:
                session.user.id,
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

    if (
        solicitacao
            .solicitado_por_usuario_id !==
        session.user.id
    ) {
        redirect("/sem-permissao");
    }

    const statusCodigo =
        solicitacao
            .sys_solicitacao_status
            .codigo;

    if (
        statusCodigo !== "rascunho" &&
        statusCodigo !==
        "ajuste_solicitado"
    ) {
        redirect(
            `/sys/solicitacao/${solicitacao.id}`
        );
    }



    const ultimoAjuste =
        solicitacao
            .sys_solicitacao_historico
            .find(
                (
                    historico: SolicitacaoHistoricoItem
                ) =>
                    historico.acao ===
                    "ajuste_solicitado"
            );
    const tipoCodigo =
        solicitacao.sys_solicitacao_tipo
            .codigo as SolicitacaoTipoCodigo;

    const detalheCriarAtletica =
        solicitacao.detalheEspecifico
            ?.tipoCodigo === "criar_atletica"
            ? solicitacao.detalheEspecifico
            : null;

    const initialData =
        tipoCodigo === "criar_atletica" &&
        detalheCriarAtletica
            ? {
                payload: solicitacao.payload,

                instituicaoInicial:
                    detalheCriarAtletica.instituicao
                        ? {
                            id: detalheCriarAtletica
                                .instituicao.id,
                            label:
                                detalheCriarAtletica
                                    .instituicao
                                    .abreviacao
                                    ? `${detalheCriarAtletica.instituicao.abreviacao} — ${detalheCriarAtletica.instituicao.nome}`
                                    : detalheCriarAtletica
                                        .instituicao
                                        .nome,
                            description: [
                                detalheCriarAtletica
                                    .instituicao
                                    .cidade,
                                detalheCriarAtletica
                                    .instituicao
                                    .estado,
                            ]
                                .filter(Boolean)
                                .join(" / "),
                        }
                        : null,

                polosIniciais:
                    detalheCriarAtletica.polos.map(
                        (
                            polo: PoloInicialDetalhe
                        ) => ({
                            id: polo.id,
                            label: polo.nome,
                            description: [
                                polo.cidade,
                                polo.estado,
                            ]
                                .filter(Boolean)
                                .join(" / "),
                        })
                    ),

                cursosIniciais:
                    detalheCriarAtletica.cursos.map(
                        (
                            curso: CursoInicialDetalhe
                        ) => ({
                            id: curso.id,
                            label:
                                curso.abreviacao
                                    ? `${curso.abreviacao} — ${curso.nome}`
                                    : curso.nome,
                        })
                    ),
            }
            : {
                payload: solicitacao.payload,
                instituicaoInicial: null,
                polosIniciais: [],
                cursosIniciais: [],
            };

    return (
        <AppShell>
            <PageHeader
                eyebrow="Solicitação"
                title="Editar solicitação"
                subtitle="Revise os dados solicitados antes de salvar ou reenviar para análise."
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

            {statusCodigo ===
            "ajuste_solicitado" ? (
                <Card variant="elevated">
                    <CardBody>
                        <div className="bp-row-start">
                            <div className="bp-icon-box">
                                <AlertTriangle
                                    size={20}
                                />
                            </div>

                            <div>
                                <h2 className="bp-section-title">
                                    Ajustes solicitados
                                </h2>

                                <p className="bp-section-subtitle">
                                    Corrija os dados
                                    indicados e reenvie
                                    a solicitação para
                                    análise.
                                </p>

                                {ultimoAjuste
                                    ?.descricao ? (
                                    <p className="bp-section-subtitle bp-mt-16">
                                        <strong>
                                            Orientação:
                                        </strong>{" "}
                                        {
                                            ultimoAjuste.descricao
                                        }
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            ) : null}

            <div className="bp-mt-24">
                <SolicitacaoTipoForm
                    tipoCodigo={tipoCodigo}
                    mode="edit"
                    solicitacaoId={solicitacao.id}
                    initialData={initialData}
                    solicitacaoStatusCodigo={
                        statusCodigo
                    }
                />
            </div>
        </AppShell>
    );
}