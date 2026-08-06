import {
    Building2,
    GraduationCap,
    Settings,
    Users,
} from "lucide-react";

import {
    Badge,
} from "@/components/ui/Badge";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
import {
    PageHeader,
} from "@/components/ui/PageHeader";
import {
    requireEntidadeContexto,
} from "@/lib/ent/require-entidade-contexto";

type EntidadeContextPageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function EntidadeContextPage({
                                                      params,
                                                  }: EntidadeContextPageProps) {
    const { slug } = await params;

    const { entidade } =
        await requireEntidadeContexto({
            slug,
        });

    return (
        <>
            <PageHeader
                eyebrow="Entidade"
                title="Visão geral"
                subtitle="Informações principais e acesso aos módulos administrativos desta entidade."
                actions={
                    <Badge
                        color="secondary"
                        variant="outline"
                    >
                        /{entidade.slug}
                    </Badge>
                }
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
                            Dados institucionais
                        </h2>

                        <p className="bp-section-subtitle">
                            {entidade.nome}
                        </p>

                        {entidade.descricao ? (
                            <p className="bp-section-subtitle bp-mt-4">
                                {
                                    entidade
                                        .descricao
                                }
                            </p>
                        ) : null}
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
                            e gestão serão exibidos
                            nesta área.
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
                            As configurações serão
                            liberadas gradualmente
                            conforme permissões,
                            regras institucionais e
                            módulos disponíveis.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}