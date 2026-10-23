import { S3StorageProvider } from "../src/storage/s3-storage-provider.js";

// Imagem PNG mínima 1x1, sem conteúdo privado.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ppcAAAAASUVORK5CYII=",
  "base64",
);

const storage = new S3StorageProvider();
let key: string | undefined;
try {
  await storage.ensureBucketForDevelopment();
  console.log("[OK] Bucket criado ou encontrado");
  const file = await storage.uploadSmallImage("matchai/smoke", png, "image/png");
  key = file.key;
  const read = await storage.read(key);
  if (!read.equals(png)) throw new Error("Bytes retornados não correspondem ao upload");
  console.log("[OK] Upload e leitura conferidos via S3");
} finally {
  if (key) {
    await storage.remove(key);
    console.log("[OK] Arquivo de teste excluído");
  }
}
