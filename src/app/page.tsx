import {
    Building2,
    CalendarDays,
    CreditCard,
    LayoutDashboard,
    Package,
    Shield,
    ShieldCheck,
    Sparkles,
    Store,
    Users,
    WalletCards,
    Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";

const metricas = [
    {
        label: "Atléticas ativas",
        value: "1",
        icon: Shield,
        helper: "Plano DEV ativo",
        badge: "ATL",
        variant: "success" as const,
    },
    {
        label: "Usuários",
        value: "1",
        icon: Users,
        helper: "Admin inicial",
        badge: "SYS",
        variant: "primary" as const,
    },
    {
        label: "Parceiros",
        value: "0",
        icon: Building2,
        helper: "Fase futura",
        badge: "B2B",
        variant: "info" as const,
    },
    {
        label: "Assinaturas",
        value: "1",
        icon: CreditCard,
        helper: "Ambiente dev",
        badge: "DEV",
        variant: "warning" as const,
    },
];

const atleticas = [
    {
        nome: "Computaria",
        sigla: "AAACCU",
        instituicao: "UNIVALI",
        plano: "Dev",
        status: "Ativa",
    },
];

const modulos = [
    {
        title: "Gestão de atléticas",
        description:
            "Controle membros, cargos, diretorias, permissões, tema e regimento interno.",
        icon: ShieldCheck,
        badge: "Core",
        variant: "success" as const,
    },
    {
        title: "Parceiros e eventos",
        description:
            "Organize eventos, benefícios, parcerias universitárias e ações comerciais.",
        icon: CalendarDays,
        badge: "Futuro",
        variant: "info" as const,
    },
    {
        title: "Marketplace universitário",
        description:
            "Venda produtos de atléticas, combos, ingressos e itens personalizados.",
        icon: Store,
        badge: "Commerce",
        variant: "warning" as const,
    },
];

const checklist = [
    {
        label: "SYS criado",
        status: "Pronto",
        variant: "success" as const,
    },
    {
        label: "EDU criado",
        status: "Pronto",
        variant: "success" as const,
    },
    {
        label: "ATL criado",
        status: "Pronto",
        variant: "success" as const,
    },
    {
        label: "Better Auth instalado",
        status: "Em validação",
        variant: "warning" as const,
    },
    {
        label: "Parceiros",
        status: "Futuro",
        variant: "info" as const,
    },
];

const planos = [
    {
        name: "Base",
        badge: "MVP",
        price: "Uso inicial",
        description:
            "Plano mínimo para atléticas começarem a operar no Brava Pass.",
        items: ["Tema básico", "Membros", "Permissões", "Painel inicial"],
        variant: "soft" as const,
        badgeVariant: "primary" as const,
    },
    {
        name: "Premium",
        badge: "Destaque",
        price: "Mensal",
        description:
            "Mais recursos, menor taxa, relatórios e marketplace com destaque.",
        items: ["Marketplace", "Eventos", "Relatórios", "Destaque"],
        variant: "primary" as const,
        badgeVariant: "primary" as const,
    },
    {
        name: "Parceiro",
        badge: "B2B",
        price: "Futuro",
        description:
            "Controle de eventos, benefícios, campanhas e parcerias.",
        items: ["Eventos", "Benefícios", "Campanhas", "Relatórios"],
        variant: "elevated" as const,
        badgeVariant: "info" as const,
    },
];

export default function HomePage() {
    return (
        <AppShell>
            <PageHeader
                eyebrow={
                    <Badge variant="primary">
                        <Sparkles size={13} />
                        Brava Pass System
                    </Badge>
                }
                title="Dashboard Brava Pass"
                subtitle="Painel principal do sistema. Aqui usamos a identidade visual oficial do Brava Pass, enquanto páginas de atléticas e parceiros podem receber temas próprios."
                actions={
                    <>
                        <Button variant="secondary">Configurar sistema</Button>
                        <Button>Nova atlética</Button>
                    </>
                }
            />

            <section className="bp-hero-grid">
                <Card variant="elevated" className="bp-hero-card">
                    <div className="bp-hero-glow" />

                    <CardBody className="bp-hero-content">
                        <div className="bp-badge-row">
                            <Badge variant="success">
                                <ShieldCheck size={13} />
                                Auth real
                            </Badge>

                            <Badge variant="primary">
                                <Zap size={13} />
                                Design system
                            </Badge>

                            <Badge variant="info">
                                <LayoutDashboard size={13} />
                                SaaS modular
                            </Badge>
                        </div>

                        <div>
                            <h2 className="bp-hero-title">
                                Uma base premium para crescer com atléticas, parceiros e marketplace.
                            </h2>

                            <p className="bp-hero-text">
                                O Brava Pass separa autenticação, autorização,
                                assinatura e contexto de organização. O sistema usa o
                                tema oficial nas áreas globais e permite temas próprios
                                em páginas de atléticas e parceiros.
                            </p>
                        </div>

                        <div className="bp-hero-actions">
                            <Button>
                                <ShieldCheck size={16} />
                                Validar segurança
                            </Button>

                            <Button variant="secondary">
                                <Package size={16} />
                                Ver módulos
                            </Button>

                            <Button variant="ghost">Documentação</Button>
                        </div>
                    </CardBody>
                </Card>

                <Card variant="primary" className="bp-highlight-card">
                    <CardBody>
                        <div>
                            <Badge variant="primary">
                                <WalletCards size={13} />
                                Planos por entidade
                            </Badge>

                            <h2>Assinatura não é do usuário base.</h2>

                            <p>
                                Usuários podem existir livremente. Planos e limites
                                pertencem a atléticas e parceiros, liberando módulos,
                                destaque, taxa menor e recursos avançados.
                            </p>
                        </div>

                        <div className="bp-pill-row">
                            <span className="bp-pill">Atlética</span>
                            <span className="bp-pill">Parceiro</span>
                            <span className="bp-pill">Marketplace</span>
                        </div>
                    </CardBody>
                </Card>
            </section>

            <section className="bp-grid bp-grid-4 bp-mb-24">
                {metricas.map((metrica) => {
                    const Icon = metrica.icon;

                    return (
                        <Card key={metrica.label} className="bp-metric-card">
                            <CardBody>
                                <div>
                                    <p className="bp-metric-label">
                                        {metrica.label}
                                    </p>

                                    <strong className="bp-metric-value">
                                        {metrica.value}
                                    </strong>

                                    <span className="bp-metric-helper">
                                        {metrica.helper}
                                    </span>
                                </div>

                                <div>
                                    <div className="bp-icon-box">
                                        <Icon size={21} />
                                    </div>

                                    <div className="bp-mt-16">
                                        <Badge variant={metrica.variant}>
                                            {metrica.badge}
                                        </Badge>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </section>

            <section className="bp-section-grid">
                <Card>
                    <CardBody>
                        <div>
                            <h2 className="bp-section-title">Módulos principais</h2>
                            <p className="bp-section-subtitle">
                                Estrutura preparada para crescer sem misturar regras.
                            </p>
                        </div>

                        <div className="bp-feature-list">
                            {modulos.map((modulo) => {
                                const Icon = modulo.icon;

                                return (
                                    <div key={modulo.title} className="bp-feature-item">
                                        <div className="bp-feature-icon">
                                            <Icon size={18} />
                                        </div>

                                        <div>
                                            <div className="bp-feature-head">
                                                <strong>{modulo.title}</strong>

                                                <Badge variant={modulo.variant}>
                                                    {modulo.badge}
                                                </Badge>
                                            </div>

                                            <p>{modulo.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Próximas ações</h2>
                        <p className="bp-section-subtitle">
                            Checklist visual para validar a base inicial.
                        </p>

                        <div className="bp-check-list">
                            {checklist.map((item) => (
                                <div key={item.label} className="bp-check-item">
                                    <span>{item.label}</span>
                                    <Badge variant={item.variant}>{item.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </section>

            <section className="bp-plan-grid">
                {planos.map((plano) => (
                    <Card
                        key={plano.name}
                        variant={plano.variant}
                        className="bp-plan-card"
                    >
                        <CardBody>
                            <Badge variant={plano.badgeVariant}>
                                {plano.badge}
                            </Badge>

                            <h3>{plano.name}</h3>

                            <p>{plano.description}</p>

                            <strong className="bp-plan-price">
                                {plano.price}
                            </strong>

                            <div className="bp-plan-list">
                                {plano.items.map((item) => (
                                    <span key={item}>• {item}</span>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </section>

            <section className="bp-section-grid">
                <Card className="bp-span-2">
                    <CardBody>
                        <div className="bp-mb-16">
                            <h2 className="bp-section-title">Atléticas recentes</h2>
                            <p className="bp-section-subtitle">
                                Primeiras organizações cadastradas no Brava Pass.
                            </p>
                        </div>

                        <Table headers={["Atlética", "Instituição", "Plano", "Status"]}>
                            {atleticas.map((atletica) => (
                                <tr key={atletica.sigla}>
                                    <td>
                                        <div className="bp-table-title">
                                            <strong>{atletica.nome}</strong>
                                            <span>{atletica.sigla}</span>
                                        </div>
                                    </td>
                                    <td>{atletica.instituicao}</td>
                                    <td>{atletica.plano}</td>
                                    <td>
                                        <Badge variant="success">
                                            {atletica.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </CardBody>
                </Card>
            </section>
        </AppShell>
    );
}