import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("bp-card", className)} {...props} />;
}

export function CardBody({
                             className,
                             ...props
                         }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("bp-card-body", className)} {...props} />;
}