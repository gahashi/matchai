import { ExternalLink, Mail, MapPin, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

const diretoria = [
    { nome: "Gabriel Brito", cargo: "Presidente" },
    { nome: "Diretoria Financeira", cargo: "Financeiro" },
    { nome: "Diretoria de Eventos", cargo: "Eventos" },
];

export default function AtleticaPublicaPage() {
    return (
        <main data-theme="dev-atletica" style={{ minHeight: "100vh" }}>
            <section
                style={{
                    padding: "32px 20px",
                    maxWidth: 1120,
                    margin: "0 auto",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 20,
                        alignItems: "center",
                        marginBottom: 32,
                    }}
                >
                    <div className="bp-logo">
                        <div className="bp-logo-mark">A</div>
                        <div className="bp-logo-text">
                            <strong>Computaria</strong>
                            <span>AAACCU · UNIVALI</span>
                        </div>
                    </div>

                    <Button variant="secondary">Área da diretoria</Button>
                </header>

                <Card>
                    <CardBody>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.25fr 0.75fr",
                                gap: 28,
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <Badge variant="success">Atlética oficial</Badge>

                                <h1
                                    style={{
                                        fontSize: 44,
                                        lineHeight: 1,
                                        letterSpacing: "-0.06em",
                                        margin: "18px 0 12px",
                                    }}
                                >
                                    Associação Atlética Acadêmica dos Cursos de Computação
                                </h1>

                                <p
                                    style={{
                                        color: "var(--color-text-muted)",
                                        fontSize: 17,
                                        lineHeight: 1.7,
                                        maxWidth: 680,
                                    }}
                                >
                                    A Computaria representa os cursos de computação da UNIVALI,
                                    conectando estudantes por meio de esporte, eventos, tecnologia
                                    e comunidade universitária.
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        marginTop: 24,
                                    }}
                                >
                                    <Button>
                                        <ExternalLink size={17} />
                                        Instagram
                                    </Button>
                                    <Button variant="secondary">
                                        <Mail size={17} />
                                        Contato
                                    </Button>
                                </div>
                            </div>

                            <div
                                style={{
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-primary-soft)",
                                    borderRadius: "var(--radius-xl)",
                                    padding: 24,
                                }}
                            >
                                <Shield size={42} color="var(--color-primary)" />
                                <h3>Identidade personalizada</h3>
                                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                                    Esta página usa o tema da atlética, não o tema global do Brava
                                    Pass. Esse é o comportamento correto para páginas públicas.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <section className="bp-grid bp-grid-3" style={{ marginTop: 24 }}>
                    <Card>
                        <CardBody>
                            <MapPin color="var(--color-primary)" />
                            <h3>Instituição</h3>
                            <p style={{ color: "var(--color-text-muted)" }}>
                                Universidade do Vale do Itajaí
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Users color="var(--color-primary)" />
                            <h3>Cursos</h3>
                            <p style={{ color: "var(--color-text-muted)" }}>
                                Ciência da Computação, SISNET, ADS e IA.
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Shield color="var(--color-primary)" />
                            <h3>Status</h3>
                            <p style={{ color: "var(--color-text-muted)" }}>
                                Atlética ativa no Brava Pass.
                            </p>
                        </CardBody>
                    </Card>
                </section>

                <section style={{ marginTop: 32 }}>
                    <h2 className="bp-section-title">Diretoria</h2>
                    <p className="bp-section-subtitle">
                        Pessoas responsáveis pela gestão atual da atlética.
                    </p>

                    <div className="bp-grid bp-grid-3" style={{ marginTop: 16 }}>
                        {diretoria.map((pessoa) => (
                            <Card key={pessoa.nome}>
                                <CardBody>
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 16,
                                            background: "var(--color-primary)",
                                            color: "var(--color-primary-foreground)",
                                            display: "grid",
                                            placeItems: "center",
                                            fontWeight: 900,
                                        }}
                                    >
                                        {pessoa.nome[0]}
                                    </div>
                                    <h3>{pessoa.nome}</h3>
                                    <p style={{ color: "var(--color-text-muted)" }}>
                                        {pessoa.cargo}
                                    </p>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}