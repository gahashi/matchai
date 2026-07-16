"use client";

import { ReactNode, useEffect } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Info,
    TriangleAlert,
    X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { UiColor, UiVariant } from "@/components/ui/ui-types";

type SnackbarVariant = Extract<UiVariant, "solid" | "soft" | "outline">;

type SnackbarPosition =
    | "top-center"
    | "top-right"
    | "bottom-center"
    | "bottom-right";

export type SnackbarState = {
    color?: UiColor;
    variant?: SnackbarVariant;
    title?: string;
    message: string;
    autoClose?: boolean;
    duration?: number;
    position?: SnackbarPosition;
    action?: ReactNode;
};
type SnackbarProps = SnackbarState & {
    onClose: () => void;
    className?: string;
};

function getIcon(color: UiColor) {
    switch (color) {
        case "success":
            return <CheckCircle2 size={18} />;
        case "warning":
            return <TriangleAlert size={18} />;
        case "danger":
            return <AlertCircle size={18} />;
        case "info":
        case "secondary":
        case "primary":
        default:
            return <Info size={18} />;
    }
}

export function Snackbar({
                             color = "secondary",
                             variant = "soft",
                             title,
                             message,
                             autoClose = true,
                             duration = 4000,
                             position = "top-center",
                             action,
                             onClose,
                             className,
                         }: SnackbarProps) {
    useEffect(() => {
        if (!autoClose) return;

        const timeout = window.setTimeout(() => {
            onClose();
        }, duration);

        return () => window.clearTimeout(timeout);
    }, [autoClose, duration, onClose]);

    return (
        <div className={`bp-snackbar-wrap bp-snackbar-${position}`}>
            <div
                className={cn(
                    "bp-snackbar",
                    `bp-snackbar-${variant}`,
                    `bp-ui-${color}`,
                    className,
                )}
                role={color === "danger" || color === "warning" ? "alert" : "status"}
            >
                <div className="bp-snackbar-icon">{getIcon(color)}</div>

                <div className="bp-snackbar-content">
                    {title && <strong>{title}</strong>}
                    <span>{message}</span>
                </div>

                {action && <div className="bp-snackbar-action">{action}</div>}

                <button
                    type="button"
                    className="bp-snackbar-close"
                    onClick={onClose}
                    aria-label="Fechar mensagem"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}