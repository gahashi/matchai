import {
    ButtonHTMLAttributes,
    forwardRef,
} from "react";

import {
    UiColor,
    UiSize,
    UiVariant,
} from "@/components/ui/ui-types";
import { cn } from "@/lib/utils";

type ButtonProps =
    ButtonHTMLAttributes<HTMLButtonElement> & {
    color?: UiColor;
    variant?: UiVariant;
    size?: UiSize;
    fullWidth?: boolean;
};

export const Button = forwardRef<
    HTMLButtonElement,
    ButtonProps
>(function Button(
    {
        className,
        color = "primary",
        variant = "solid",
        size = "md",
        fullWidth = false,
        children,
        type = "button",
        ...props
    },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                "bp-button",
                `bp-button-${variant}`,
                `bp-button-${size}`,
                `bp-ui-${color}`,
                fullWidth &&
                "bp-button-full",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";