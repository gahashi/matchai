import { prisma } from "@/lib/prisma";

class SocioPublicService {
    async getSocioAtual(sysUsuarioId: number) {
        const now = new Date();

        const socio = await prisma.socSocio.findFirst({
            where: {
                sys_usuario_id: sysUsuarioId,
                inicio_at: { lte: now },
                fim_at: { gte: now },
                soc_socio_status: {
                    codigo: "ativo",
                    ativo: 1,
                },
            },
            select: {
                id: true,
                inicio_at: true,
                fim_at: true,
                soc_plano: {
                    select: {
                        id: true,
                        codigo: true,
                        nome: true,
                        duracao_dias: true,
                    },
                },
            },
            orderBy: { fim_at: "desc" },
        });

        if (!socio) {
            return {
                isSocio: false as const,
                socio: null,
            };
        }

        return {
            isSocio: true as const,
            socio: {
                id: socio.id,
                inicio_at: socio.inicio_at,
                fim_at: socio.fim_at,
                plano: {
                    id: socio.soc_plano.id,
                    codigo: socio.soc_plano.codigo,
                    nome: socio.soc_plano.nome,
                    duracao_dias: socio.soc_plano.duracao_dias,
                },
            },
        };
    }
}

export const socioPublicService = new SocioPublicService();
