export type StorageDriver = "s3";

export type StorageVisibility = "public" | "private";

export type UploadFileInput = {
    file: File;
    folder: string;
    filenamePrefix?: string;
    visibility?: StorageVisibility;
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
};

export type UploadedFileResult = {
    disk: StorageDriver;
    bucket: string;
    fileKey: string;
    publicUrl: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    contentHash: string;
    visibility: StorageVisibility;
};

export type StorageProvider = {
    upload(input: UploadFileInput): Promise<UploadedFileResult>;
    delete(fileKey: string): Promise<void>;
    getPublicUrl(fileKey: string): string;
};