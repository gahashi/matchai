"use client";

import {
    ChangeEvent,
    DragEvent,
    useRef,
    useState,
} from "react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
    ImagePlus,
    Upload,
} from "lucide-react";

import {
    ImageCropModal,
} from "@/components/media/ImageCropModal";
import {
    SortableImageItem,
} from "@/components/media/SortableImageItem";
import type {
    ImageManagerProps,
    ManagedImage,
} from "@/components/media/media-types";

function createKey() {
    if (
        typeof crypto !== "undefined" &&
        "randomUUID" in crypto
    ) {
        return `image-${crypto.randomUUID()}`;
    }

    return `image-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function fileNameFromImage(image: ManagedImage) {
    if (image.file?.name) {
        return image.file.name;
    }

    if (image.originalName) {
        return image.originalName;
    }

    return "imagem.jpg";
}

export function ImageManager({
    images,
    onChange,
    onRemoveExisting,
    aspect = 1,
    maxImages = 10,
    maxSizeBytes = 10 * 1024 * 1024,
    accept = "image/jpeg,image/png,image/webp",
    disabled = false,
    showGrid = true,
    firstIsPrimary = true,
    label = "Imagens",
    helperText = "Arraste para ordenar. A primeira imagem será a principal.",
}: ImageManagerProps) {
    const inputRef =
        useRef<HTMLInputElement | null>(null);

    const [draggingFiles, setDraggingFiles] =
        useState(false);
    const [editingImage, setEditingImage] =
        useState<ManagedImage | null>(null);
    const [error, setError] =
        useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 6,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter:
                sortableKeyboardCoordinates,
        }),
    );

    function appendFiles(files: File[]) {
        setError(null);

        const availableSlots =
            maxImages - images.length;

        if (availableSlots <= 0) {
            setError(
                `Você pode adicionar no máximo ${maxImages} imagens.`,
            );
            return;
        }

        const valid: ManagedImage[] = [];

        for (const file of files) {
            if (valid.length >= availableSlots) {
                break;
            }

            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                ].includes(file.type)
            ) {
                setError(
                    `${file.name}: use JPG, PNG ou WebP para permitir enquadramento.`,
                );
                continue;
            }

            if (file.size > maxSizeBytes) {
                setError(
                    `${file.name}: o arquivo excede o limite permitido.`,
                );
                continue;
            }

            valid.push({
                key: createKey(),
                source: "new",
                file,
                previewUrl:
                    URL.createObjectURL(file),
                originalName: file.name,
            });
        }

        if (valid.length === 0) return;

        onChange([
            ...images,
            ...valid,
        ]);

        setEditingImage(valid[0]);
    }

    function handleInputChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        appendFiles(
            Array.from(
                event.target.files ?? [],
            ),
        );

        event.target.value = "";
    }

    function handleDrop(
        event: DragEvent<HTMLDivElement>,
    ) {
        event.preventDefault();
        setDraggingFiles(false);

        if (disabled) return;

        appendFiles(
            Array.from(
                event.dataTransfer.files ?? [],
            ),
        );
    }

    function handleDragEnd(
        event: DragEndEvent,
    ) {
        const {
            active,
            over,
        } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = images.findIndex(
            (image) => image.key === active.id,
        );
        const newIndex = images.findIndex(
            (image) => image.key === over.id,
        );

        if (
            oldIndex < 0 ||
            newIndex < 0
        ) {
            return;
        }

        onChange(
            arrayMove(
                images,
                oldIndex,
                newIndex,
            ),
        );
    }

    function removeImage(
        image: ManagedImage,
    ) {
        if (
            image.source === "new" &&
            image.previewUrl
        ) {
            URL.revokeObjectURL(
                image.previewUrl,
            );
        }

        if (
            image.source === "existing"
        ) {
            onRemoveExisting?.(image);
        }

        onChange(
            images.filter(
                (item) =>
                    item.key !== image.key,
            ),
        );
    }

    function applyCrop(file: File) {
        if (!editingImage) return;

        const previewUrl =
            URL.createObjectURL(file);

        if (
            editingImage.source === "new" &&
            editingImage.previewUrl
        ) {
            URL.revokeObjectURL(
                editingImage.previewUrl,
            );
        }

        onChange(
            images.map((image) =>
                image.key ===
                editingImage.key
                    ? {
                        ...image,
                        source: "new",
                        file,
                        previewUrl,
                        originalName:
                            file.name,
                    }
                    : image,
            ),
        );

        setEditingImage(null);
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    gap: 16,
                    alignItems: "end",
                    marginBottom: 10,
                }}
            >
                <div>
                    <strong
                        style={{
                            display: "block",
                            fontSize: 14,
                        }}
                    >
                        {label}
                    </strong>

                    <span
                        style={{
                            display: "block",
                            marginTop: 4,
                            fontSize: 12,
                            opacity: 0.65,
                        }}
                    >
                        {helperText}
                    </span>
                </div>

                <span
                    style={{
                        fontSize: 12,
                        opacity: 0.65,
                    }}
                >
                    {images.length}/{maxImages}
                </span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                hidden
                disabled={disabled}
                onChange={handleInputChange}
            />

            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                onClick={() =>
                    !disabled &&
                    inputRef.current?.click()
                }
                onKeyDown={(event) => {
                    if (
                        disabled ||
                        (event.key !== "Enter" &&
                            event.key !== " ")
                    ) {
                        return;
                    }

                    event.preventDefault();
                    inputRef.current?.click();
                }}
                onDragEnter={(event) => {
                    event.preventDefault();

                    if (!disabled) {
                        setDraggingFiles(true);
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                }}
                onDragLeave={(event) => {
                    if (
                        event.currentTarget.contains(
                            event.relatedTarget as Node,
                        )
                    ) {
                        return;
                    }

                    setDraggingFiles(false);
                }}
                onDrop={handleDrop}
                style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 112,
                    padding: 18,
                    borderRadius: 14,
                    border: draggingFiles
                        ? "1px solid #9cd91a"
                        : "1px dashed rgba(255,255,255,.18)",
                    background: draggingFiles
                        ? "rgba(156,217,26,.07)"
                        : "rgba(255,255,255,.025)",
                    cursor: disabled
                        ? "default"
                        : "pointer",
                    transition:
                        "border-color .15s ease, background .15s ease",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        justifyItems: "center",
                        gap: 8,
                        textAlign: "center",
                    }}
                >
                    {draggingFiles ? (
                        <Upload size={24} />
                    ) : (
                        <ImagePlus size={24} />
                    )}

                    <strong
                        style={{
                            fontSize: 13,
                        }}
                    >
                        {draggingFiles
                            ? "Solte as imagens aqui"
                            : "Adicionar imagens"}
                    </strong>

                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.62,
                        }}
                    >
                        Clique ou arraste JPG,
                        PNG ou WebP
                    </span>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: "#fca5a5",
                    }}
                >
                    {error}
                </div>
            )}

            {images.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={
                        closestCenter
                    }
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map(
                            (image) =>
                                image.key,
                        )}
                        strategy={
                            rectSortingStrategy
                        }
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(150px, 1fr))",
                                gap: 14,
                                marginTop: 14,
                            }}
                        >
                            {images.map(
                                (
                                    image,
                                    index,
                                ) => (
                                    <SortableImageItem
                                        key={
                                            image.key
                                        }
                                        image={
                                            image
                                        }
                                        index={
                                            index
                                        }
                                        disabled={
                                            disabled
                                        }
                                        firstIsPrimary={
                                            firstIsPrimary
                                        }
                                        onEdit={
                                            setEditingImage
                                        }
                                        onRemove={
                                            removeImage
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <ImageCropModal
                open={Boolean(editingImage)}
                imageUrl={
                    editingImage?.previewUrl ??
                    null
                }
                fileName={
                    editingImage
                        ? fileNameFromImage(
                            editingImage,
                        )
                        : undefined
                }
                sourceType={
                    editingImage?.file?.type
                }
                aspect={aspect}
                showGrid={showGrid}
                onCancel={() =>
                    setEditingImage(null)
                }
                onApply={applyCrop}
            />
        </div>
    );
}
