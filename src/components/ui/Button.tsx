import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { UiColor, UiSize, UiVariant } from "@/components/ui/ui-types";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    color?: UiColor;
    variant?: UiVariant;
    size?: UiSize;
    fullWidth?: boolean;
};

export function Button({
                           className,
                           color = "primary",
                           variant = "solid",
                           size = "md",
                           fullWidth = false,
                           children,
                           type = "button",
                           ...props
                       }: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "bp-button",
                `bp-button-${variant}`,
                `bp-button-${size}`,
                `bp-ui-${color}`,
                fullWidth && "bp-button-full",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}