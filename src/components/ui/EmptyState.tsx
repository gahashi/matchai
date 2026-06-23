import { ReactNode } from "react";
import { Card, CardBody } from "./Card";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <Card>
            <CardBody>
                <div className="bp-empty">
                    <h3 style={{ color: "var(--color-text)", margin: 0 }}>{title}</h3>
                    {description && <p>{description}</p>}
                    {action && <div style={{ marginTop: 18 }}>{action}</div>}
                </div>
            </CardBody>
        </Card>
    );
}