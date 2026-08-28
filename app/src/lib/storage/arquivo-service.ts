import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/storage-service";
import type {
    UploadedFileResult,
} from "@/lib/storage/storage-types";


type UploadArquivoPublicoInput = {
    file: File;
    folder: string;
    filenamePrefix?: string;
    tipoCodigo?: string;
    createdBySysUsuarioId?: number;
};


type MarcarComoRemovidoInput = {
    arquivoId: number;
};


type LimparArquivosRemovidosInput = {
    diasRetencao?: number;
    limit?: number;
    dryRun?: boolean;
};


type LimpezaArquivoResultado = {
    encontrados: number;
    apagados: number;
    falhas: number;
    dryRun: boolean;
};


async function findRequiredArquivoDiscoId(
    codigo: string,
): Promise<number> {
    const disco =
        await prisma.sysArquivoDisco.findUnique({
            where: {
                codigo,
            },
            select: {
                id: true,
            },
        });

    if (!disco) {
        throw new Error(
            `Disco de arquivo não encontrado: ${codigo}`,
        );
    }

    return disco.id;
}


async function findRequiredArquivoVisibilidadeId(
    codigo: string,
): Promise<number> {
    const visibilidade =
        await prisma.sysArquivoVisibilidade.findUnique({
            where: {
                codigo,
            },
            select: {
                id: true,
            },
        });

    if (!visibilidade) {
        throw new Error(
            `Visibilidade de arquivo não encontrada: ${codigo}`,
        );
    }

    return visibilidade.id;
}


async function findArquivoTipoId(
    codigo?: string,
): Promise<number | null> {
    if (!codigo) {
        return null;
    }

    const sysArquivoTipo =
        await prisma.sysArquivoTipo.findUnique({
            where: {
                codigo,
            },
            select: {
                id: true,
            },
        });

    if (!sysArquivoTipo) {
        throw new Error(
            `Tipo de arquivo não encontrado: ${codigo}`,
        );
    }

    return sysArquivoTipo.id;
}


function calcularDataLimiteRemocao(
    diasRetencao: number,
): Date {
    const data = new Date();

    data.setDate(
        data.getDate() - diasRetencao,
    );

    return data;
}


class ArquivoService {
    async uploadPublicImage(
        input: UploadArquivoPublicoInput,
    ) {
        const uploadedFile =
            await storageService.uploadPublicImage({
                file: input.file,
                folder: input.folder,
                filenamePrefix:
                input.filenamePrefix,
            });

        try {
            const arquivo =
                await this.registrarArquivo({
                    uploadedFile,
                    tipoCodigo:
                    input.tipoCodigo,
                    createdBySysUsuarioId:
                    input.createdBySysUsuarioId,
                });

            return {
                uploadedFile,
                arquivo,
            };
        } catch (error) {
            /**
             * O upload no storage aconteceu,
             * mas não conseguimos registrar
             * o arquivo no banco.
             *
             * Remove o objeto para evitar
             * arquivo órfão no MinIO.
             */
            try {
                await storageService.delete(
                    uploadedFile.fileKey,
                );
            } catch (rollbackError) {
                console.error(
                    "[arquivo.upload.rollback]",
                    {
                        fileKey:
                        uploadedFile.fileKey,
                        rollbackError,
                    },
                );
            }

            throw error;
        }
    }

    async uploadPublicTvMedia(
        input: UploadArquivoPublicoInput,
    ) {
        const uploadedFile =
            await storageService
                .uploadPublicTvMedia({
                    file:
                    input.file,

                    folder:
                    input.folder,

                    filenamePrefix:
                    input.filenamePrefix,
                });

        try {
            const arquivo =
                await this.registrarArquivo({
                    uploadedFile,

                    tipoCodigo:
                    input.tipoCodigo,

                    createdBySysUsuarioId:
                    input
                        .createdBySysUsuarioId,
                });

            return {
                uploadedFile,
                arquivo,
            };
        } catch (
            error
            ) {
            try {
                await storageService
                    .delete(
                        uploadedFile.fileKey,
                    );
            } catch (
                rollbackError
                ) {
                console.error(
                    "[arquivo.tv-media.upload.rollback]",
                    {
                        fileKey:
                        uploadedFile
                            .fileKey,

                        rollbackError,
                    },
                );
            }

            throw error;
        }
    }
    async marcarComoRemovido(
        input: MarcarComoRemovidoInput,
    ) {
        const arquivo =
            await prisma.sysArquivo.findUnique({
                where: {
                    id: input.arquivoId,
                },
                select: {
                    id: true,
                    deleted_at: true,
                },
            });

        if (!arquivo) {
            return null;
        }

        if (arquivo.deleted_at) {
            return arquivo;
        }

        return prisma.sysArquivo.update({
            where: {
                id: arquivo.id,
            },
            data: {
                deleted_at:
                    new Date(),
                updated_at:
                    new Date(),
            },
        });
    }


    async limparArquivosRemovidos(
        input: LimparArquivosRemovidosInput = {},
    ): Promise<LimpezaArquivoResultado> {
        const diasRetencao =
            input.diasRetencao ?? 7;

        const limit =
            input.limit ?? 100;

        const dryRun =
            input.dryRun ?? false;

        if (diasRetencao < 1) {
            throw new Error(
                "diasRetencao precisa ser maior ou igual a 1.",
            );
        }

        if (
            limit < 1 ||
            limit > 500
        ) {
            throw new Error(
                "limit precisa estar entre 1 e 500.",
            );
        }

        const dataLimite =
            calcularDataLimiteRemocao(
                diasRetencao,
            );

        const arquivos =
            await prisma.sysArquivo.findMany({
                where: {
                    deleted_at: {
                        not: null,
                        lte: dataLimite,
                    },
                    storage_deleted_at:
                        null,
                },
                select: {
                    id: true,
                    file_key: true,
                    deleted_at: true,
                    storage_deleted_at:
                        true,
                },
                orderBy: {
                    deleted_at: "asc",
                },
                take: limit,
            });

        const resultado: LimpezaArquivoResultado = {
            encontrados:
            arquivos.length,
            apagados: 0,
            falhas: 0,
            dryRun,
        };

        for (
            const arquivo of arquivos
            ) {
            try {
                if (dryRun) {
                    continue;
                }

                await storageService.delete(
                    arquivo.file_key,
                );

                await prisma.sysArquivo.update({
                    where: {
                        id: arquivo.id,
                    },
                    data: {
                        storage_deleted_at:
                            new Date(),
                        updated_at:
                            new Date(),
                    },
                });

                resultado.apagados += 1;
            } catch (error) {
                resultado.falhas += 1;

                console.error(
                    "[arquivo.cleanup]",
                    {
                        arquivoId:
                        arquivo.id,
                        fileKey:
                        arquivo.file_key,
                        error,
                    },
                );
            }
        }

        return resultado;
    }


    private async registrarArquivo(
        params: {
            uploadedFile:
                UploadedFileResult;
            tipoCodigo?: string;
            createdBySysUsuarioId?: number;
        },
    ) {
        const {
            uploadedFile,
        } = params;

        const [
            sysArquivoDiscoId,
            sysArquivoVisibilidadeId,
            sysArquivoTipoId,
        ] = await Promise.all([
            findRequiredArquivoDiscoId(
                uploadedFile.disk,
            ),

            findRequiredArquivoVisibilidadeId(
                uploadedFile.visibility,
            ),

            findArquivoTipoId(
                params.tipoCodigo,
            ),
        ]);

        return prisma.sysArquivo.create({
            data: {
                sys_arquivo_disco_id:
                sysArquivoDiscoId,

                sys_arquivo_visibilidade_id:
                sysArquivoVisibilidadeId,

                sys_arquivo_tipo_id:
                sysArquivoTipoId,

                bucket:
                uploadedFile.bucket,

                file_key:
                uploadedFile.fileKey,

                public_url:
                uploadedFile.publicUrl,

                original_name:
                uploadedFile.originalName,

                mime_type:
                uploadedFile.mimeType,

                size_bytes:
                uploadedFile.sizeBytes,

                content_hash:
                uploadedFile.contentHash,

                created_by_sys_usuario_id:
                params.createdBySysUsuarioId,

                created_at:
                    new Date(),

                updated_at:
                    new Date(),
            },
        });
    }
}


export const arquivoService =
    new ArquivoService();