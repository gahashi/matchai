import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { UiColor, UiVariant } from "@/components/ui/ui-types";

type BadgeVariant = Extract<UiVariant, "solid" | "soft" | "outline">;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    color?: UiColor;
    variant?: BadgeVariant;
};

export function Badge({
                          className,
                          color = "secondary",
                          variant = "soft",
                          ...props
                      }: BadgeProps) {
    return (
        <span
            className={cn(
                "bp-badge",
                `bp-badge-${variant}`,
                `bp-ui-${color}`,
                className
            )}
            {...props}
        />
    );
}