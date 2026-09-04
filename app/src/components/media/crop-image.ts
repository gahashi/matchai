import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(
                new Error(
                    "Não foi possível carregar a imagem para edição.",
                ),
            );

        image.crossOrigin = "anonymous";
        image.src = src;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(
                        new Error(
                            "Não foi possível gerar a imagem recortada.",
                        ),
                    );
                    return;
                }

                resolve(blob);
            },
            mimeType,
            quality,
        );
    });
}

function outputMimeType(fileName: string, sourceType?: string) {
    if (sourceType === "image/png") return "image/png";
    if (sourceType === "image/webp") return "image/webp";

    const lower = fileName.toLowerCase();

    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";

    return "image/jpeg";
}

function outputExtension(mimeType: string) {
    switch (mimeType) {
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        default:
            return "jpg";
    }
}

function replaceExtension(
    fileName: string,
    extension: string,
) {
    const base = fileName.replace(/\.[^.]+$/, "");

    return `${base || "imagem"}-crop.${extension}`;
}

export async function createCroppedImage(params: {
    imageUrl: string;
    cropPixels: Area;
    fileName: string;
    sourceType?: string;
    maxOutputSize?: number;
}): Promise<File> {
    const {
        imageUrl,
        cropPixels,
        fileName,
        sourceType,
        maxOutputSize = 1800,
    } = params;

    const image = await loadImage(imageUrl);

    const sourceWidth = Math.max(
        1,
        Math.round(cropPixels.width),
    );
    const sourceHeight = Math.max(
        1,
        Math.round(cropPixels.height),
    );

    const scale = Math.min(
        1,
        maxOutputSize /
            Math.max(sourceWidth, sourceHeight),
    );

    const outputWidth = Math.max(
        1,
        Math.round(sourceWidth * scale),
    );
    const outputHeight = Math.max(
        1,
        Math.round(sourceHeight * scale),
    );

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error(
            "Seu navegador não suporta edição de imagem.",
        );
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        outputWidth,
        outputHeight,
    );

    const mimeType = outputMimeType(
        fileName,
        sourceType,
    );

    const blob = await canvasToBlob(
        canvas,
        mimeType,
        mimeType === "image/jpeg" ? 0.9 : 0.92,
    );

    const extension = outputExtension(mimeType);

    return new File(
        [
            blob,
        ],
        replaceExtension(fileName, extension),
        {
            type: mimeType,
            lastModified: Date.now(),
        },
    );
}
