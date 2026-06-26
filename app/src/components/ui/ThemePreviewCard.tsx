import { CSSProperties } from "react";

import { buildEntityThemeStyle } from "@/lib/theme/build-entity-theme-style";
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
    const themeStyle = buildEntityThemeStyle({
        cor_primaria: primaryColor,
        cor_secundaria: secondaryColor,
        cor_fundo: backgroundColor,
        cor_texto: textColor,
    });

    return (
        <Card>
            <CardBody>
                <div
                    className="bp-theme-preview"
                    style={themeStyle as CSSProperties}
                >
                    <div className="bp-theme-preview-logo">
                        BP
                    </div>

                    <Badge color="success">
                        Tema ativo
                    </Badge>

                    <h3>{title}</h3>

                    <p>{description}</p>

                    <div className="bp-theme-preview-actions">
                        <Button>
                            Principal
                        </Button>

                        <Button color="secondary">
                            Secundário
                        </Button>

                        <Button variant="outline">
                            Outline
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}