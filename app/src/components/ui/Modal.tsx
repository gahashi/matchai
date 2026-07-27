"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    onCloseAction: () => void;
};

export function Modal({
                          open,
                          title,
                          description,
                          children,
                          onCloseAction,
                      }: ModalProps) {
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCloseAction();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onCloseAction]);

    if (!open) return null;

    return (
        <div className="bp-modal-backdrop" role="presentation" onMouseDown={onCloseAction}>
            <div
                className="bp-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bp-modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="bp-modal-header">
                    <div>
                        <h2 id="bp-modal-title" className="bp-section-title">
                            {title}
                        </h2>

                        {description && (
                            <p className="bp-section-subtitle">{description}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="bp-modal-close"
                        onClick={onCloseAction}
                        aria-label="Fechar modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="bp-modal-body">{children}</div>
            </div>
        </div>
    );
}