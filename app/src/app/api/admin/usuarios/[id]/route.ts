import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    prisma,
} from "@/lib/prisma";


type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};


export async function PATCH(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );


    if (!access.ok) {
        return access.response;
    }


    try {
        const {
            id,
        } =
            await params;


        const usuarioId =
            Number(id);


        if (
            !Number.isInteger(
                usuarioId,
            ) ||
            usuarioId <= 0
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Usuário inválido.",
                },
                {
                    status: 400,
                },
            );
        }


        if (
            usuarioId ===
            access.session.user.id
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Você não pode alterar o próprio acesso administrativo.",
                },
                {
                    status: 400,
                },
            );
        }


        const body =
            await request.json();


        const tipoCodigo =
            typeof body?.tipo ===
            "string"
                ? body.tipo
                    .trim()
                    .toLowerCase()
                : "";


        if (
            tipoCodigo !==
            "admin" &&
            tipoCodigo !==
            "cliente"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Tipo de usuário inválido.",
                },
                {
                    status: 400,
                },
            );
        }


        const usuario =
            await prisma.sysUsuario.findFirst({
                where: {
                    id:
                    usuarioId,

                    deleted_at:
                        null,
                },

                select: {
                    id:
                        true,

                    ativo:
                        true,

                    sys_usuario_tipo: {
                        select: {
                            codigo:
                                true,
                        },
                    },
                },
            });


        if (!usuario) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Usuário não encontrado.",
                },
                {
                    status: 404,
                },
            );
        }


        if (!usuario.ativo) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Não é possível alterar um usuário inativo.",
                },
                {
                    status: 400,
                },
            );
        }


        if (
            usuario
                .sys_usuario_tipo
                .codigo ===
            tipoCodigo
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "O usuário já possui esse tipo de acesso.",
                },
                {
                    status: 400,
                },
            );
        }

        if (
            usuario
                .sys_usuario_tipo
                .codigo ===
            "admin" &&
            tipoCodigo ===
            "cliente"
        ) {
            const totalAdmins =
                await prisma.sysUsuario.count({
                    where: {
                        ativo: 1,

                        deleted_at:
                            null,

                        sys_usuario_tipo: {
                            codigo:
                                "admin",
                        },
                    },
                });

            if (totalAdmins <= 1) {
                return NextResponse.json(
                    {
                        ok: false,

                        message:
                            "Não é possível remover o último administrador do sistema.",
                    },
                    {
                        status: 400,
                    },
                );
            }
        }


        const tipo =
            await prisma.sysUsuarioTipo.findFirst({
                where: {
                    codigo:
                    tipoCodigo,

                    ativo:
                        1,
                },

                select: {
                    id:
                        true,
                },
            });


        if (!tipo) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Tipo de usuário não configurado.",
                },
                {
                    status: 500,
                },
            );
        }


        const atualizado =
            await prisma.sysUsuario.update({
                where: {
                    id:
                    usuarioId,
                },

                data: {
                    sys_usuario_tipo_id:
                    tipo.id,

                    updated_at:
                        new Date(),
                },

                select: {
                    id:
                        true,

                    nome:
                        true,

                    nickname:
                        true,

                    email:
                        true,

                    ativo:
                        true,

                    sys_usuario_tipo: {
                        select: {
                            codigo:
                                true,

                            nome:
                                true,
                        },
                    },
                },
            });


        return NextResponse.json({
            ok: true,

            message:
                tipoCodigo ===
                "admin"
                    ? `${atualizado.nome} agora é administrador.`
                    : `O acesso administrativo de ${atualizado.nome} foi removido.`,

            data: {
                usuario:
                atualizado,
            },
        });
    } catch (error) {
        console.error(
            "[admin.usuarios.patch]",
            error,
        );


        return NextResponse.json(
            {
                ok: false,

                message:
                    "Não foi possível alterar o acesso do usuário.",
            },
            {
                status: 500,
            },
        );
    }
}