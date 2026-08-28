export const IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
];

export const VIDEO_MIME_TYPES = [
    "video/mp4",
    "video/webm",
];

export const TV_MEDIA_MIME_TYPES = [
    ...IMAGE_MIME_TYPES,
    ...VIDEO_MIME_TYPES,
];

export const DEFAULT_IMAGE_MAX_SIZE_BYTES =
    10 * 1024 * 1024; // 5 MB

export const DEFAULT_VIDEO_MAX_SIZE_BYTES =
    250 * 1024 * 1024; // 250 MB

export const DEFAULT_TV_MEDIA_MAX_SIZE_BYTES =
    DEFAULT_VIDEO_MAX_SIZE_BYTES;

export function validateUploadFile(params: {
    file: File;
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
}): void {
    const { file } = params;

    const allowedMimeTypes =
        params.allowedMimeTypes ??
        IMAGE_MIME_TYPES;

    const maxSizeBytes =
        params.maxSizeBytes ??
        DEFAULT_IMAGE_MAX_SIZE_BYTES;

    if (
        !allowedMimeTypes.includes(
            file.type,
        )
    ) {
        throw new Error(
            `Tipo de arquivo não permitido: ${file.type || "desconhecido"}`,
        );
    }

    if (file.size <= 0) {
        throw new Error(
            "Arquivo vazio não é permitido.",
        );
    }

    if (
        file.size >
        maxSizeBytes
    ) {
        throw new Error(
            `Arquivo excede o tamanho máximo permitido de ${maxSizeBytes} bytes.`,
        );
    }
}

export function getExtensionFromMimeType(
    mimeType: string,
): string {
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

        case "video/mp4":
            return "mp4";

        case "video/webm":
            return "webm";

        default:
            return "bin";
    }
}