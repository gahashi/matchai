import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "warning"
    | "danger"
    | "info";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

export function Button({
                           className,
                           variant = "primary",
                           children,
                           type = "button",
                           ...props
                       }: ButtonProps) {
    return (
        <button
            type={type}
            className={cn("bp-button", `bp-button-${variant}`, className)}
            {...props}
        >
            {children}
        </button>
    );
}