import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { arquivoService } from "@/lib/storage/arquivo-service";

async function getCurrentSysUsuario() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return null;
    }

    const sessionUser = session.user as {
        email?: string | null;
        sysUsuarioId?: number | null;
    };

    if (sessionUser.sysUsuarioId) {
        return prisma.sysUsuario.findUnique({
            where: {
                id: Number(sessionUser.sysUsuarioId),
            },
        });
    }

    if (sessionUser.email) {
        return prisma.sysUsuario.findUnique({
            where: {
                email: sessionUser.email,
            },
        });
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const usuario = await getCurrentSysUsuario();

        if (!usuario) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Usuário não autenticado.",
                },
                { status: 401 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Nenhuma imagem enviada.",
                },
                { status: 400 },
            );
        }

        const result = await arquivoService.uploadPublicImage({
            file,
            folder: `usuarios/${usuario.id}/avatar`,
            filenamePrefix: "avatar",
            tipoCodigo: "avatar_usuario",
            entidadeTipoCodigo: "sys_usuario",
            entidadeId: usuario.id,
            createdByUsuarioId: usuario.id,
        });

        const usuarioAtualizado = await prisma.sysUsuario.update({
            where: {
                id: usuario.id,
            },
            data: {
                avatar_sys_arquivo_id: result.arquivo.id,
                avatar_file_key: result.uploadedFile.fileKey,
                avatar_url: result.uploadedFile.publicUrl,
                updated_at: new Date(),
            },
            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                avatar_url: true,
                avatar_file_key: true,
                avatar_sys_arquivo_id: true,
            },
        });

        await prisma.user.updateMany({
            where: {
                sysUsuarioId: usuario.id,
            },
            data: {
                image: usuarioAtualizado.avatar_url,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            usuario: usuarioAtualizado,
            arquivo: result.arquivo,
        });
    } catch (error) {
        console.error("[perfil.avatar]", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Erro ao atualizar foto.",
            },
            { status: 500 },
        );
    }
}