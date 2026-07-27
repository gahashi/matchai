import { prisma } from "@/lib/prisma";
import {
    normalizarCriarAtleticaIds,
    parseCriarAtleticaPayload,
} from "@/lib/ent/atletica/solicitacao-criar-atletica-payload";


type ResolverDetalheCriarAtleticaInput = {
    payload: unknown;
};

export const solicitacaoCriarAtleticaDetalheService = {
    async resolver({
                       payload,
                   }: ResolverDetalheCriarAtleticaInput) {
        const dados = parseCriarAtleticaPayload(payload);

        if (!dados?.atletica) {
            return null;
        }

        const instituicaoId = Number(
            dados.atletica.instituicaoId
        );

        const polosPayload = Array.isArray(
            dados.atletica.polos
        )
            ? dados.atletica.polos
            : [];

        const poloIds =
            normalizarCriarAtleticaIds(
                polosPayload.map(
                    (polo) => polo.id
                )
            );

        const cursoIds =
            normalizarCriarAtleticaIds(
                dados.atletica.cursoIds
            );


        
        const [instituicao, polos, cursos] =
            await Promise.all([
                Number.isInteger(instituicaoId) &&
                instituicaoId > 0
                    ? prisma.eduInstituicao.findFirst({
                        where: {
                            id: instituicaoId,
                            deleted_at: null,
                        },
                        select: {
                            id: true,
                            nome: true,
                            abreviacao: true,
                            cidade: true,
                            estado: true,
                        },
                    })
                    : null,

                poloIds.length > 0
                    ? prisma.eduPolo.findMany({
                        where: {
                            id: {
                                in: poloIds,
                            },
                            deleted_at: null,
                        },
                        select: {
                            id: true,
                            codigo: true,
                            nome: true,
                            cidade: true,
                            estado: true,
                        },
                    })
                    : [],

                cursoIds.length > 0
                    ? prisma.eduCurso.findMany({
                        where: {
                            id: {
                                in: cursoIds,
                            },
                            deleted_at: null,
                        },
                        select: {
                            id: true,
                            nome: true,
                            abreviacao: true,
                        },
                    })
                    : [],
            ]);

        const poloPrincipalId =
            polosPayload.find(
                (polo) => polo.principal === true
            )?.id ?? null;

        return {
            tipoCodigo: "criar_atletica" as const,

            atletica: {
                nome:
                    dados.atletica.nome?.trim() ||
                    "Não informado",
                apelido:
                    dados.atletica.apelido?.trim() ||
                    "Não informado",
                sigla:
                    dados.atletica.sigla?.trim() ||
                    "Não informado",
                slug:
                    dados.atletica.slug?.trim() ||
                    "Não informado",
                mascote:
                    dados.atletica.mascote?.trim() ||
                    "Não informado",
                descricao:
                    dados.atletica.descricao ?? null,
            },

            instituicao: instituicao
                ? {
                    id: instituicao.id,
                    nome: instituicao.nome,
                    abreviacao:
                    instituicao.abreviacao,
                    cidade: instituicao.cidade,
                    estado: instituicao.estado,
                }
                : null,

            polos: poloIds.map((poloId) => {
                const polo = polos.find(
                    (item) => item.id === poloId
                );

                return {
                    id: poloId,
                    nome:
                        polo?.nome ??
                        `Polo #${poloId}`,
                    codigo: polo?.codigo ?? null,
                    cidade: polo?.cidade ?? null,
                    estado: polo?.estado ?? null,
                    principal:
                        poloId === poloPrincipalId,
                };
            }),

            cursos: cursoIds.map((cursoId) => {
                const curso = cursos.find(
                    (item) => item.id === cursoId
                );

                return {
                    id: cursoId,
                    nome:
                        curso?.nome ??
                        `Curso #${cursoId}`,
                    abreviacao:
                        curso?.abreviacao ?? null,
                };
            }),

            gestao: {
                nome:
                    dados.gestao?.nome?.trim() ||
                    "Não informado",
                inicioAt:
                    dados.gestao?.inicioAt ?? null,
                fimAt:
                    dados.gestao?.fimAt ?? null,
                observacao:
                    dados.gestao?.observacao ?? null,
            },
        };
    },
};