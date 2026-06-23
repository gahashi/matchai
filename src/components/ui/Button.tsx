import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

export function Button({
                           className,
                           variant = "primary",
                           children,
                           ...props
                       }: ButtonProps) {
    return (
        <button
            className={cn("bp-button", `bp-button-${variant}`, className)}
            {...props}
        >
            {children}
        </button>
    );
}