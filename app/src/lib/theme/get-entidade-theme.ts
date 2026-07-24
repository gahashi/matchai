import { prisma } from "@/lib/prisma";
import { EntityThemeInput } from "@/lib/theme/theme-types";

export async function getActiveAtleticaTheme(
    entEntidadeId: number
): Promise<EntityThemeInput | null> {
    if (!Number.isInteger(entEntidadeId) || entEntidadeId <= 0) {
        return null;
    }

    const tema = await prisma.entEntidadeTema.findFirst({
        where: {
            ent_entidade_id: entEntidadeId,
            ativo: 1,
        },
        select: {
            cor_primaria: true,
            cor_secundaria: true,
            cor_fundo: true,
            cor_texto: true,
        },
        orderBy: {
            id: "desc",
        },
    });

    return tema;
}