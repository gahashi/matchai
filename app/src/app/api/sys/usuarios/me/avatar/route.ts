import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireApiAccess,
} from "@/lib/auth/require-api-access";

import { prisma } from "@/lib/prisma";

import {
    arquivoService,
} from "@/lib/storage/arquivo-service";


export const runtime = "nodejs";


export async function POST(
    request: NextRequest,
) {
    let novoArquivoId:
        number | null = null;

    try {
        const access =
            await requireApiAccess(
                request,
            );

        if (!access.ok) {
            return access.response;
        }

        const sysUsuarioId =
            access.session.user.id;

        const usuario =
            await prisma.sysUsuario.findUnique({
                where: {
                    id: sysUsuarioId,
                },
                select: {
                    id: true,
                    avatar_sys_arquivo_id:
                        true,
                },
            });

        if (!usuario) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Usuário não encontrado.",
                },
                {
                    status: 404,
                },
            );
        }

        const formData =
            await request.formData();

        const file =
            formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Nenhuma imagem enviada.",
                },
                {
                    status: 400,
                },
            );
        }

        const avatarAnteriorArquivoId =
            usuario.avatar_sys_arquivo_id;

        const result =
            await arquivoService.uploadPublicImage({
                file,

                folder:
                    `usuarios/${usuario.id}/avatar`,

                filenamePrefix:
                    "avatar",

                tipoCodigo:
                    "avatar_usuario",

                createdBySysUsuarioId:
                usuario.id,
            });

        novoArquivoId =
            result.arquivo.id;

        await prisma.$transaction(
            async (tx) => {
                await tx.sysUsuario.update({
                    where: {
                        id: usuario.id,
                    },
                    data: {
                        avatar_sys_arquivo_id:
                        result.arquivo.id,

                        updated_at:
                            new Date(),
                    },
                });

                await tx.user.updateMany({
                    where: {
                        sysUsuarioId:
                        usuario.id,
                    },
                    data: {
                        image:
                        result.uploadedFile
                            .publicUrl,

                        updatedAt:
                            new Date(),
                    },
                });

                if (
                    avatarAnteriorArquivoId &&
                    avatarAnteriorArquivoId !==
                    result.arquivo.id
                ) {
                    await tx.sysArquivo.updateMany({
                        where: {
                            id:
                            avatarAnteriorArquivoId,

                            deleted_at:
                                null,
                        },
                        data: {
                            deleted_at:
                                new Date(),

                            updated_at:
                                new Date(),
                        },
                    });
                }
            },
        );

        return NextResponse.json({
            success: true,

            usuario: {
                id:
                usuario.id,

                avatar_sys_arquivo_id:
                result.arquivo.id,

                avatar_url:
                result.uploadedFile
                    .publicUrl,
            },

            arquivo:
            result.arquivo,
        });
    } catch (error) {
        console.error(
            "[perfil.avatar]",
            error,
        );

        /**
         * O SysArquivo já foi criado,
         * mas alguma operação posterior
         * pode ter falhado.
         *
         * Marcamos o arquivo como removido
         * para a rotina de limpeza eliminar
         * posteriormente o objeto do storage.
         */
        if (novoArquivoId) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        novoArquivoId,
                    });
            } catch (
                rollbackError
                ) {
                console.error(
                    "[perfil.avatar.rollback]",
                    rollbackError,
                );
            }
        }

        return NextResponse.json(
            {
                success: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao atualizar foto.",
            },
            {
                status: 500,
            },
        );
    }
}