import {
    prisma,
} from "@/lib/prisma";
import {arquivoService} from "@/lib/storage/arquivo-service";


type UpdateParceiroInformacoesInput = {
    parceiroId: number;

    nome: string;
    descricao?: string | null;

    slug: string;

    emailContato?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;

    endereco?: string | null;
    googleMapsUrl?: string | null;

    instagramUrl?: string | null;
    siteUrl?: string | null;

    horarioFuncionamento?: string | null;
};

type UpdateParceiroAparenciaInput = {
    parceiroId: number;

    corPrimaria?: string | null;
    corSecundaria?: string | null;
    corFundo?: string | null;
    corTexto?: string | null;

    logo?: File | null;
    banner?: File | null;

    removerLogo: boolean;
    removerBanner: boolean;

    sysUsuarioId: number;
};

function normalizeOptional(
    value?: string | null,
) {
    const normalized =
        value?.trim();

    return normalized
        ? normalized
        : null;
}

function normalizeLimitedText(
    value: string | null | undefined,
    maxLength: number,
    label: string,
) {
    const normalized =
        normalizeOptional(
            value,
        );

    if (
        normalized &&
        normalized.length >
        maxLength
    ) {
        throw new Error(
            `${label} deve possuir no máximo ${maxLength} caracteres.`,
        );
    }

    return normalized;
}


function normalizeEmail(
    value?: string | null,
) {
    const email =
        normalizeLimitedText(
            value,
            190,
            "O e-mail",
        );

    if (
        !email
    ) {
        return null;
    }

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email,
        )
    ) {
        throw new Error(
            "Informe um e-mail de contato válido.",
        );
    }

    return email;
}


function normalizeExternalUrl(
    value:
        string |
        null |
        undefined,

    label: string,
) {
    const normalized =
        normalizeLimitedText(
            value,
            1000,
            label,
        );

    if (
        !normalized
    ) {
        return null;
    }

    let url:
        URL;

    try {
        url =
            new URL(
                normalized,
            );
    } catch {
        throw new Error(
            `Informe uma URL válida para ${label.toLowerCase()}.`,
        );
    }

    if (
        url.protocol !==
        "http:" &&
        url.protocol !==
        "https:"
    ) {
        throw new Error(
            `${label} deve utilizar http:// ou https://.`,
        );
    }

    return normalized;
}

function normalizeColor(
    value?: string | null,
) {
    const color =
        normalizeOptional(
            value,
        );

    if (!color) {
        return null;
    }

    if (
        !/^#[0-9a-fA-F]{6}$/.test(
            color,
        )
    ) {
        throw new Error(
            "As cores devem estar no formato hexadecimal, por exemplo #9CD91A.",
        );
    }

    return color.toUpperCase();
}

function normalizeSlug(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /-+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        );
}


class ParceiroConfigService {
    async updateInformacoes(
        input: UpdateParceiroInformacoesInput,
    ) {
        const nome =
            input.nome.trim();

        if (
            nome.length < 2 ||
            nome.length > 150
        ) {
            throw new Error(
                "Informe um nome válido para o parceiro.",
            );
        }


        const slug =
            normalizeSlug(
                input.slug,
            );

        if (
            slug.length < 2 ||
            slug.length > 150
        ) {
            throw new Error(
                "Informe uma URL pública válida.",
            );
        }


        const descricao =
            normalizeOptional(
                input.descricao,
            );

        const emailContato =
            normalizeEmail(
                input.emailContato,
            );

        const telefone =
            normalizeLimitedText(
                input.telefone,
                30,
                "O telefone",
            );

        const whatsapp =
            normalizeLimitedText(
                input.whatsapp,
                30,
                "O WhatsApp",
            );

        const endereco =
            normalizeLimitedText(
                input.endereco,
                500,
                "O endereço",
            );

        const googleMapsUrl =
            normalizeExternalUrl(
                input.googleMapsUrl,
                "O link do Google Maps",
            );

        const instagramUrl =
            normalizeExternalUrl(
                input.instagramUrl,
                "O Instagram",
            );

        const siteUrl =
            normalizeExternalUrl(
                input.siteUrl,
                "O site",
            );

        const horarioFuncionamento =
            normalizeLimitedText(
                input.horarioFuncionamento,
                4000,
                "O horário de funcionamento",
            );


        const parceiro =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id:
                        input.parceiroId,

                        ativo:
                            1,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,
                    },
                });


        if (
            !parceiro
        ) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }


        const slugEmUso =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        slug,

                        id: {
                            not:
                            input.parceiroId,
                        },

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,
                    },
                });


        if (
            slugEmUso
        ) {
            throw new Error(
                "Esta URL pública já está sendo utilizada.",
            );
        }


        const atualizado =
            await prisma
                .parParceiro
                .update({
                    where: {
                        id:
                        input.parceiroId,
                    },

                    data: {
                        nome,
                        descricao,
                        slug,

                        email_contato:
                        emailContato,

                        telefone,
                        whatsapp,

                        endereco,

                        google_maps_url:
                        googleMapsUrl,

                        instagram_url:
                        instagramUrl,

                        site_url:
                        siteUrl,

                        horario_funcionamento:
                        horarioFuncionamento,

                        updated_at:
                            new Date(),
                    },

                    select: {
                        id:
                            true,

                        codigo:
                            true,

                        slug:
                            true,

                        nome:
                            true,

                        descricao:
                            true,

                        email_contato:
                            true,

                        telefone:
                            true,

                        whatsapp:
                            true,

                        endereco:
                            true,

                        google_maps_url:
                            true,

                        instagram_url:
                            true,

                        site_url:
                            true,

                        horario_funcionamento:
                            true,
                    },
                });


        return atualizado;
    }
    async updateAparencia(
        input: UpdateParceiroAparenciaInput,
    ) {
        const existente =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id:
                        input.parceiroId,

                        ativo: 1,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,

                        par_parceiro_tema: {
                            select: {
                                logo_sys_arquivo_id:
                                    true,

                                banner_sys_arquivo_id:
                                    true,
                            },
                        },
                    },
                });

        if (!existente) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }


        const corPrimaria =
            normalizeColor(
                input.corPrimaria,
            );

        const corSecundaria =
            normalizeColor(
                input.corSecundaria,
            );

        const corFundo =
            normalizeColor(
                input.corFundo,
            );

        const corTexto =
            normalizeColor(
                input.corTexto,
            );


        let novoLogoId:
            number | null =
            null;

        let novoBannerId:
            number | null =
            null;


        try {
            if (input.logo) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.logo,

                            folder:
                                `parceiros/${input.parceiroId}/tema`,

                            filenamePrefix:
                                "parceiro-logo",

                            tipoCodigo:
                                "parceiro_logo",

                            createdBySysUsuarioId:
                            input.sysUsuarioId,
                        });

                novoLogoId =
                    upload.arquivo.id;
            }


            if (input.banner) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.banner,

                            folder:
                                `parceiros/${input.parceiroId}/tema`,

                            filenamePrefix:
                                "parceiro-banner",

                            tipoCodigo:
                                "parceiro_banner",

                            createdBySysUsuarioId:
                            input.sysUsuarioId,
                        });

                novoBannerId =
                    upload.arquivo.id;
            }


            const logoFinalId =
                novoLogoId ??
                (
                    input.removerLogo
                        ? null
                        : existente
                            .par_parceiro_tema
                            ?.logo_sys_arquivo_id ??
                        null
                );

            const bannerFinalId =
                novoBannerId ??
                (
                    input.removerBanner
                        ? null
                        : existente
                            .par_parceiro_tema
                            ?.banner_sys_arquivo_id ??
                        null
                );


            await prisma
                .parParceiroTema
                .upsert({
                    where: {
                        par_parceiro_id:
                        input.parceiroId,
                    },

                    create: {
                        par_parceiro_id:
                        input.parceiroId,

                        logo_sys_arquivo_id:
                        logoFinalId,

                        banner_sys_arquivo_id:
                        bannerFinalId,

                        cor_primaria:
                        corPrimaria,

                        cor_secundaria:
                        corSecundaria,

                        cor_fundo:
                        corFundo,

                        cor_texto:
                        corTexto,

                        ativo: 1,

                        created_at:
                            new Date(),

                        updated_at:
                            new Date(),
                    },

                    update: {
                        logo_sys_arquivo_id:
                        logoFinalId,

                        banner_sys_arquivo_id:
                        bannerFinalId,

                        cor_primaria:
                        corPrimaria,

                        cor_secundaria:
                        corSecundaria,

                        cor_fundo:
                        corFundo,

                        cor_texto:
                        corTexto,

                        ativo: 1,

                        updated_at:
                            new Date(),
                    },
                });


            const antigoLogoId =
                existente
                    .par_parceiro_tema
                    ?.logo_sys_arquivo_id ??
                null;

            const antigoBannerId =
                existente
                    .par_parceiro_tema
                    ?.banner_sys_arquivo_id ??
                null;


            if (
                antigoLogoId &&
                antigoLogoId !==
                logoFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            antigoLogoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.config.aparencia.logo.cleanup]",
                        cleanupError,
                    );
                }
            }


            if (
                antigoBannerId &&
                antigoBannerId !==
                bannerFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            antigoBannerId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.config.aparencia.banner.cleanup]",
                        cleanupError,
                    );
                }
            }


            return prisma
                .parParceiro
                .findUnique({
                    where: {
                        id:
                        input.parceiroId,
                    },

                    select: {
                        id: true,

                        par_parceiro_tema: {
                            select: {
                                cor_primaria:
                                    true,

                                cor_secundaria:
                                    true,

                                cor_fundo:
                                    true,

                                cor_texto:
                                    true,

                                logo_sys_arquivo: {
                                    select: {
                                        id: true,
                                        public_url:
                                            true,
                                        original_name:
                                            true,
                                    },
                                },

                                banner_sys_arquivo: {
                                    select: {
                                        id: true,
                                        public_url:
                                            true,
                                        original_name:
                                            true,
                                    },
                                },
                            },
                        },
                    },
                });
        } catch (error) {
            if (novoLogoId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novoLogoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.config.aparencia.new-logo.cleanup]",
                        cleanupError,
                    );
                }
            }


            if (novoBannerId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novoBannerId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.config.aparencia.new-banner.cleanup]",
                        cleanupError,
                    );
                }
            }

            throw error;
        }
    }
}


export const parceiroConfigService =
    new ParceiroConfigService();