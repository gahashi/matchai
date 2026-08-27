"use client";

import { ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

type TooltipProps = {
    content: string;
    children: ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
};

export function Tooltip({
                            content,
                            children,
                            position = "top",
                            className,
                        }: TooltipProps) {
    const tooltipId = useId();

    return (
        <span
            className={cn("bp-tooltip", className)}
            data-position={position}
        >
            <span aria-describedby={tooltipId}>
                {children}
            </span>

            <span
                id={tooltipId}
                role="tooltip"
                className="bp-tooltip-content"
            >
                {content}
            </span>
        </span>
    );
}