import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireApiAccess,
} from "@/lib/auth/require-api-access";
import { prisma } from "@/lib/prisma";


export async function GET(
    request: NextRequest,
) {
    const access =
        await requireApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const usuario =
            await prisma.sysUsuario.findUnique({
                where: {
                    id:
                    access.session.user.id,
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    telefone: true,
                    documento: true,
                    ativo: true,
                    perfil_completo: true,
                    email_verificado_at: true,
                    ultimo_login_at: true,
                    created_at: true,

                    avatar_sys_arquivo: {
                        select: {
                            public_url: true,
                        },
                    },
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

        return NextResponse.json({
            success: true,

            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                documento: usuario.documento,
                avatar_url:
                    usuario.avatar_sys_arquivo
                        ?.public_url ?? null,
                ativo: usuario.ativo,
                perfil_completo:
                usuario.perfil_completo,
                email_verificado_at:
                usuario.email_verificado_at,
                ultimo_login_at:
                usuario.ultimo_login_at,
                created_at:
                usuario.created_at,
            },
        });
    } catch (error) {
        console.error(
            "[perfil.get]",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erro ao carregar perfil.",
            },
            {
                status: 500,
            },
        );
    }
}


export async function PUT(
    request: NextRequest,
) {
    const access =
        await requireApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const body =
            await request.json();

        const nome =
            String(
                body.nome || "",
            ).trim();

        const telefone =
            body.telefone
                ? String(
                    body.telefone,
                ).trim()
                : null;

        if (nome.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Informe um nome com pelo menos 3 caracteres.",
                },
                {
                    status: 400,
                },
            );
        }

        const usuarioAtualizado =
            await prisma.sysUsuario.update({
                where: {
                    id:
                    access.session.user.id,
                },
                data: {
                    nome,
                    telefone,
                    updated_at:
                        new Date(),
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    telefone: true,

                    avatar_sys_arquivo: {
                        select: {
                            public_url:
                                true,
                        },
                    },
                },
            });

        await prisma.user.updateMany({
            where: {
                sysUsuarioId:
                access.session.user.id,
            },
            data: {
                name:
                usuarioAtualizado.nome,
                updatedAt:
                    new Date(),
            },
        });

        return NextResponse.json({
            success: true,

            usuario: {
                id:
                usuarioAtualizado.id,

                nome:
                usuarioAtualizado.nome,

                email:
                usuarioAtualizado.email,

                telefone:
                usuarioAtualizado.telefone,

                avatar_url:
                    usuarioAtualizado
                        .avatar_sys_arquivo
                        ?.public_url ?? null,
            },
        });
    } catch (error) {
        console.error(
            "[perfil.update]",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erro ao atualizar perfil.",
            },
            {
                status: 500,
            },
        );
    }
}
