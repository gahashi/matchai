import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "bp-badge",
                variant !== "default" && `bp-badge-${variant}`,
                className
            )}
            {...props}
        />
    );
}