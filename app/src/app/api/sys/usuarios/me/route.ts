import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
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

    return NextResponse.json({
        success: true,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            nickname: usuario.nickname,
            email: usuario.email,
            telefone: usuario.telefone,
            codigo_aluno: usuario.codigo_aluno,
            documento: usuario.documento,
            avatar_url: usuario.avatar_url,
            ativo: usuario.ativo,
            perfil_completo: usuario.perfil_completo,
            email_verificado_at: usuario.email_verificado_at,
            ultimo_login_at: usuario.ultimo_login_at,
            created_at: usuario.created_at,
        },
    });
}

export async function PUT(request: NextRequest) {
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

        const body = await request.json();

        const nome = String(body.nome || "").trim();
        const nickname = String(body.nickname || "").trim().toLowerCase();
        const telefone = body.telefone ? String(body.telefone).trim() : null;

        if (nome.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Informe um nome com pelo menos 3 caracteres.",
                },
                { status: 400 },
            );
        }

        if (!/^[a-z0-9._-]{3,50}$/.test(nickname)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "O nickname deve ter entre 3 e 50 caracteres e usar apenas letras, números, ponto, hífen ou underline.",
                },
                { status: 400 },
            );
        }

        const nicknameExistente = await prisma.sysUsuario.findFirst({
            where: {
                nickname,
                id: {
                    not: usuario.id,
                },
            },
            select: {
                id: true,
            },
        });

        if (nicknameExistente) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Este nickname já está em uso.",
                },
                { status: 409 },
            );
        }

        const usuarioAtualizado = await prisma.sysUsuario.update({
            where: {
                id: usuario.id,
            },
            data: {
                nome,
                nickname,
                telefone,
                updated_at: new Date(),
            },
            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                telefone: true,
                avatar_url: true,
            },
        });

        await prisma.user.updateMany({
            where: {
                sysUsuarioId: usuario.id,
            },
            data: {
                name: nome,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            usuario: usuarioAtualizado,
        });
    } catch (error) {
        console.error("[perfil.update]", error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao atualizar perfil.",
            },
            { status: 500 },
        );
    }
}