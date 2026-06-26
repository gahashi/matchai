import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardVariant =
    | "default"
    | "elevated"
    | "soft"
    | "solid"
    | "outline";

type CardProps = HTMLAttributes<HTMLDivElement> & {
    variant?: CardVariant;
};

export function Card({
                         className,
                         variant = "default",
                         ...props
                     }: CardProps) {
    return (
        <div
            className={cn(
                "bp-card",
                `bp-card-${variant}`,
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