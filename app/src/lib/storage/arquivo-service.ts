import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/storage-service";
import type { UploadedFileResult } from "@/lib/storage/storage-types";

type UploadArquivoPublicoInput = {
    file: File;
    folder: string;
    filenamePrefix?: string;
    tipoCodigo?: string;
    entidadeTipoCodigo?: string;
    entidadeId?: number;
    createdByUsuarioId?: number;
};

async function findRequiredArquivoDiscoId(codigo: string): Promise<number> {
    const disco = await prisma.sysArquivoDisco.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!disco) {
        throw new Error(`Disco de arquivo não encontrado: ${codigo}`);
    }

    return disco.id;
}

async function findRequiredArquivoVisibilidadeId(codigo: string): Promise<number> {
    const visibilidade = await prisma.sysArquivoVisibilidade.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!visibilidade) {
        throw new Error(`Visibilidade de arquivo não encontrada: ${codigo}`);
    }

    return visibilidade.id;
}

async function findArquivoTipoId(codigo?: string): Promise<number | null> {
    if (!codigo) {
        return null;
    }

    const tipo = await prisma.sysArquivoTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error(`Tipo de arquivo não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function findArquivoEntidadeTipoId(codigo?: string): Promise<number | null> {
    if (!codigo) {
        return null;
    }

    const entidadeTipo = await prisma.sysArquivoEntidadeTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!entidadeTipo) {
        throw new Error(`Tipo de entidade de arquivo não encontrado: ${codigo}`);
    }

    return entidadeTipo.id;
}

class ArquivoService {
    async uploadPublicImage(input: UploadArquivoPublicoInput) {
        const uploadedFile = await storageService.uploadPublicImage({
            file: input.file,
            folder: input.folder,
            filenamePrefix: input.filenamePrefix,
        });

        const arquivo = await this.registrarArquivo({
            uploadedFile,
            tipoCodigo: input.tipoCodigo,
            entidadeTipoCodigo: input.entidadeTipoCodigo,
            entidadeId: input.entidadeId,
            createdByUsuarioId: input.createdByUsuarioId,
        });

        return {
            uploadedFile,
            arquivo,
        };
    }

    private async registrarArquivo(params: {
        uploadedFile: UploadedFileResult;
        tipoCodigo?: string;
        entidadeTipoCodigo?: string;
        entidadeId?: number;
        createdByUsuarioId?: number;
    }) {
        const { uploadedFile } = params;

        const [
            sysArquivoDiscoId,
            sysArquivoVisibilidadeId,
            sysArquivoTipoId,
            sysArquivoEntidadeTipoId,
        ] = await Promise.all([
            findRequiredArquivoDiscoId(uploadedFile.disk),
            findRequiredArquivoVisibilidadeId(uploadedFile.visibility),
            findArquivoTipoId(params.tipoCodigo),
            findArquivoEntidadeTipoId(params.entidadeTipoCodigo),
        ]);

        return prisma.sysArquivo.create({
            data: {
                sys_arquivo_disco_id: sysArquivoDiscoId,
                sys_arquivo_visibilidade_id: sysArquivoVisibilidadeId,
                sys_arquivo_tipo_id: sysArquivoTipoId,
                sys_arquivo_entidade_tipo_id: sysArquivoEntidadeTipoId,
                entidade_id: params.entidadeId,

                bucket: uploadedFile.bucket,
                file_key: uploadedFile.fileKey,
                public_url: uploadedFile.publicUrl,

                original_name: uploadedFile.originalName,
                mime_type: uploadedFile.mimeType,
                size_bytes: uploadedFile.sizeBytes,
                content_hash: uploadedFile.contentHash,

                created_by_usuario_id: params.createdByUsuarioId,

                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
}

export const arquivoService = new ArquivoService();