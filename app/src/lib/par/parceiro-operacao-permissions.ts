import {
    prisma,
} from "@/lib/prisma";


export type ParceiroOperacaoTipoCodigo =
    | "proprietario"
    | "administrador"
    | "membro"
    | string;


export type ParceiroOperacaoPermissao = {
    tipoCodigo:
        ParceiroOperacaoTipoCodigo;

    tipoNome:
        string;

    canManage:
        boolean;
};


const TIPOS_GESTORES =
    new Set([
        "proprietario",
        "administrador",
    ]);


export async function getParceiroOperacaoPermissao(
    input: {
        sysUsuarioId:
            number;

        parceiroId:
            number;
    },
): Promise<
    ParceiroOperacaoPermissao |
    null
> {
    const vinculo =
        await prisma
            .parParceiroUsuario
            .findFirst({
                where: {
                    sys_usuario_id:
                        input
                            .sysUsuarioId,

                    par_parceiro_id:
                        input
                            .parceiroId,

                    ativo:
                        1,

                    par_parceiro: {
                        ativo:
                            1,

                        deleted_at:
                            null,
                    },
                },

                select: {
                    par_parceiro_usuario_tipo: {
                        select: {
                            codigo:
                                true,

                            nome:
                                true,
                        },
                    },
                },
            });


    if (
        !vinculo
    ) {
        return null;
    }


    const tipo =
        vinculo
            .par_parceiro_usuario_tipo;


    return {
        tipoCodigo:
            tipo.codigo,

        tipoNome:
            tipo.nome,

        canManage:
            TIPOS_GESTORES
                .has(
                    tipo.codigo,
                ),
    };
}


export function canManageParceiroByTipo(
    tipoCodigo:
        string,
) {
    return TIPOS_GESTORES
        .has(
            tipoCodigo,
        );
}
