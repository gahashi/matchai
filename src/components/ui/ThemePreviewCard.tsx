import { Card, CardBody } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";

type ThemePreviewCardProps = {
    title: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
};

export function ThemePreviewCard({
                                     title,
                                     description,
                                     primaryColor,
                                     secondaryColor,
                                     backgroundColor,
                                     textColor,
                                 }: ThemePreviewCardProps) {
    return (
        <Card>
            <CardBody>
                <div
                    style={
                        {
                            "--color-primary": primaryColor,
                            "--color-primary-hover": primaryColor,
                            "--color-primary-soft": `${primaryColor}22`,
                            "--color-primary-foreground": backgroundColor,
                            "--color-secondary": secondaryColor,
                            "--color-secondary-foreground": textColor,
                            "--color-card": backgroundColor,
                            "--color-text": textColor,
                            "--color-text-muted": `${textColor}aa`,
                            "--color-border": `${textColor}22`,
                            background: "var(--color-card)",
                            color: "var(--color-text)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: 18,
                        } as React.CSSProperties
                    }
                >
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
                            marginBottom: 16,
                        }}
                    >
                        BP
                    </div>

                    <Badge variant="success">Tema ativo</Badge>

                    <h3 style={{ marginBottom: 6 }}>{title}</h3>
                    <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                        {description}
                    </p>

                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                        <Button>Principal</Button>
                        <Button variant="secondary">Secundário</Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}