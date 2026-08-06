import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import {
    userHasGlobalPermission,
} from "@/lib/auth/permissions";
import {
    requireAuthPageAccess,
} from "@/lib/auth/require-access";
import {
    contextoEntidadeService,
} from "@/lib/ent/contexto-entidade";

type RequireEntidadeContextoInput = {
    slug: string;
};

export const requireEntidadeContexto = cache(
    async ({
               slug,
           }: RequireEntidadeContextoInput) => {
        const slugNormalizado =
            slug.trim().toLowerCase();

        if (!slugNormalizado) {
            notFound();
        }

        const { session } =
            await requireAuthPageAccess(
                "/ent/entidade"
            );

        const podeVisualizarTodas =
            await userHasGlobalPermission(
                session,
                "entidade.visualizar"
            );

        const resultado =
            await contextoEntidadeService
                .resolverEntidadeContextual({
                    sysUsuarioId:
                    session.user.id,
                    slug: slugNormalizado,
                    podeVisualizarTodas,
                });

        /*
         * A entidade não existe ou foi excluída.
         */
        if (
            resultado.status ===
            "not_found"
        ) {
            notFound();
        }

        /*
         * A entidade existe, mas o usuário
         * não possui acesso ao contexto.
         */
        if (
            resultado.status ===
            "forbidden"
        ) {
            redirect("/sem-permissao");
        }

        return {
            session,
            entidade:
            resultado.entidade,
        };
    }
);