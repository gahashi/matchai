import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/storage-service";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        fileKey: string[];
    }>;
};

export async function GET(
    _request: Request,
    context: RouteContext,
) {
    const { fileKey: fileKeyParts } =
        await context.params;

    const fileKey =
        fileKeyParts
            .filter(Boolean)
            .join("/");

    if (!fileKey) {
        return new Response(
            "Arquivo não informado.",
            {
                status: 400,
            },
        );
    }

    const visibilidadePublica =
        await prisma.sysArquivoVisibilidade.findUnique({
            where: {
                codigo: "public",
            },
            select: {
                id: true,
            },
        });

    if (!visibilidadePublica) {
        return new Response(
            "Arquivo não encontrado.",
            {
                status: 404,
            },
        );
    }

    const arquivo =
        await prisma.sysArquivo.findFirst({
            where: {
                file_key: fileKey,
                sys_arquivo_visibilidade_id:
                visibilidadePublica.id,
                deleted_at: null,
                storage_deleted_at: null,
            },
            select: {
                file_key: true,
                mime_type: true,
            },
        });

    if (!arquivo) {
        return new Response(
            "Arquivo não encontrado.",
            {
                status: 404,
            },
        );
    }

    try {
        const storedFile =
            await storageService.get(
                arquivo.file_key,
            );

        return new Response(
            Buffer.from(storedFile.body),
            {
                status: 200,
                headers: {
                    "Content-Type":
                        storedFile.contentType ??
                        arquivo.mime_type ??
                        "application/octet-stream",

                    "Cache-Control":
                        "public, max-age=31536000, immutable",

                    ...(storedFile.etag
                        ? {
                            ETag:
                            storedFile.etag,
                        }
                        : {}),
                },
            },
        );
    } catch (error) {
        console.error(
            "[public.storage.get]",
            {
                fileKey,
                error,
            },
        );

        return new Response(
            "Arquivo não encontrado.",
            {
                status: 404,
            },
        );
    }
}