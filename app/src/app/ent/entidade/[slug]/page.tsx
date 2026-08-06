import {
    Building2,
    GraduationCap,
    Settings,
    Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
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

type EntidadeContextPageProps = {
    params: Promise<{
        slug: string;
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

export default async function EntidadeContextPage({
                                                      params,
                                                  }: EntidadeContextPageProps) {
    const { session } =
        await requireAuthPageAccess(
            "/ent/entidade"
        );

    const { slug } = await params;

    const podeVisualizarTodas =
        await userHasGlobalPermission(
            session,
            "entidade.visualizar"
        );

    const entidade =
        await contextoEntidadeService
            .resolverEntidadeAcessivel({
                sysUsuarioId:
                session.user.id,
                slug,
                podeVisualizarTodas,
            });

    /*
     * Não diferenciamos entidade inexistente
     * de entidade sem acesso para não expor
     * informações de entidades privadas.
     */
    if (!entidade) {
        redirect("/sem-permissao");
    }

    const nomeExibicao =
        entidade.apelido ||
        entidade.nome;

    return (
        <AppShell>
            <PageHeader
                eyebrow={
                    <div className="bp-badge-row">
                        <Badge
                            color="primary"
                            variant="soft"
                        >
                            {
                                entidade
                                    .tipo.nome
                            }
                        </Badge>

                        <Badge
                            color={getBadgeColor(
                                entidade
                                    .status.color
                            )}
                            variant="soft"
                        >
                            {
                                entidade
                                    .status.nome
                            }
                        </Badge>
                    </div>
                }
                title={nomeExibicao}
                subtitle={`${entidade.sigla} · ${
                    entidade.instituicao
                        .abreviacao ||
                    entidade.instituicao
                        .nome
                }`}
            />

            <div className="bp-grid bp-grid-3">
                <Card>
                    <CardBody>
                        <div className="bp-icon-box">
                            <Building2
                                size={20}
                            />
                        </div>

                        <h2 className="bp-section-title bp-mt-4">
                            Visão geral
                        </h2>

                        <p className="bp-section-subtitle">
                            Resumo institucional,
                            gestão atual e informações
                            principais da entidade.
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="bp-icon-box">
                            <Users size={20} />
                        </div>

                        <h2 className="bp-section-title bp-mt-4">
                            Membros e gestão
                        </h2>

                        <p className="bp-section-subtitle">
                            Membros, cargos, diretoria
                            e vínculos institucionais.
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="bp-icon-box">
                            <GraduationCap
                                size={20}
                            />
                        </div>

                        <h2 className="bp-section-title bp-mt-4">
                            Instituição
                        </h2>

                        <p className="bp-section-subtitle">
                            {
                                entidade
                                    .instituicao
                                    .nome
                            }
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="bp-icon-box">
                            <Settings
                                size={20}
                            />
                        </div>

                        <h2 className="bp-section-title bp-mt-4">
                            Configurações
                        </h2>

                        <p className="bp-section-subtitle">
                            Ações e configurações
                            serão disponibilizadas
                            conforme as permissões do
                            usuário.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </AppShell>
    );
}