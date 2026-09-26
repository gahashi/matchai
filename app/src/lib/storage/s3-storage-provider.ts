import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "crypto";

import { getStorageConfig } from "./storage-config";
import type {
    StorageProvider,
    StoredFileResult,
    UploadFileInput,
    UploadedFileResult,
} from "./storage-types";
import { getExtensionFromMimeType, validateUploadFile } from "./upload-rules";

function sanitizePathPart(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-_/.]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\/+|\/+$/g, "");
}

function sanitizeMetadataValue(
    value: string,
): string {
    const sanitized = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\r\n\t]/g, " ")
        .replace(/[^\x20-\x7E]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/-+/g, "-")
        .trim();

    return sanitized.slice(0, 255);
}

function buildFileKey(input: UploadFileInput): string {
    const folder = sanitizePathPart(input.folder);
    const prefix = sanitizePathPart(input.filenamePrefix || "arquivo");
    const extension = getExtensionFromMimeType(input.file.type);
    const uniqueId = randomUUID();

    return `${folder}/${prefix}-${uniqueId}.${extension}`;
}

export class S3StorageProvider implements StorageProvider {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor() {
        const config = getStorageConfig();

        this.bucket = config.s3.bucket;
        this.publicUrl = config.s3.publicUrl;

        this.client = new S3Client({
            endpoint: config.s3.endpoint,
            region: config.s3.region,
            forcePathStyle: config.s3.forcePathStyle,
            credentials: {
                accessKeyId: config.s3.accessKeyId,
                secretAccessKey: config.s3.secretAccessKey,
            },
        });
    }

    async upload(input: UploadFileInput): Promise<UploadedFileResult> {
        const visibility = input.visibility ?? "public";

        validateUploadFile({
            file: input.file,
            allowedMimeTypes: input.allowedMimeTypes,
            maxSizeBytes: input.maxSizeBytes,
        });

        const fileKey = buildFileKey(input);
        const arrayBuffer = await input.file.arrayBuffer();
        const body = Buffer.from(arrayBuffer);
        const contentHash = createHash("sha256").update(body).digest("hex");

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
                Body: body,
                ContentType: input.file.type,
                Metadata: {
                    originalName: sanitizeMetadataValue(
                        input.file.name,
                    ),
                    visibility,
                },
            }),
        );

        return {
            disk: "s3",
            bucket: this.bucket,
            fileKey,
            publicUrl: visibility === "public" ? this.getPublicUrl(fileKey) : null,
            originalName: input.file.name,
            mimeType: input.file.type,
            sizeBytes: input.file.size,
            contentHash,
            visibility,
        };
    }

    async delete(fileKey: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
            }),
        );
    }

    async get(fileKey: string): Promise<StoredFileResult> {
        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
            }),
        );

        if (!response.Body) {
            throw new Error(
                `Arquivo sem conteúdo no storage: ${fileKey}`,
            );
        }

        return {
            body: await response.Body.transformToByteArray(),
            contentType: response.ContentType ?? null,
            contentLength: response.ContentLength ?? null,
            etag: response.ETag ?? null,
        };
    }

    getPublicUrl(fileKey: string): string {
        return encodeURI(`${this.publicUrl}/${fileKey.replace(/^\/+/, "")}`);
    }
}