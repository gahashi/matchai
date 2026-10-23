import {
  S3Client, HeadBucketCommand, CreateBucketCommand,
  PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";
import { getStorageConfig } from "../config.js";
import { fileExtension, safeFolder, validateMedia } from "./upload-rules.js";

export class S3StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const v = getStorageConfig();
    this.bucket = v.bucket;
    this.client = new S3Client({
      endpoint: v.endpoint,
      region: v.region,
      forcePathStyle: v.forcePathStyle,
      credentials: { accessKeyId: v.accessKeyId, secretAccessKey: v.secretAccessKey },
    });
  }

  async checkBucket(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  // Somente o script de setup deve criar o bucket, não requisições de usuários.
  async ensureBucketForDevelopment(): Promise<void> {
    try {
      await this.checkBucket();
      return;
    } catch (e) {
      const error = e as { $metadata?: { httpStatusCode?: number } };
      if (error.$metadata?.httpStatusCode !== 404) throw e;
    }
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    await this.checkBucket();
  }

  // Etapa 01: somente arquivos pequenos em memória. Para vídeos, implementar
  // upload streaming/multipart na etapa da API autenticada.
  async uploadSmallImage(folder: string, contents: Buffer, contentType: string) {
    if (!contentType.startsWith("image/")) throw new Error("Esta operação aceita apenas imagens");
    validateMedia(contentType, contents.byteLength);
    const key = `${safeFolder(folder)}/${randomUUID()}.${fileExtension(contentType)}`;
    const sha256 = createHash("sha256").update(contents).digest("hex");
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: contents,
      ContentLength: contents.length, ContentType: contentType,
      Metadata: { sha256 },
    }));
    return { bucket: this.bucket, key, contentType, sizeBytes: contents.length, sha256 };
  }

  async read(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!result.Body) throw new Error("Arquivo não encontrado");
    return Buffer.from(await result.Body.transformToByteArray());
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
