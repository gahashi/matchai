import { Building2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { prisma } from "@/lib/prisma";
import { CriarAtleticaClient } from "./CriarAtleticaClient";

async function getSolicitacaoCriarAtleticaEmAndamento(
    sysUsuarioId: number,
) {
    return prisma.sysSolicitacao.findFirst({
        where: {
            solicitado_por_usuario_id: sysUsuarioId,
            ativo: 1,
            deleted_at: null,
            sys_solicitacao_tipo: {
                codigo: "criar_atletica",
            },
            sys_solicitacao_status: {
                codigo: {
                    in: [
                        "rascunho",
                        "enviada",
                        "em_analise",
                        "ajuste_solicitado",
                        "aprovada",
                    ],
                },
            },
        },
        select: {
            id: true,
            titulo: true,
            sys_solicitacao_status: {
                select: {
                    nome: true,
                    color: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });
}
async function getContextoEducacionalUsuario(
    sysUsuarioId: number
) {
    const vinculosPolo =
        await prisma.sysUsuarioPolo.findMany({
            where: {
                sys_usuario_id: sysUsuarioId,
                ativo: 1,
                deleted_at: null,
                edu_polo: {
                    ativo: 1,
                    deleted_at: null,
                    edu_instituicao: {
                        ativo: 1,
                        deleted_at: null,
                    },
                },
            },
            select: {
                principal: true,
                edu_polo: {
                    select: {
                        id: true,
                        nome: true,
                        cidade: true,
                        estado: true,
                        edu_instituicao: {
                            select: {
                                id: true,
                                nome: true,
                                abreviacao: true,
                                cidade: true,
                                estado: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                {
                    principal: "desc",
                },
                {
                    created_at: "asc",
                },
            ],
        });

    if (vinculosPolo.length === 0) {
        return {
            instituicaoInicial: null,
            polosIniciais: [],
            cursosIniciais: [],
        };
    }

    const vinculoPrincipal =
        vinculosPolo.find(
            (vinculo) => vinculo.principal === 1
        ) ?? vinculosPolo[0];

    const instituicao =
        vinculoPrincipal.edu_polo.edu_instituicao;

    const polosDaInstituicao = vinculosPolo
        .filter(
            (vinculo) =>
                vinculo.edu_polo.edu_instituicao.id ===
                instituicao.id
        )
        .sort((a, b) => {
            if (a.principal === b.principal) {
                return 0;
            }

            return a.principal === 1 ? -1 : 1;
        });

    return {
        instituicaoInicial: {
            id: instituicao.id,
            label: instituicao.abreviacao
                ? `${instituicao.abreviacao} — ${instituicao.nome}`
                : instituicao.nome,
            description: [
                instituicao.cidade,
                instituicao.estado,
            ]
                .filter(Boolean)
                .join(" / "),
        },

        polosIniciais: polosDaInstituicao.map(
            (vinculo) => ({
                id: vinculo.edu_polo.id,
                label: vinculo.edu_polo.nome,
                description: [
                    vinculo.edu_polo.cidade,
                    vinculo.edu_polo.estado,
                ]
                    .filter(Boolean)
                    .join(" / "),
            })
        ),

        cursosIniciais: [],
    };
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

export default async function CriarAtleticaPage() {
    const { session } = await requireAuthPageAccess(
        "/ent/atletica/criar",
    );

    const [solicitacaoEmAndamento, contextoEducacional] =
        await Promise.all([
            getSolicitacaoCriarAtleticaEmAndamento(session.user.id),
            getContextoEducacionalUsuario(session.user.id),
        ]);

    return (
        <AppShell>
            <PageHeader
                title="Criar solicitação de atlética"
                subtitle="Preencha os dados iniciais para solicitar a criação e validação da sua atlética no Brava Pass."
                actions={
                    solicitacaoEmAndamento ? (
                        <Badge
                            color={getBadgeColor(
                                solicitacaoEmAndamento
                                    .sys_solicitacao_status.color,
                            )}
                            variant="soft"
                        >
                            {
                                solicitacaoEmAndamento
                                    .sys_solicitacao_status.nome
                            }
                        </Badge>
                    ) : null
                }
            />

            <div className="bp-section-grid">
                <Card>
                    <CardBody>
                        <div className="bp-icon-box">
                            <Building2 size={21} />
                        </div>

                        <h2 className="bp-section-title bp-mt-16">
                            Como funciona
                        </h2>

                        <p className="bp-section-subtitle">
                            A criação da atlética passa por uma
                            solicitação. Depois do envio, a equipe
                            responsável analisa os dados e aprova,
                            solicita ajuste ou recusa.
                        </p>

                        <div className="bp-check-list">
                            <div className="bp-check-item">
                                <span>
                                    1. Você preenche os dados iniciais
                                </span>
                            </div>

                            <div className="bp-check-item">
                                <span>
                                    2. O sistema cria uma solicitação
                                </span>
                            </div>

                            <div className="bp-check-item">
                                <span>
                                    3. A solicitação vai para análise
                                </span>
                            </div>

                            <div className="bp-check-item">
                                <span>
                                    4. Após aprovação, a atlética é
                                    ativada
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <CriarAtleticaClient
                    solicitacaoEmAndamentoId={
                        solicitacaoEmAndamento?.id ?? null
                    }
                    solicitacaoEmAndamentoTitulo={
                        solicitacaoEmAndamento?.titulo ?? null
                    }
                    instituicaoInicial={
                        contextoEducacional.instituicaoInicial
                    }
                    polosIniciais={
                        contextoEducacional.polosIniciais
                    }
                    cursosIniciais={
                        contextoEducacional.cursosIniciais
                    }
                />
            </div>
        </AppShell>
    );
}