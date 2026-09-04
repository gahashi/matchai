"use client";

import {
    CSSProperties,
} from "react";
import {
    useSortable,
} from "@dnd-kit/sortable";
import {
    CSS,
} from "@dnd-kit/utilities";
import {
    GripVertical,
    ImageOff,
    Pencil,
    Trash2,
} from "lucide-react";

import type {
    ManagedImage,
} from "@/components/media/media-types";

type SortableImageItemProps = {
    image: ManagedImage;
    index: number;
    disabled?: boolean;
    firstIsPrimary?: boolean;
    onEdit: (image: ManagedImage) => void;
    onRemove: (image: ManagedImage) => void;
};

export function SortableImageItem({
    image,
    index,
    disabled = false,
    firstIsPrimary = true,
    onEdit,
    onRemove,
}: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: image.key,
        disabled,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        zIndex: isDragging ? 5 : undefined,
    };

    const primary =
        firstIsPrimary && index === 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bp-media-image-item ${
                primary ? "is-primary" : ""
            }`}
        >
            <div
                style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: primary
                        ? "2px solid #9cd91a"
                        : "1px solid rgba(255,255,255,.10)",
                    background:
                        "rgba(255,255,255,.03)",
                }}
            >
                {image.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image.previewUrl}
                        alt={
                            image.originalName ??
                            `Imagem ${index + 1}`
                        }
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "grid",
                            placeItems: "center",
                            opacity: 0.55,
                        }}
                    >
                        <ImageOff size={24} />
                    </div>
                )}

                <button
                    type="button"
                    aria-label={`Arrastar imagem ${
                        index + 1
                    }`}
                    title="Arraste para alterar a ordem"
                    disabled={disabled}
                    {...attributes}
                    {...listeners}
                    style={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        border: 0,
                        borderRadius: 10,
                        cursor: disabled
                            ? "default"
                            : "grab",
                        touchAction: "none",
                        background:
                            "rgba(10,10,10,.78)",
                        color: "white",
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,.28)",
                    }}
                >
                    <GripVertical size={17} />
                </button>

                {primary && (
                    <span
                        style={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            padding: "6px 9px",
                            borderRadius: 999,
                            background: "#9cd91a",
                            color: "#0d0d0d",
                            fontSize: 11,
                            fontWeight: 800,
                        }}
                    >
                        Principal
                    </span>
                )}

                <div
                    style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        bottom: 8,
                        display: "flex",
                        justifyContent:
                            "flex-end",
                        gap: 6,
                    }}
                >
                    <button
                        type="button"
                        aria-label="Editar enquadramento"
                        title="Editar enquadramento"
                        disabled={disabled}
                        onClick={() =>
                            onEdit(image)
                        }
                        style={{
                            width: 34,
                            height: 34,
                            display: "grid",
                            placeItems: "center",
                            border: 0,
                            borderRadius: 10,
                            cursor: "pointer",
                            background:
                                "rgba(10,10,10,.78)",
                            color: "white",
                        }}
                    >
                        <Pencil size={15} />
                    </button>

                    <button
                        type="button"
                        aria-label="Remover imagem"
                        title="Remover imagem"
                        disabled={disabled}
                        onClick={() =>
                            onRemove(image)
                        }
                        style={{
                            width: 34,
                            height: 34,
                            display: "grid",
                            placeItems: "center",
                            border: 0,
                            borderRadius: 10,
                            cursor: "pointer",
                            background:
                                "rgba(127,29,29,.86)",
                            color: "white",
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    gap: 8,
                    marginTop: 8,
                    fontSize: 12,
                    opacity: 0.72,
                }}
            >
                <span>Imagem {index + 1}</span>
                <span>
                    {image.source === "existing"
                        ? "Salva"
                        : "Nova"}
                </span>
            </div>
        </div>
    );
}
