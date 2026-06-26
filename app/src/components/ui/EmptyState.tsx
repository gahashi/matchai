import { ReactNode } from "react";
import { Card, CardBody } from "./Card";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
    return (
        <Card>
            <CardBody>
                <div className="bp-empty">
                    {icon && (
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 18,
                                background: "var(--color-primary-soft)",
                                color: "var(--color-primary)",
                                border: "1px solid var(--color-border)",
                                display: "grid",
                                placeItems: "center",
                                margin: "0 auto 14px",
                            }}
                        >
                            {icon}
                        </div>
                    )}

                    <h3
                        style={{
                            color: "var(--color-text)",
                            margin: 0,
                            fontSize: 18,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {title}
                    </h3>

                    {description && (
                        <p
                            style={{
                                maxWidth: 420,
                                margin: "8px auto 0",
                                color: "var(--color-text-muted)",
                                lineHeight: 1.6,
                            }}
                        >
                            {description}
                        </p>
                    )}

                    {action && <div style={{ marginTop: 18 }}>{action}</div>}
                </div>
            </CardBody>
        </Card>
    );
}