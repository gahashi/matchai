import "dotenv/config";
import { z } from "zod";

const storageSchema = z.object({
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY_ID: z.string().min(3),
  S3_SECRET_ACCESS_KEY: z.string().min(8),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("true"),
});

export function getStorageConfig() {
  const values = storageSchema.parse(process.env);
  return {
    endpoint: values.S3_ENDPOINT,
    region: values.S3_REGION,
    bucket: values.S3_BUCKET,
    accessKeyId: values.S3_ACCESS_KEY_ID,
    secretAccessKey: values.S3_SECRET_ACCESS_KEY,
    forcePathStyle: values.S3_FORCE_PATH_STYLE === "true",
  };
}

const emailSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  EMAIL_FROM_NAME: z.string().min(1).default("MatchAI"),
  EMAIL_FROM_ADDRESS: z.email(),
});

export function getEmailConfig() {
  const v = emailSchema.parse(process.env);
  return {
    smtp: {
      host: v.SMTP_HOST,
      port: v.SMTP_PORT,
      secure: v.SMTP_SECURE === "true",
      auth: { user: v.SMTP_USER, pass: v.SMTP_PASSWORD },
    },
    from: { name: v.EMAIL_FROM_NAME, address: v.EMAIL_FROM_ADDRESS },
  };
}
