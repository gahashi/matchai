import {
    Building2,
    ExternalLink,
    FileText,
    Plus,
    Settings,
    ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { prisma } from "@/lib/prisma";

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

async function getAtleticaDoUsuario(atlAtleticaId?: number | null) {
    if (!atlAtleticaId) {
        return null;
    }

    return prisma.atlAtletica.findFirst({
        where: {
            id: atlAtleticaId,
            ativo: 1,
            deleted_at: null,
        },
        select: {
            id: true,
            nome: true,
            apelido: true,
            sigla: true,
            slug: true,
            mascote: true,
            descricao: true,
            created_at: true,
            atl_atletica_status: {
                select: {
                    codigo: true,
                    nome: true,
                    color: true,
                    icon: true,
                },
            },
        },
    });
}

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
            descricao: true,
            created_at: true,
            enviado_at: true,
            sys_solicitacao_status: {
                select: {
                    codigo: true,
                    nome: true,
                    color: true,
                    icon: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });
}

export default async function AtleticaPage() {
    const { session } = await requireAuthPageAccess("/atl/atletica");

    const [atletica, solicitacaoCriarAtletica] = await Promise.all([
        getAtleticaDoUsuario(session.atl_atletica_id),
        getSolicitacaoCriarAtleticaEmAndamento(session.user.id),
    ]);

    if (atletica) {
        const nomeExibicao = atletica.apelido || atletica.nome;

        return (
            <AppShell>
                <PageHeader
                    title={nomeExibicao}
                    subtitle="Área administrativa da sua atlética dentro do Brava Pass."
                    actions={
                        <div className="bp-action-row">
                            <Badge
                                color={getBadgeColor(
                                    atletica.atl_atletica_status?.color
                                )}
                                variant="soft"
                            >
                                {atletica.atl_atletica_status?.nome ??
                                    "Status não informado"}
                            </Badge>

                            <AppLink
                                href="/atl/tema"
                                color="secondary"
                                variant="soft"
                            >
                                <Settings size={16} />
                                Tema
                            </AppLink>
                        </div>
                    }
                />

                <div className="bp-hero-grid">
                    <Card variant="elevated" className="bp-hero-card">
                        <div className="bp-hero-glow" />

                        <CardBody>
                            <div className="bp-hero-content">
                                <div>
                                    <div className="bp-badge-row bp-mb-16">
                                        <Badge color="primary" variant="soft">
                                            {atletica.sigla}
                                        </Badge>

                                        <Badge
                                            color="secondary"
                                            variant="outline"
                                        >
                                            /a/{atletica.slug}
                                        </Badge>
                                    </div>

                                    <h2 className="bp-hero-title">
                                        {nomeExibicao}
                                    </h2>

                                    <p className="bp-hero-text">
                                        {atletica.descricao ??
                                            "Essa é a área administrativa da atlética. Aqui ficarão membros, gestão, documentos, eventos, produtos e configurações institucionais."}
                                    </p>
                                </div>

                                <div className="bp-hero-actions">
                                    <AppLink
                                        href="/atl/tema"
                                        color="primary"
                                        variant="solid"
                                    >
                                        <Settings size={16} />
                                        Configurar identidade
                                    </AppLink>

                                    <AppLink
                                        href="/sys/solicitacao?scope=minhas&tipo=criar_atletica"
                                        color="secondary"
                                        variant="soft"
                                    >
                                        <FileText size={16} />
                                        Ver solicitações
                                    </AppLink>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bp-highlight-card">
                        <CardBody>
                            <div>
                                <div className="bp-icon-box">
                                    <ShieldCheck size={21} />
                                </div>

                                <h2>Ambiente administrativo</h2>

                                <p>
                                    Esta tela usa o tema Brava Pass para manter
                                    consistência operacional. O tema da atlética
                                    será usado nas páginas públicas e comerciais.
                                </p>
                            </div>

                            <div className="bp-info-list">
                                <div className="bp-info-row">
                                    <span>Nome oficial</span>
                                    <strong>{atletica.nome}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Apelido</span>
                                    <strong>{nomeExibicao}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Mascote</span>
                                    <strong>{atletica.mascote}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Criada em</span>
                                    <strong>
                                        {formatDate(atletica.created_at)}
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Página pública</span>
                                    <strong>/a/{atletica.slug}</strong>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="bp-grid bp-grid-3">
                    <Card>
                        <CardBody>
                            <div className="bp-icon-box">
                                <Building2 size={20} />
                            </div>

                            <h2 className="bp-section-title bp-mt-16">
                                Dados institucionais
                            </h2>

                            <p className="bp-section-subtitle">
                                Informações principais da atlética, curso,
                                instituição, gestão e documentos oficiais.
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="bp-icon-box">
                                <Settings size={20} />
                            </div>

                            <h2 className="bp-section-title bp-mt-16">
                                Configurações
                            </h2>

                            <p className="bp-section-subtitle">
                                Ajustes internos, membros, cargos, permissões e
                                preferências da atlética.
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="bp-icon-box">
                                <ExternalLink size={20} />
                            </div>

                            <h2 className="bp-section-title bp-mt-16">
                                Página pública
                            </h2>

                            <p className="bp-section-subtitle">
                                Futuramente, estudantes verão a página pública
                                com o tema visual da própria atlética.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </AppShell>
        );
    }

    if (solicitacaoCriarAtletica) {
        return (
            <AppShell>
                <PageHeader
                    title="Sua solicitação está em andamento"
                    subtitle="Acompanhe o status da criação da sua atlética pelo fluxo de solicitações do Brava Pass."
                    actions={
                        <Badge
                            color={getBadgeColor(
                                solicitacaoCriarAtletica
                                    .sys_solicitacao_status.color
                            )}
                            variant="soft"
                        >
                            {
                                solicitacaoCriarAtletica
                                    .sys_solicitacao_status.nome
                            }
                        </Badge>
                    }
                />

                <Card variant="elevated">
                    <CardBody>
                        <div className="bp-row-between">
                            <div>
                                <div className="bp-badge-row bp-mb-16">
                                    <Badge color="primary" variant="soft">
                                        Criação de atlética
                                    </Badge>

                                    <Badge
                                        color="secondary"
                                        variant="outline"
                                    >
                                        #{solicitacaoCriarAtletica.id}
                                    </Badge>
                                </div>

                                <h2 className="bp-section-title">
                                    {solicitacaoCriarAtletica.titulo}
                                </h2>

                                <p className="bp-section-subtitle">
                                    {solicitacaoCriarAtletica.descricao ??
                                        "Sua solicitação foi registrada e pode ser acompanhada pela tela de detalhes."}
                                </p>
                            </div>

                            <AppLink
                                href={`/sys/solicitacao/${solicitacaoCriarAtletica.id}`}
                                color="primary"
                                variant="solid"
                            >
                                <FileText size={16} />
                                Abrir solicitação
                            </AppLink>
                        </div>

                        <div className="bp-info-list bp-mt-24">
                            <div className="bp-info-row">
                                <span>Status</span>
                                <strong>
                                    {
                                        solicitacaoCriarAtletica
                                            .sys_solicitacao_status.nome
                                    }
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Criada em</span>
                                <strong>
                                    {formatDate(
                                        solicitacaoCriarAtletica.created_at
                                    )}
                                </strong>
                            </div>

                            <div className="bp-info-row">
                                <span>Enviada em</span>
                                <strong>
                                    {formatDate(
                                        solicitacaoCriarAtletica.enviado_at
                                    )}
                                </strong>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <PageHeader
                title="Crie ou solicite vínculo com uma atlética"
                subtitle="Para usar os recursos institucionais, primeiro é necessário criar ou validar uma atlética no Brava Pass."
            />

            <EmptyState
                icon={<Building2 size={28} />}
                title="Nenhuma atlética vinculada"
                description="Você ainda não possui uma atlética ativa nem uma solicitação de criação em andamento."
                action={
                    <AppLink
                        href="/atl/atletica/criar"
                        color="primary"
                        variant="solid"
                    >
                        <Plus size={16} />
                        Criar solicitação
                    </AppLink>
                }
            />
        </AppShell>
    );
}