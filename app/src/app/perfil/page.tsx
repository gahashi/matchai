import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function PerfilPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login");
    }

    const sessionUser = session.user as {
        id: string;
        email?: string | null;
        sysUsuarioId?: number | null;
    };

    let usuario = null;

    if (sessionUser.sysUsuarioId) {
        usuario = await prisma.sysUsuario.findUnique({
            where: {
                id: Number(sessionUser.sysUsuarioId),
            },
            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                telefone: true,
                codigo_aluno: true,
                documento: true,
                avatar_url: true,
                ativo: true,
                perfil_completo: true,
                email_verificado_at: true,
                ultimo_login_at: true,
                created_at: true,
            },
        });
    }

    if (!usuario && sessionUser.email) {
        usuario = await prisma.sysUsuario.findUnique({
            where: {
                email: sessionUser.email,
            },
            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                telefone: true,
                codigo_aluno: true,
                documento: true,
                avatar_url: true,
                ativo: true,
                perfil_completo: true,
                email_verificado_at: true,
                ultimo_login_at: true,
                created_at: true,
            },
        });
    }

    if (!usuario) {
        redirect("/login");
    }

    return <ProfileClient usuario={usuario} />;
}