import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <h1 className="bp-page-title">{title}</h1>
        {subtitle && <p className="bp-page-subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
    </header>
  );
}