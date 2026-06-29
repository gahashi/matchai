import { S3StorageProvider } from "./s3-storage-provider";
import type { UploadFileInput, UploadedFileResult } from "./storage-types";
import { DEFAULT_IMAGE_MAX_SIZE_BYTES, IMAGE_MIME_TYPES } from "./upload-rules";

class StorageService {
    private readonly provider = new S3StorageProvider();

    upload(input: UploadFileInput): Promise<UploadedFileResult> {
        return this.provider.upload(input);
    }

    uploadPublicImage(params: {
        file: File;
        folder: string;
        filenamePrefix?: string;
        maxSizeBytes?: number;
    }): Promise<UploadedFileResult> {
        return this.provider.upload({
            file: params.file,
            folder: params.folder,
            filenamePrefix: params.filenamePrefix,
            visibility: "public",
            allowedMimeTypes: IMAGE_MIME_TYPES,
            maxSizeBytes: params.maxSizeBytes ?? DEFAULT_IMAGE_MAX_SIZE_BYTES,
        });
    }

    delete(fileKey: string): Promise<void> {
        return this.provider.delete(fileKey);
    }

    getPublicUrl(fileKey: string): string {
        return this.provider.getPublicUrl(fileKey);
    }
}

export const storageService = new StorageService();