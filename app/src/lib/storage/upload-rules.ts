export const IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
];

export const DEFAULT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateUploadFile(params: {
    file: File;
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
}): void {
    const { file } = params;

    const allowedMimeTypes = params.allowedMimeTypes ?? IMAGE_MIME_TYPES;
    const maxSizeBytes = params.maxSizeBytes ?? DEFAULT_IMAGE_MAX_SIZE_BYTES;

    if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido: ${file.type || "desconhecido"}`);
    }

    if (file.size <= 0) {
        throw new Error("Arquivo vazio não é permitido.");
    }

    if (file.size > maxSizeBytes) {
        throw new Error(`Arquivo excede o tamanho máximo permitido de ${maxSizeBytes} bytes.`);
    }
}

export function getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "image/gif":
            return "gif";
        case "image/svg+xml":
            return "svg";
        default:
            return "bin";
    }
}