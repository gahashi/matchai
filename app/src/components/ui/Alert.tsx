import { ReactNode } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Info,
    TriangleAlert,
    X,
} from "lucide-react";

type AlertColor = "primary" | "secondary" | "success" | "warning" | "danger" | "info";
type AlertVariant = "soft" | "solid" | "outline";

type AlertProps = {
    color?: AlertColor;
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    icon?: ReactNode;
    action?: ReactNode;
    onClose?: () => void;
    className?: string;
};

function getDefaultIcon(color: AlertColor) {
    switch (color) {
        case "success":
            return <CheckCircle2 size={18} />;
        case "warning":
            return <TriangleAlert size={18} />;
        case "danger":
            return <AlertCircle size={18} />;
        case "info":
        case "primary":
        case "secondary":
        default:
            return <Info size={18} />;
    }
}

export function Alert({
                          color = "info",
                          variant = "soft",
                          title,
                          children,
                          icon,
                          action,
                          onClose,
                          className = "",
                      }: AlertProps) {
    return (
        <div
            className={[
                "bp-alert",
                `bp-alert-${variant}`,
                `bp-ui-${color}`,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            role={color === "danger" || color === "warning" ? "alert" : "status"}
        >
            <div className="bp-alert-icon">{icon ?? getDefaultIcon(color)}</div>

            <div className="bp-alert-content">
                {title && <strong>{title}</strong>}
                <div>{children}</div>
            </div>

            {(action || onClose) && (
                <div className="bp-alert-actions">
                    {action}

                    {onClose && (
                        <button
                            type="button"
                            className="bp-alert-close"
                            onClick={onClose}
                            aria-label="Fechar alerta"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}