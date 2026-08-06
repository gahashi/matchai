import {
    Building2,
    ChevronRight,
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

    return (
        <AppShell>
            <PageHeader
                eyebrow="Entidades"
                title={
                    entidades.length > 1
                        ? "Escolha uma entidade"
                        : "Suas entidades"
                }
                subtitle={
                    entidades.length > 1
                        ? "Selecione em qual entidade deseja operar."
                        : "Entidades às quais sua conta possui acesso."
                }
            />

            {entidades.length === 0 ? (
                <EmptyState
                    icon={
                        <Building2 size={28} />
                    }
                    title="Nenhuma entidade disponível"
                    description="Você ainda não possui vínculo ativo com uma entidade do Brava Pass."
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