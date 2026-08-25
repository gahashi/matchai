import {
    prisma,
} from "@/lib/prisma";

import {
    arquivoService,
} from "@/lib/storage/arquivo-service";


export type PromocaoHorarioInput = {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
};


type PromocaoBaseInput = {
    parceiroId: number;

    titulo: string;
    descricao?: string | null;

    precoPromocional?: number | null;

    validadeInicio?: Date | null;
    validadeFim?: Date | null;

    ordem: number;
    ativo: boolean;
    exibirTv: boolean;

    itemIds: number[];
    horarios: PromocaoHorarioInput[];
};


type CreatePromocaoInput =
    PromocaoBaseInput & {
    imagem?: File | null;
    sysUsuarioId: number;
};


type UpdatePromocaoInput =
    PromocaoBaseInput & {
    id: number;
    imagem?: File | null;
    removerImagem: boolean;
    sysUsuarioId: number;
};


function optionalText(
    value?: string | null,
) {
    const normalized =
        value?.trim();

    return normalized ||
        null;
}


function parseTime(
    value: string,
) {
    if (
        !/^\d{2}:\d{2}$/.test(
            value,
        )
    ) {
        throw new Error(
            "Informe os horários no formato HH:mm.",
        );
    }

    const [
        hours,
        minutes,
    ] =
        value
            .split(":")
            .map(Number);

    if (
        !Number.isInteger(hours) ||
        hours < 0 ||
        hours > 23 ||
        !Number.isInteger(minutes) ||
        minutes < 0 ||
        minutes > 59
    ) {
        throw new Error(
            "Informe um horário válido.",
        );
    }

    return new Date(
        Date.UTC(
            1970,
            0,
            1,
            hours,
            minutes,
            0,
            0,
        ),
    );
}


function serializeTime(
    value: Date,
) {
    return `${String(
        value.getUTCHours(),
    ).padStart(
        2,
        "0",
    )}:${String(
        value.getUTCMinutes(),
    ).padStart(
        2,
        "0",
    )}`;
}


function validateInput(
    input: PromocaoBaseInput,
) {
    const titulo =
        input.titulo.trim();

    if (
        titulo.length < 2 ||
        titulo.length > 150
    ) {
        throw new Error(
            "Informe um título válido para a promoção.",
        );
    }

    if (
        input.descricao &&
        input.descricao.length > 2000
    ) {
        throw new Error(
            "A descrição da promoção deve possuir no máximo 2000 caracteres.",
        );
    }

    if (
        input.precoPromocional !== null &&
        input.precoPromocional !== undefined &&
        (
            !Number.isFinite(
                input.precoPromocional,
            ) ||
            input.precoPromocional < 0
        )
    ) {
        throw new Error(
            "Informe um preço promocional válido.",
        );
    }

    if (
        !Number.isInteger(
            input.ordem,
        ) ||
        input.ordem < 0
    ) {
        throw new Error(
            "A ordem deve ser um número inteiro igual ou maior que zero.",
        );
    }

    if (
        input.validadeInicio &&
        input.validadeFim &&
        input.validadeFim <
        input.validadeInicio
    ) {
        throw new Error(
            "A data final da promoção não pode ser anterior à data inicial.",
        );
    }

    const itemIds =
        [
            ...new Set(
                input.itemIds,
            ),
        ];

    if (
        itemIds.length === 0
    ) {
        throw new Error(
            "Selecione pelo menos um item do cardápio.",
        );
    }

    if (
        itemIds.some(
            (
                id,
            ) =>
                !Number.isInteger(id) ||
                id <= 0,
        )
    ) {
        throw new Error(
            "A promoção possui um item inválido.",
        );
    }

    if (
        input.horarios.length === 0
    ) {
        throw new Error(
            "Cadastre pelo menos um horário para a promoção.",
        );
    }

    const uniqueHorarios =
        new Set<string>();

    for (
        const horario
        of input.horarios
        ) {
        if (
            !Number.isInteger(
                horario.diaSemana,
            ) ||
            horario.diaSemana < 0 ||
            horario.diaSemana > 6
        ) {
            throw new Error(
                "A promoção possui um dia da semana inválido.",
            );
        }

        const inicio =
            parseTime(
                horario.horaInicio,
            );

        const fim =
            parseTime(
                horario.horaFim,
            );

        if (
            inicio.getTime() ===
            fim.getTime()
        ) {
            throw new Error(
                "O horário inicial e final não podem ser iguais.",
            );
        }

        const key =
            [
                horario.diaSemana,
                horario.horaInicio,
                horario.horaFim,
            ].join(
                ":",
            );

        if (
            uniqueHorarios.has(
                key,
            )
        ) {
            throw new Error(
                "Existe um horário repetido na promoção.",
            );
        }

        uniqueHorarios.add(
            key,
        );
    }
}


const promocaoItemOrderBy = [
    {
        ordem:
            "asc" as const,
    },
    {
        id:
            "asc" as const,
    },
];


const promocaoHorarioOrderBy = [
    {
        dia_semana:
            "asc" as const,
    },
    {
        hora_inicio:
            "asc" as const,
    },
    {
        id:
            "asc" as const,
    },
];


const promocaoSelect = {
    id: true,

    par_parceiro_id:
        true,

    imagem_sys_arquivo_id:
        true,

    titulo:
        true,

    descricao:
        true,

    preco_promocional:
        true,

    validade_inicio:
        true,

    validade_fim:
        true,

    ordem:
        true,

    ativo:
        true,

    exibir_tv:
        true,

    created_at:
        true,

    updated_at:
        true,

    imagem_sys_arquivo: {
        select: {
            id: true,
            public_url: true,
            original_name: true,
        },
    },

    crd_promocao_itens: {
        select: {
            id: true,
            ordem: true,

            crd_item: {
                select: {
                    id: true,
                    nome: true,
                    preco: true,
                    ativo: true,
                    deleted_at: true,

                    crd_categoria: {
                        select: {
                            id: true,
                            nome: true,
                        },
                    },

                    imagem_sys_arquivo: {
                        select: {
                            public_url: true,
                        },
                    },
                },
            },
        },

        orderBy:
        promocaoItemOrderBy,
    },

    crd_promocao_horarios: {
        select: {
            id: true,
            dia_semana: true,
            hora_inicio: true,
            hora_fim: true,
        },

        orderBy:
        promocaoHorarioOrderBy,
    },
} as const;


function serializePromocao(
    promocao: any,
) {
    const itens =
        promocao
            .crd_promocao_itens
            .map(
                (
                    vinculo: any,
                ) => ({
                    id:
                    vinculo.id,

                    ordem:
                    vinculo.ordem,

                    item: {
                        id:
                        vinculo
                            .crd_item
                            .id,

                        nome:
                        vinculo
                            .crd_item
                            .nome,

                        preco:
                            Number(
                                vinculo
                                    .crd_item
                                    .preco,
                            ),

                        ativo:
                        vinculo
                            .crd_item
                            .ativo,

                        removido:
                            Boolean(
                                vinculo
                                    .crd_item
                                    .deleted_at,
                            ),

                        categoria: {
                            id:
                            vinculo
                                .crd_item
                                .crd_categoria
                                .id,

                            nome:
                            vinculo
                                .crd_item
                                .crd_categoria
                                .nome,
                        },

                        imagem_url:
                            vinculo
                                .crd_item
                                .imagem_sys_arquivo
                                ?.public_url ??
                            null,
                    },
                }),
            );

    const fallbackImagem =
        itens.find(
            (
                vinculo: any,
            ) =>
                !vinculo
                    .item
                    .removido &&
                vinculo
                    .item
                    .imagem_url,
        )
            ?.item
            .imagem_url ??
        null;

    return {
        id:
        promocao.id,

        titulo:
        promocao.titulo,

        descricao:
        promocao.descricao,

        preco_promocional:
            promocao
                .preco_promocional ===
            null
                ? null
                : Number(
                    promocao
                        .preco_promocional,
                ),

        validade_inicio:
            promocao
                .validade_inicio
                ? promocao
                    .validade_inicio
                    .toISOString()
                    .slice(
                        0,
                        10,
                    )
                : null,

        validade_fim:
            promocao
                .validade_fim
                ? promocao
                    .validade_fim
                    .toISOString()
                    .slice(
                        0,
                        10,
                    )
                : null,

        ordem:
        promocao.ordem,

        ativo:
        promocao.ativo,

        exibir_tv:
        promocao.exibir_tv,

        imagem:
            promocao
                .imagem_sys_arquivo
                ? {
                    sys_arquivo_id:
                    promocao
                        .imagem_sys_arquivo
                        .id,

                    public_url:
                    promocao
                        .imagem_sys_arquivo
                        .public_url,

                    original_name:
                    promocao
                        .imagem_sys_arquivo
                        .original_name,
                }
                : null,

        imagem_efetiva_url:
            promocao
                .imagem_sys_arquivo
                ?.public_url ??
            fallbackImagem,

        itens,

        horarios:
            promocao
                .crd_promocao_horarios
                .map(
                    (
                        horario: any,
                    ) => ({
                        id:
                        horario.id,

                        dia_semana:
                        horario.dia_semana,

                        hora_inicio:
                            serializeTime(
                                horario.hora_inicio,
                            ),

                        hora_fim:
                            serializeTime(
                                horario.hora_fim,
                            ),
                    }),
                ),

        created_at:
        promocao.created_at,

        updated_at:
        promocao.updated_at,
    };
}


class PromocaoService {
    async listByParceiro(
        parceiroId: number,
    ) {
        const promocoes =
            await prisma
                .crdPromocao
                .findMany({
                    where: {
                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select:
                    promocaoSelect,

                    orderBy: [
                        {
                            ativo:
                                "desc",
                        },
                        {
                            ordem:
                                "asc",
                        },
                        {
                            titulo:
                                "asc",
                        },
                        {
                            id:
                                "asc",
                        },
                    ],
                });

        return promocoes.map(
            serializePromocao,
        );
    }


    async create(
        input:
        CreatePromocaoInput,
    ) {
        validateInput(
            input,
        );

        const itemIds =
            await this
                .validateItems(
                    input.parceiroId,
                    input.itemIds,
                );

        const promocao =
            await prisma
                .$transaction(
                    async (
                        tx,
                    ) => {
                        const created =
                            await tx
                                .crdPromocao
                                .create({
                                    data: {
                                        par_parceiro_id:
                                        input
                                            .parceiroId,

                                        titulo:
                                            input
                                                .titulo
                                                .trim(),

                                        descricao:
                                            optionalText(
                                                input
                                                    .descricao,
                                            ),

                                        preco_promocional:
                                            input
                                                .precoPromocional ??
                                            null,

                                        validade_inicio:
                                            input
                                                .validadeInicio ??
                                            null,

                                        validade_fim:
                                            input
                                                .validadeFim ??
                                            null,

                                        ordem:
                                        input
                                            .ordem,

                                        ativo:
                                            input
                                                .ativo
                                                ? 1
                                                : 0,

                                        exibir_tv:
                                            input
                                                .exibirTv
                                                ? 1
                                                : 0,

                                        created_at:
                                            new Date(),

                                        updated_at:
                                            new Date(),
                                    },

                                    select: {
                                        id:
                                            true,
                                    },
                                });

                        await tx
                            .crdPromocaoItem
                            .createMany({
                                data:
                                    itemIds.map(
                                        (
                                            itemId,
                                            index,
                                        ) => ({
                                            crd_promocao_id:
                                            created.id,

                                            crd_item_id:
                                            itemId,

                                            ordem:
                                            index,

                                            created_at:
                                                new Date(),

                                            updated_at:
                                                new Date(),
                                        }),
                                    ),
                            });

                        await tx
                            .crdPromocaoHorario
                            .createMany({
                                data:
                                    input
                                        .horarios
                                        .map(
                                            (
                                                horario,
                                            ) => ({
                                                crd_promocao_id:
                                                created.id,

                                                dia_semana:
                                                horario
                                                    .diaSemana,

                                                hora_inicio:
                                                    parseTime(
                                                        horario
                                                            .horaInicio,
                                                    ),

                                                hora_fim:
                                                    parseTime(
                                                        horario
                                                            .horaFim,
                                                    ),

                                                created_at:
                                                    new Date(),

                                                updated_at:
                                                    new Date(),
                                            }),
                                        ),
                            });

                        return created;
                    },
                );

        let arquivoId:
            number | null =
            null;

        try {
            if (
                input.imagem
            ) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.imagem,

                            folder:
                                `parceiros/${input.parceiroId}/cardapio/promocoes`,

                            filenamePrefix:
                                `promocao-${promocao.id}`,

                            tipoCodigo:
                                "cardapio_promocao_imagem",

                            createdBySysUsuarioId:
                            input
                                .sysUsuarioId,
                        });

                arquivoId =
                    upload
                        .arquivo
                        .id;

                await prisma
                    .crdPromocao
                    .update({
                        where: {
                            id:
                            promocao.id,
                        },

                        data: {
                            imagem_sys_arquivo_id:
                            arquivoId,

                            updated_at:
                                new Date(),
                        },
                    });
            }

            return this.findById(
                input.parceiroId,
                promocao.id,
            );
        } catch (
            error
            ) {
            if (
                arquivoId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.promocao.create.file.cleanup]",
                        cleanupError,
                    );
                }
            }

            await prisma
                .$transaction([
                    prisma
                        .crdPromocaoHorario
                        .deleteMany({
                            where: {
                                crd_promocao_id:
                                promocao.id,
                            },
                        }),

                    prisma
                        .crdPromocaoItem
                        .deleteMany({
                            where: {
                                crd_promocao_id:
                                promocao.id,
                            },
                        }),

                    prisma
                        .crdPromocao
                        .delete({
                            where: {
                                id:
                                promocao.id,
                            },
                        }),
                ]);

            throw error;
        }
    }


    async update(
        input:
        UpdatePromocaoInput,
    ) {
        validateInput(
            input,
        );

        const existente =
            await this
                .ensurePromocao(
                    input.parceiroId,
                    input.id,
                );

        const itemIds =
            await this
                .validateItems(
                    input.parceiroId,
                    input.itemIds,
                );

        let novaImagemId:
            number | null =
            null;

        if (
            input.imagem
        ) {
            const upload =
                await arquivoService
                    .uploadPublicImage({
                        file:
                        input.imagem,

                        folder:
                            `parceiros/${input.parceiroId}/cardapio/promocoes`,

                        filenamePrefix:
                            `promocao-${input.id}`,

                        tipoCodigo:
                            "cardapio_promocao_imagem",

                        createdBySysUsuarioId:
                        input
                            .sysUsuarioId,
                    });

            novaImagemId =
                upload
                    .arquivo
                    .id;
        }

        try {
            const imagemFinalId =
                novaImagemId ??
                (
                    input.removerImagem
                        ? null
                        : existente
                            .imagem_sys_arquivo_id
                );

            await prisma
                .$transaction(
                    async (
                        tx,
                    ) => {
                        await tx
                            .crdPromocao
                            .update({
                                where: {
                                    id:
                                    input.id,
                                },

                                data: {
                                    titulo:
                                        input
                                            .titulo
                                            .trim(),

                                    descricao:
                                        optionalText(
                                            input
                                                .descricao,
                                        ),

                                    preco_promocional:
                                        input
                                            .precoPromocional ??
                                        null,

                                    validade_inicio:
                                        input
                                            .validadeInicio ??
                                        null,

                                    validade_fim:
                                        input
                                            .validadeFim ??
                                        null,

                                    ordem:
                                    input
                                        .ordem,

                                    ativo:
                                        input
                                            .ativo
                                            ? 1
                                            : 0,

                                    exibir_tv:
                                        input
                                            .exibirTv
                                            ? 1
                                            : 0,

                                    imagem_sys_arquivo_id:
                                    imagemFinalId,

                                    updated_at:
                                        new Date(),
                                },
                            });

                        await tx
                            .crdPromocaoItem
                            .deleteMany({
                                where: {
                                    crd_promocao_id:
                                    input.id,
                                },
                            });

                        await tx
                            .crdPromocaoItem
                            .createMany({
                                data:
                                    itemIds.map(
                                        (
                                            itemId,
                                            index,
                                        ) => ({
                                            crd_promocao_id:
                                            input.id,

                                            crd_item_id:
                                            itemId,

                                            ordem:
                                            index,

                                            created_at:
                                                new Date(),

                                            updated_at:
                                                new Date(),
                                        }),
                                    ),
                            });

                        await tx
                            .crdPromocaoHorario
                            .deleteMany({
                                where: {
                                    crd_promocao_id:
                                    input.id,
                                },
                            });

                        await tx
                            .crdPromocaoHorario
                            .createMany({
                                data:
                                    input
                                        .horarios
                                        .map(
                                            (
                                                horario,
                                            ) => ({
                                                crd_promocao_id:
                                                input.id,

                                                dia_semana:
                                                horario
                                                    .diaSemana,

                                                hora_inicio:
                                                    parseTime(
                                                        horario
                                                            .horaInicio,
                                                    ),

                                                hora_fim:
                                                    parseTime(
                                                        horario
                                                            .horaFim,
                                                    ),

                                                created_at:
                                                    new Date(),

                                                updated_at:
                                                    new Date(),
                                            }),
                                        ),
                            });
                    },
                );

            if (
                existente
                    .imagem_sys_arquivo_id &&
                existente
                    .imagem_sys_arquivo_id !==
                imagemFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            existente
                                .imagem_sys_arquivo_id,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.promocao.update.old-file.cleanup]",
                        cleanupError,
                    );
                }
            }

            return this.findById(
                input.parceiroId,
                input.id,
            );
        } catch (
            error
            ) {
            if (
                novaImagemId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novaImagemId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.promocao.update.new-file.cleanup]",
                        cleanupError,
                    );
                }
            }

            throw error;
        }
    }


    async setAtivo(
        parceiroId: number,
        promocaoId: number,
        ativo: boolean,
    ) {
        await this.ensurePromocao(
            parceiroId,
            promocaoId,
        );

        await prisma
            .crdPromocao
            .update({
                where: {
                    id:
                    promocaoId,
                },

                data: {
                    ativo:
                        ativo
                            ? 1
                            : 0,

                    updated_at:
                        new Date(),
                },
            });

        return this.findById(
            parceiroId,
            promocaoId,
        );
    }


    async delete(
        parceiroId: number,
        promocaoId: number,
    ) {
        const promocao =
            await this
                .ensurePromocao(
                    parceiroId,
                    promocaoId,
                );

        await prisma
            .crdPromocao
            .update({
                where: {
                    id:
                    promocaoId,
                },

                data: {
                    ativo:
                        0,

                    deleted_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });

        if (
            promocao
                .imagem_sys_arquivo_id
        ) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        promocao
                            .imagem_sys_arquivo_id,
                    });
            } catch (
                cleanupError
                ) {
                console.error(
                    "[cardapio.promocao.delete.file.cleanup]",
                    cleanupError,
                );
            }
        }

        return {
            id:
            promocaoId,
        };
    }


    async findById(
        parceiroId: number,
        promocaoId: number,
    ) {
        const promocao =
            await prisma
                .crdPromocao
                .findFirst({
                    where: {
                        id:
                        promocaoId,

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select:
                    promocaoSelect,
                });

        return promocao
            ? serializePromocao(
                promocao,
            )
            : null;
    }


    private async ensurePromocao(
        parceiroId: number,
        promocaoId: number,
    ) {
        const promocao =
            await prisma
                .crdPromocao
                .findFirst({
                    where: {
                        id:
                        promocaoId,

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,

                        imagem_sys_arquivo_id:
                            true,
                    },
                });

        if (
            !promocao
        ) {
            throw new Error(
                "Promoção não encontrada.",
            );
        }

        return promocao;
    }


    private async validateItems(
        parceiroId: number,
        itemIdsValue: number[],
    ) {
        const itemIds =
            [
                ...new Set(
                    itemIdsValue,
                ),
            ];

        const itens =
            await prisma
                .crdItem
                .findMany({
                    where: {
                        id: {
                            in:
                            itemIds,
                        },

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,
                    },
                });

        if (
            itens.length !==
            itemIds.length
        ) {
            throw new Error(
                "Um ou mais itens selecionados não pertencem a este cardápio.",
            );
        }

        return itemIds;
    }
}


export const promocaoService =
    new PromocaoService();
