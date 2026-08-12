import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";


export default async function PerfilPage() {
    const { session } =
        await requireAuthPageAccess(
            "/perfil",
        );

    const usuario =
        await prisma.sysUsuario.findUnique({
            where: {
                id: session.user.id,
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
        redirect("/login");
    }

    const perfilUsuario = {
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
    };

    return (
        <AppShell>
            <ProfileClient
                usuario={perfilUsuario}
            />
        </AppShell>
    );
}
