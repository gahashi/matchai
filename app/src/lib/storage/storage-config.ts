import type { StorageDriver } from "./storage-types";

function requiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
    }

    return value;
}

function optionalBooleanEnv(name: string, defaultValue = false): boolean {
    const value = process.env[name];

    if (!value) {
        return defaultValue;
    }

    return value === "true";
}

export type StorageConfig = {
    driver: StorageDriver;
    s3: {
        endpoint: string;
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKey: string;
        forcePathStyle: boolean;
        publicUrl: string;
    };
};

export function getStorageConfig(): StorageConfig {
    const driver = (process.env.STORAGE_DRIVER || "s3") as StorageDriver;

    if (driver !== "s3") {
        throw new Error(`STORAGE_DRIVER inválido: ${driver}`);
    }

    return {
        driver,
        s3: {
            endpoint: requiredEnv("S3_ENDPOINT"),
            region: requiredEnv("S3_REGION"),
            bucket: requiredEnv("S3_BUCKET"),
            accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
            secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
            forcePathStyle: optionalBooleanEnv("S3_FORCE_PATH_STYLE", true),
            publicUrl: requiredEnv("S3_PUBLIC_URL").replace(/\/$/, ""),
        },
    };
}