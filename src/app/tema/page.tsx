import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { ThemePreviewCard } from "@/components/ui/ThemePreviewCard";

export default function TemaPage() {
    return (
        <AppShell>
            <PageHeader
                title="Configuração de tema"
                subtitle="Teste visual da personalização de uma organização sem afetar o tema global do Brava Pass."
                actions={<Button>Salvar tema</Button>}
            />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "0.9fr 1.1fr",
                    gap: 20,
                }}
            >
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Cores da organização</h2>
                        <p className="bp-section-subtitle">
                            Essas cores serão usadas apenas nas áreas da atlética/parceiro.
                        </p>

                        <div style={{ display: "grid", gap: 16, marginTop: 22 }}>
                            <Input label="Cor primária" defaultValue="#39FF14" />
                            <Input label="Cor secundária" defaultValue="#131313" />
                            <Input label="Cor de fundo" defaultValue="#07130E" />
                            <Input label="Cor de texto" defaultValue="#F4FFF8" />
                            <Input label="Logo" placeholder="Upload futuro" disabled />
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                            <Button>Salvar</Button>
                            <Button variant="secondary">Restaurar padrão</Button>
                        </div>
                    </CardBody>
                </Card>

                <ThemePreviewCard
                    title="Computaria"
                    description="Prévia de tema da atlética usando tokens próprios, sem alterar o tema global do Brava Pass."
                    primaryColor="#39FF14"
                    secondaryColor="#183527"
                    backgroundColor="#07130E"
                    textColor="#F4FFF8"
                />
            </div>
        </AppShell>
    );
}