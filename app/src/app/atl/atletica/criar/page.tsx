import { Building2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { prisma } from "@/lib/prisma";
import { CriarAtleticaClient } from "./CriarAtleticaClient";

async function getSolicitacaoCriarAtleticaEmAndamento(sysUsuarioId: number) {
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
    const { session } = await requireAuthPageAccess("/atl/atletica/criar");

    const solicitacaoEmAndamento =
        await getSolicitacaoCriarAtleticaEmAndamento(session.user.id);

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
                                    .sys_solicitacao_status.color
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
                            A criação da atlética passa por uma solicitação.
                            Depois do envio, a equipe responsável analisa os
                            dados e aprova, solicita ajuste ou recusa.
                        </p>

                        <div className="bp-check-list">
                            <div className="bp-check-item">
                                <span>1. Você preenche os dados iniciais</span>
                            </div>

                            <div className="bp-check-item">
                                <span>2. O sistema cria uma solicitação</span>
                            </div>

                            <div className="bp-check-item">
                                <span>3. A solicitação vai para análise</span>
                            </div>

                            <div className="bp-check-item">
                                <span>
                                    4. Após aprovação, a atlética é ativada
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
                />
            </div>
        </AppShell>
    );
}