import { Building2, CreditCard, Shield, Users } from "lucide-react";
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
    },
    {
        label: "Usuários",
        value: "1",
        icon: Users,
        helper: "Admin inicial",
    },
    {
        label: "Parceiros",
        value: "0",
        icon: Building2,
        helper: "Fase futura",
    },
    {
        label: "Assinaturas",
        value: "1",
        icon: CreditCard,
        helper: "Ambiente dev",
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

export default function HomePage() {
    return (
        <AppShell>
            <PageHeader
                title="Dashboard Brava Pass"
                subtitle="Painel principal do sistema. Aqui sempre usamos a identidade visual oficial do Brava Pass."
                actions={
                    <>
                        <Button variant="secondary">Configurar sistema</Button>
                        <Button>Nova atlética</Button>
                    </>
                }
            />

            <section className="bp-grid bp-grid-4" style={{ marginBottom: 24 }}>
                {metricas.map((metrica) => {
                    const Icon = metrica.icon;

                    return (
                        <Card key={metrica.label}>
                            <CardBody>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 16,
                                    }}
                                >
                                    <div>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: "var(--color-text-muted)",
                                                fontSize: 13,
                                            }}
                                        >
                                            {metrica.label}
                                        </p>
                                        <strong
                                            style={{
                                                display: "block",
                                                marginTop: 10,
                                                fontSize: 30,
                                            }}
                                        >
                                            {metrica.value}
                                        </strong>
                                        <span
                                            style={{
                                                display: "block",
                                                marginTop: 6,
                                                color: "var(--color-text-soft)",
                                                fontSize: 13,
                                            }}
                                        >
                      {metrica.helper}
                    </span>
                                    </div>

                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 16,
                                            background: "var(--color-primary-soft)",
                                            color: "var(--color-primary)",
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <Icon size={21} />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </section>

            <section className="bp-grid bp-grid-3" style={{ marginBottom: 24 }}>
                <Card style={{ gridColumn: "span 2" }}>
                    <CardBody>
                        <div style={{ marginBottom: 18 }}>
                            <h2 className="bp-section-title">Atléticas recentes</h2>
                            <p className="bp-section-subtitle">
                                Primeiras organizações cadastradas no Brava Pass.
                            </p>
                        </div>

                        <Table
                            headers={["Atlética", "Instituição", "Plano", "Status"]}
                        >
                            {atleticas.map((atletica) => (
                                <tr key={atletica.sigla}>
                                    <td>
                                        <strong>{atletica.nome}</strong>
                                        <br />
                                        <span style={{ color: "var(--color-text-muted)" }}>
                      {atletica.sigla}
                    </span>
                                    </td>
                                    <td>{atletica.instituicao}</td>
                                    <td>{atletica.plano}</td>
                                    <td>
                                        <Badge variant="success">{atletica.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Próximas ações</h2>
                        <p className="bp-section-subtitle">
                            Checklist visual para validar a base inicial.
                        </p>

                        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                            <Badge variant="success">SYS criado</Badge>
                            <Badge variant="success">EDU criado</Badge>
                            <Badge variant="success">ATL criado</Badge>
                            <Badge variant="warning">Autenticação pendente</Badge>
                            <Badge>Parceiros futuro</Badge>
                        </div>
                    </CardBody>
                </Card>
            </section>
        </AppShell>
    );
}