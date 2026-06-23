import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "soft" | "primary";

type CardProps = HTMLAttributes<HTMLDivElement> & {
    variant?: CardVariant;
};

export function Card({ className, variant = "default", ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bp-card",
                variant !== "default" && `bp-card-${variant}`,
                className
            )}
            {...props}
        />
    );
}

export function CardBody({
                             className,
                             ...props
                         }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("bp-card-body", className)} {...props} />;
}