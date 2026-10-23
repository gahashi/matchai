// Derivado das regras genéricas do storage do Brava Pass. SVG não é aceito por padrão.
export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 250 * 1024 * 1024;

export function validateMedia(contentType: string, length: number): void {
  const isImage = IMAGE_TYPES.has(contentType);
  const isVideo = VIDEO_TYPES.has(contentType);
  if (!isImage && !isVideo) throw new Error(`Formato não permitido: ${contentType}`);
  if (!Number.isSafeInteger(length) || length <= 0) throw new Error("Arquivo vazio/inválido");
  const limit = isImage ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  if (length > limit) throw new Error(`Arquivo excede o limite de ${limit} bytes`);
}

export function fileExtension(type: string): string {
  const ext: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "video/mp4": "mp4", "video/webm": "webm",
  };
  if (!ext[type]) throw new Error(`Tipo inválido: ${type}`);
  return ext[type];
}

export function safeFolder(input: string): string {
  const parts = input.split("/").filter(Boolean);
  if (!parts.length || parts.some((p) => !/^[a-zA-Z0-9_-]+$/.test(p))) {
    throw new Error("Pasta S3 inválida");
  }
  return parts.join("/").toLowerCase();
}
