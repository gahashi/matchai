import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    prisma,
} from "@/lib/prisma";

import AdminUsuariosClient from "./AdminUsuariosClient";


export default async function AdminUsuariosPage() {
    const {
        session,
    } =
        await requirePageAccess(
            "/admin/usuarios",
        );


    const usuarios =
        await prisma.sysUsuario.findMany({
            where: {
                deleted_at:
                    null,
            },

            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                ativo: true,

                sys_usuario_tipo: {
                    select: {
                        codigo:
                            true,

                        nome:
                            true,
                    },
                },
            },

            orderBy: [
                {
                    nome:
                        "asc",
                },
                {
                    id:
                        "asc",
                },
            ],
        });


    return (
        <AppShell>
            <AdminUsuariosClient
                initialData={{
                    usuarios,
                    currentUserId:
                        session?.user.id ??
                        null,
                }}
            />
        </AppShell>
    );
}