import { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    eyebrow?: ReactNode;
};

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
    return (
        <header
            style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 24,
                flexWrap: "wrap",
            }}
        >
            <div style={{ minWidth: 0, maxWidth: 760 }}>
                {eyebrow && <div style={{ marginBottom: 10 }}>{eyebrow}</div>}

                <h1 className="bp-page-title">{title}</h1>

                {subtitle && <p className="bp-page-subtitle">{subtitle}</p>}
            </div>

            {actions && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    {actions}
                </div>
            )}
        </header>
    );
}