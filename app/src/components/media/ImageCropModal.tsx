"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import Cropper, {
    type Area,
} from "react-easy-crop";
import {
    Minus,
    Plus,
    RotateCcw,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
    createCroppedImage,
} from "@/components/media/crop-image";

type ImageCropModalProps = {
    open: boolean;
    imageUrl: string | null;
    fileName?: string;
    sourceType?: string;
    aspect?: number;
    showGrid?: boolean;
    onCancel: () => void;
    onApply: (file: File) => void;
};

export function ImageCropModal({
    open,
    imageUrl,
    fileName = "imagem.jpg",
    sourceType,
    aspect = 1,
    showGrid = true,
    onCancel,
    onApply,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState({
        x: 0,
        y: 0,
    });
    const [zoom, setZoom] = useState(1);
    const [cropPixels, setCropPixels] =
        useState<Area | null>(null);
    const [processing, setProcessing] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        setCrop({
            x: 0,
            y: 0,
        });
        setZoom(1);
        setCropPixels(null);
        setError(null);
        setProcessing(false);
    }, [open, imageUrl]);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.key === "Escape" && !processing) {
                onCancel();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
    }, [open, processing, onCancel]);

    const onCropComplete = useCallback(
        (_: Area, pixels: Area) => {
            setCropPixels(pixels);
        },
        [],
    );

    const zoomPercent = useMemo(
        () => Math.round(zoom * 100),
        [zoom],
    );

    if (!open || !imageUrl) {
        return null;
    }

    const currentImageUrl = imageUrl;

    async function applyCrop() {
        if (!cropPixels) return;

        try {
            setProcessing(true);
            setError(null);

            const file =
                await createCroppedImage({
                    imageUrl: currentImageUrl,
                    cropPixels,
                    fileName,
                    sourceType,
                });

            onApply(file);
        } catch (cropError) {
            setError(
                cropError instanceof Error
                    ? cropError.message
                    : "Não foi possível ajustar a imagem.",
            );
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Ajustar imagem"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "grid",
                placeItems: "center",
                padding: 16,
                background:
                    "rgba(0, 0, 0, 0.72)",
            }}
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !processing
                ) {
                    onCancel();
                }
            }}
        >
            <div
                style={{
                    width: "min(760px, 100%)",
                    maxHeight: "calc(100vh - 32px)",
                    overflow: "auto",
                    borderRadius: 18,
                    border:
                        "1px solid var(--bp-border, rgba(255,255,255,.12))",
                    background:
                        "var(--bp-surface, #171717)",
                    boxShadow:
                        "0 24px 80px rgba(0,0,0,.45)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "space-between",
                        gap: 16,
                        padding: "18px 20px",
                        borderBottom:
                            "1px solid var(--bp-border, rgba(255,255,255,.10))",
                    }}
                >
                    <div>
                        <strong
                            style={{
                                display: "block",
                                fontSize: 16,
                            }}
                        >
                            Ajustar imagem
                        </strong>
                        <span
                            style={{
                                display: "block",
                                marginTop: 4,
                                opacity: 0.68,
                                fontSize: 13,
                            }}
                        >
                            Arraste a imagem e use o
                            zoom para definir exatamente
                            o que será exibido.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={processing}
                        aria-label="Fechar editor"
                        style={{
                            width: 36,
                            height: 36,
                            display: "grid",
                            placeItems: "center",
                            border: 0,
                            borderRadius: 10,
                            cursor: "pointer",
                            background:
                                "rgba(255,255,255,.06)",
                            color: "inherit",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    style={{
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio:
                                aspect > 0
                                    ? String(aspect)
                                    : "1",
                            maxHeight: "58vh",
                            overflow: "hidden",
                            borderRadius: 14,
                            background: "#0d0d0d",
                        }}
                    >
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            showGrid={showGrid}
                            objectFit="contain"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={
                                onCropComplete
                            }
                            minZoom={1}
                            maxZoom={3}
                            zoomSpeed={0.12}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 20,
                            display: "grid",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: 13,
                                }}
                            >
                                Zoom
                            </strong>

                            <span
                                style={{
                                    fontSize: 12,
                                    opacity: 0.66,
                                }}
                            >
                                {zoomPercent}%
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "36px 1fr 36px",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Diminuir zoom"
                                onClick={() =>
                                    setZoom((value) =>
                                        Math.max(
                                            1,
                                            Number(
                                                (
                                                    value -
                                                    0.1
                                                ).toFixed(
                                                    2,
                                                ),
                                            ),
                                        ),
                                    )
                                }
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: "grid",
                                    placeItems:
                                        "center",
                                    border:
                                        "1px solid rgba(255,255,255,.10)",
                                    borderRadius: 10,
                                    background:
                                        "rgba(255,255,255,.04)",
                                    color: "inherit",
                                    cursor: "pointer",
                                }}
                            >
                                <Minus size={16} />
                            </button>

                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(event) =>
                                    setZoom(
                                        Number(
                                            event.target
                                                .value,
                                        ),
                                    )
                                }
                                aria-label="Zoom da imagem"
                            />

                            <button
                                type="button"
                                aria-label="Aumentar zoom"
                                onClick={() =>
                                    setZoom((value) =>
                                        Math.min(
                                            3,
                                            Number(
                                                (
                                                    value +
                                                    0.1
                                                ).toFixed(
                                                    2,
                                                ),
                                            ),
                                        ),
                                    )
                                }
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: "grid",
                                    placeItems:
                                        "center",
                                    border:
                                        "1px solid rgba(255,255,255,.10)",
                                    borderRadius: 10,
                                    background:
                                        "rgba(255,255,255,.04)",
                                    color: "inherit",
                                    cursor: "pointer",
                                }}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div
                            style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: 10,
                                background:
                                    "rgba(239,68,68,.10)",
                                color: "#fca5a5",
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        gap: 12,
                        padding: "0 20px 20px",
                    }}
                >
                    <Button
                        type="button"
                        color="secondary"
                        variant="outline"
                        disabled={processing}
                        onClick={() => {
                            setCrop({
                                x: 0,
                                y: 0,
                            });
                            setZoom(1);
                        }}
                    >
                        <RotateCcw size={16} />
                        Redefinir
                    </Button>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                        }}
                    >
                        <Button
                            type="button"
                            color="secondary"
                            variant="outline"
                            disabled={processing}
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                processing ||
                                !cropPixels
                            }
                            onClick={applyCrop}
                        >
                            {processing
                                ? "Aplicando..."
                                : "Aplicar"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
