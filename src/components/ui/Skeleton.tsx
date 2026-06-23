import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
    width?: number | string;
    height?: number | string;
    radius?: number | string;
};

export function Skeleton({
                             width = "100%",
                             height = 16,
                             radius,
                             className,
                             style,
                             ...props
                         }: SkeletonProps) {
    return (
        <div
            className={cn("bp-skeleton", className)}
            style={{
                width,
                height,
                borderRadius: radius,
                ...style,
            }}
            {...props}
        />
    );
}