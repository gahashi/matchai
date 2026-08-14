import { prisma } from "@/lib/prisma";
import { arquivoService } from "@/lib/storage/arquivo-service";

type EventoWriteInput = {
    titulo: string;
    descricao?: string | null;
    url?: string | null;
    eventoAt?: Date | null;
    inicioExibicao?: Date | null;
    fimExibicao?: Date | null;
    ordem: number;
    destaque: boolean;
    ativo: boolean;
    visivelPublico: boolean;
};

type CreateEventoInput = EventoWriteInput & {
    banner?: File | null;
    createdBySysUsuarioId: number;
};

type UpdateEventoInput = EventoWriteInput & {
    id: number;
    banner?: File | null;
    removerBanner: boolean;
    updatedBySysUsuarioId: number;
};

type EventoStatus =
    | "ativo"
    | "inativo"
    | "oculto"
    | "agendado"
    | "encerrado";

function normalizeOptional(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

function validateExternalUrl(url?: string | null) {
    const normalized = normalizeOptional(url);

    if (!normalized) {
        return null;
    }

    let parsed: URL;

    try {
        parsed = new URL(normalized);
    } catch {
        throw new Error("Informe uma URL externa válida.");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("A URL do evento precisa começar com http:// ou https://.");
    }

    return parsed.toString();
}

function validateEventoInput(input: EventoWriteInput) {
    if (input.titulo.trim().length < 2) {
        throw new Error("Informe o título do evento.");
    }

    if (!Number.isInteger(input.ordem) || input.ordem < 0) {
        throw new Error("Informe uma ordem válida.");
    }

    if (
        input.inicioExibicao &&
        input.fimExibicao &&
        input.fimExibicao < input.inicioExibicao
    ) {
        throw new Error(
            "O fim da exibição não pode ser anterior ao início.",
        );
    }

    validateExternalUrl(input.url);
}

function getEventoStatus(evento: {
    ativo: number;
    visivel_publico: number;
    inicio_exibicao: Date | null;
    fim_exibicao: Date | null;
}): EventoStatus {
    const now = new Date();

    if (!evento.ativo) return "inativo";
    if (!evento.visivel_publico) return "oculto";

    if (
        evento.inicio_exibicao &&
        evento.inicio_exibicao > now
    ) {
        return "agendado";
    }

    if (
        evento.fim_exibicao &&
        evento.fim_exibicao < now
    ) {
        return "encerrado";
    }

    return "ativo";
}

const eventoSelect = {
    id: true,
    titulo: true,
    descricao: true,
    url: true,
    banner_sys_arquivo_id: true,
    evento_at: true,
    inicio_exibicao: true,
    fim_exibicao: true,
    ordem: true,
    destaque: true,
    ativo: true,
    visivel_publico: true,
    created_at: true,
    updated_at: true,

    banner_sys_arquivo: {
        select: {
            id: true,
            public_url: true,
            original_name: true,
        },
    },
};

function serializeEvento(evento: any) {
    return {
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        url: evento.url,
        banner_sys_arquivo_id:
        evento.banner_sys_arquivo_id,
        banner: evento.banner_sys_arquivo
            ? {
                sys_arquivo_id:
                evento.banner_sys_arquivo.id,
                public_url:
                evento.banner_sys_arquivo.public_url,
                original_name:
                evento.banner_sys_arquivo.original_name,
            }
            : null,
        evento_at: evento.evento_at,
        inicio_exibicao: evento.inicio_exibicao,
        fim_exibicao: evento.fim_exibicao,
        ordem: evento.ordem,
        destaque: evento.destaque,
        ativo: evento.ativo,
        visivel_publico: evento.visivel_publico,
        created_at: evento.created_at,
        updated_at: evento.updated_at,
        status: getEventoStatus(evento),
    };
}

class EventoService {
    async listAdminData() {
        const eventos = await prisma.cadEvento.findMany({
            where: {
                deleted_at: null,
            },
            select: eventoSelect,
            orderBy: [
                { ativo: "desc" },
                { ordem: "asc" },
                { evento_at: "desc" },
                { id: "desc" },
            ],
        });

        return {
            eventos: eventos.map(serializeEvento),
        };
    }

    async create(input: CreateEventoInput) {
        validateEventoInput(input);

        const url = validateExternalUrl(input.url);

        const evento = await prisma.cadEvento.create({
            data: {
                titulo: input.titulo.trim(),
                descricao:
                    normalizeOptional(input.descricao),
                url,
                evento_at: input.eventoAt ?? null,
                inicio_exibicao:
                    input.inicioExibicao ?? null,
                fim_exibicao:
                    input.fimExibicao ?? null,
                ordem: input.ordem,
                destaque: input.destaque ? 1 : 0,
                ativo: input.ativo ? 1 : 0,
                visivel_publico:
                    input.visivelPublico ? 1 : 0,
                created_at: new Date(),
                updated_at: new Date(),
            },
            select: {
                id: true,
            },
        });

        let novoArquivoId: number | null = null;

        try {
            if (input.banner) {
                const upload =
                    await arquivoService.uploadPublicImage({
                        file: input.banner,
                        folder: `eventos/${evento.id}`,
                        filenamePrefix: "evento-banner",
                        tipoCodigo: "evento_banner",
                        createdBySysUsuarioId:
                        input.createdBySysUsuarioId,
                    });

                novoArquivoId = upload.arquivo.id;

                await prisma.cadEvento.update({
                    where: {
                        id: evento.id,
                    },
                    data: {
                        banner_sys_arquivo_id:
                        novoArquivoId,
                        updated_at: new Date(),
                    },
                });
            }

            return this.findById(evento.id);
        } catch (error) {
            if (novoArquivoId) {
                await arquivoService.marcarComoRemovido({
                    arquivoId: novoArquivoId,
                });
            }

            await prisma.cadEvento.delete({
                where: {
                    id: evento.id,
                },
            });

            throw error;
        }
    }

    async update(input: UpdateEventoInput) {
        validateEventoInput(input);

        const existente =
            await prisma.cadEvento.findFirst({
                where: {
                    id: input.id,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    banner_sys_arquivo_id: true,
                },
            });

        if (!existente) {
            throw new Error("Evento não encontrado.");
        }

        const url = validateExternalUrl(input.url);

        let novoArquivoId: number | null = null;

        try {
            if (input.banner) {
                const upload =
                    await arquivoService.uploadPublicImage({
                        file: input.banner,
                        folder: `eventos/${input.id}`,
                        filenamePrefix: "evento-banner",
                        tipoCodigo: "evento_banner",
                        createdBySysUsuarioId:
                        input.updatedBySysUsuarioId,
                    });

                novoArquivoId = upload.arquivo.id;
            }

            const deveRemoverBanner =
                input.removerBanner ||
                Boolean(novoArquivoId);

            await prisma.cadEvento.update({
                where: {
                    id: input.id,
                },
                data: {
                    titulo: input.titulo.trim(),
                    descricao:
                        normalizeOptional(
                            input.descricao,
                        ),
                    url,
                    evento_at:
                        input.eventoAt ?? null,
                    inicio_exibicao:
                        input.inicioExibicao ?? null,
                    fim_exibicao:
                        input.fimExibicao ?? null,
                    ordem: input.ordem,
                    destaque:
                        input.destaque ? 1 : 0,
                    ativo:
                        input.ativo ? 1 : 0,
                    visivel_publico:
                        input.visivelPublico ? 1 : 0,
                    banner_sys_arquivo_id:
                        novoArquivoId ??
                        (input.removerBanner
                            ? null
                            : existente.banner_sys_arquivo_id),
                    updated_at: new Date(),
                },
            });

            if (
                deveRemoverBanner &&
                existente.banner_sys_arquivo_id &&
                existente.banner_sys_arquivo_id !==
                novoArquivoId
            ) {
                await arquivoService.marcarComoRemovido({
                    arquivoId:
                    existente.banner_sys_arquivo_id,
                });
            }

            return this.findById(input.id);
        } catch (error) {
            if (novoArquivoId) {
                await arquivoService.marcarComoRemovido({
                    arquivoId: novoArquivoId,
                });
            }

            throw error;
        }
    }

    async setAtivo(
        id: number,
        ativo: boolean,
    ) {
        const existente =
            await prisma.cadEvento.findFirst({
                where: {
                    id,
                    deleted_at: null,
                },
                select: {
                    id: true,
                },
            });

        if (!existente) {
            throw new Error("Evento não encontrado.");
        }

        await prisma.cadEvento.update({
            where: {
                id,
            },
            data: {
                ativo: ativo ? 1 : 0,
                updated_at: new Date(),
            },
        });

        return this.findById(id);
    }

    async softDelete(id: number) {
        const existente =
            await prisma.cadEvento.findFirst({
                where: {
                    id,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    banner_sys_arquivo_id: true,
                },
            });

        if (!existente) {
            throw new Error("Evento não encontrado.");
        }

        const now = new Date();

        await prisma.cadEvento.update({
            where: {
                id,
            },
            data: {
                ativo: 0,
                visivel_publico: 0,
                deleted_at: now,
                updated_at: now,
            },
        });

        if (existente.banner_sys_arquivo_id) {
            await arquivoService.marcarComoRemovido({
                arquivoId:
                existente.banner_sys_arquivo_id,
            });
        }

        return {
            id,
        };
    }

    async findById(id: number) {
        const evento =
            await prisma.cadEvento.findFirst({
                where: {
                    id,
                    deleted_at: null,
                },
                select: eventoSelect,
            });

        return evento
            ? serializeEvento(evento)
            : null;
    }
}

export const eventoService =
    new EventoService();
