"use client";

import {
    ReactNode,
    useEffect,
    useId,
    useRef,
} from "react";

import { cn } from "@/lib/utils";

type PopoverProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: (props: {
        ref: React.RefObject<HTMLButtonElement | null>;
        onClick: () => void;
        "aria-expanded": boolean;
        "aria-controls": string;
        "aria-haspopup": "dialog";
    }) => ReactNode;
    children: ReactNode;
    align?: "start" | "center" | "end";
    className?: string;
};

export function Popover({
                            open,
                            onOpenChange,
                            trigger,
                            children,
                            align = "end",
                            className,
                        }: PopoverProps) {
    const popoverId = useId();

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const triggerRef =
        useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handlePointerDown(
            event: MouseEvent
        ) {
            const target =
                event.target as Node;

            if (
                containerRef.current &&
                !containerRef.current.contains(
                    target
                )
            ) {
                onOpenChange(false);
            }
        }

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                onOpenChange(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener(
            "mousedown",
            handlePointerDown
        );

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handlePointerDown
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, onOpenChange]);

    return (
        <div
            ref={containerRef}
            className="bp-popover-root"
        >
            {trigger({
                ref: triggerRef,
                onClick: () =>
                    onOpenChange(!open),
                "aria-expanded": open,
                "aria-controls": popoverId,
                "aria-haspopup": "dialog",
            })}

            {open ? (
                <div
                    id={popoverId}
                    role="dialog"
                    aria-modal="false"
                    className={cn(
                        "bp-popover-panel",
                        `bp-popover-align-${align}`,
                        className
                    )}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}