import { prisma } from "@/lib/prisma";
import { EntityThemeInput } from "@/lib/theme/theme-types";

export async function getActiveAtleticaTheme(
    atlAtleticaId: number
): Promise<EntityThemeInput | null> {
    if (!Number.isInteger(atlAtleticaId) || atlAtleticaId <= 0) {
        return null;
    }

    const tema = await prisma.atlAtleticaTema.findFirst({
        where: {
            atl_atletica_id: atlAtleticaId,
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