"use client";

import {
    ChangeEvent,
    FormEvent,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    CalendarClock,
    ImagePlus,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Tags,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import {
    Badge,
} from "@/components/ui/Badge";

import {
    Button,
} from "@/components/ui/Button";

import {
    EmptyState,
} from "@/components/ui/EmptyState";

import {
    Input,
} from "@/components/ui/Input";

import {
    Modal,
} from "@/components/ui/Modal";

import {
    SelectMenu,
} from "@/components/ui/SelectMenu";

import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";

import {
    Table,
} from "@/components/ui/Table";

import {
    Textarea,
} from "@/components/ui/Textarea";


export type PromocaoItemImagem = {
    sys_arquivo_id: number;
    public_url: string | null;
    original_name: string;
};


export type PromocaoHorario = {
    id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
};


export type Promocao = {
    id: number;

    titulo: string;
    descricao: string | null;

    preco_promocional:
        number | null;

    validade_inicio:
        string | null;

    validade_fim:
        string | null;

    ordem: number;
    ativo: number;
    exibir_tv: number;

    imagem:
        PromocaoItemImagem |
        null;

    imagem_efetiva_url:
        string | null;

    itens: Array<{
        id: number;
        ordem: number;

        item: {
            id: number;
            nome: string;
            preco: number;
            ativo: number;
            removido: boolean;
            imagem_url: string | null;

            categoria: {
                id: number;
                nome: string;
            };
        };
    }>;

    horarios:
        PromocaoHorario[];

    created_at?:
        string |
        Date |
        null;

    updated_at?:
        string |
        Date |
        null;
};


export type PromocaoCardapioItem = {
    id: number;

    nome: string;
    preco: number;
    ativo: number;

    categoria: {
        id: number;
        nome: string;
        ativo: number;
    };

    imagem: {
        public_url: string | null;
    } | null;
};


type Props = {
    parceiroId: number;
    itens: PromocaoCardapioItem[];
    initialPromocoes: Promocao[];
};


type PromocaoFormHorario = {
    key: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fim: string;
};


type PromocaoForm = {
    titulo: string;
    descricao: string;

    preco_promocional:
        string;

    validade_inicio:
        string;

    validade_fim:
        string;

    ordem:
        string;

    ativo:
        boolean;

    exibir_tv:
        boolean;

    item_ids:
        number[];

    horarios:
        PromocaoFormHorario[];
};


type PromocaoVisualStatus =
    | "inativa"
    | "fora_tv"
    | "agendada"
    | "encerrada"
    | "exibindo"
    | "fora_horario";


const diasSemana = [
    {
        value: "0",
        label: "Domingo",
    },
    {
        value: "1",
        label: "Segunda-feira",
    },
    {
        value: "2",
        label: "Terça-feira",
    },
    {
        value: "3",
        label: "Quarta-feira",
    },
    {
        value: "4",
        label: "Quinta-feira",
    },
    {
        value: "5",
        label: "Sexta-feira",
    },
    {
        value: "6",
        label: "Sábado",
    },
];


const emptyPromocaoForm: PromocaoForm = {
    titulo: "",
    descricao: "",

    preco_promocional:
        "",

    validade_inicio:
        "",

    validade_fim:
        "",

    ordem:
        "0",

    ativo:
        true,

    exibir_tv:
        true,

    item_ids:
        [],

    horarios:
        [],
};


function money(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL",
        },
    ).format(
        value,
    );
}


function parseMoneyInput(
    value: string,
) {
    const normalized =
        value
            .trim()
            .replace(
                /\./g,
                "",
            )
            .replace(
                ",",
                ".",
            );

    return Number(
        normalized,
    );
}


function dateValue(
    value:
        string |
        null,
) {
    return value ??
        "";
}


function promocaoToForm(
    promocao: Promocao,
): PromocaoForm {
    return {
        titulo:
            promocao.titulo,

        descricao:
            promocao.descricao ??
            "",

        preco_promocional:
            promocao
                .preco_promocional ===
                null
                ? ""
                : promocao
                    .preco_promocional
                    .toFixed(
                        2,
                    )
                    .replace(
                        ".",
                        ",",
                    ),

        validade_inicio:
            dateValue(
                promocao
                    .validade_inicio,
            ),

        validade_fim:
            dateValue(
                promocao
                    .validade_fim,
            ),

        ordem:
            String(
                promocao.ordem,
            ),

        ativo:
            Boolean(
                promocao.ativo,
            ),

        exibir_tv:
            Boolean(
                promocao
                    .exibir_tv,
            ),

        item_ids:
            promocao
                .itens
                .filter(
                    (
                        vinculo,
                    ) =>
                        !vinculo
                            .item
                            .removido,
                )
                .map(
                    (
                        vinculo,
                    ) =>
                        vinculo
                            .item
                            .id,
                ),

        horarios:
            promocao
                .horarios
                .map(
                    (
                        horario,
                    ) => ({
                        key:
                            horario.id,

                        dia_semana:
                            String(
                                horario
                                    .dia_semana,
                            ),

                        hora_inicio:
                            horario
                                .hora_inicio,

                        hora_fim:
                            horario
                                .hora_fim,
                    }),
                ),
    };
}


function dayLabel(
    diaSemana:
        number,
) {
    return (
        diasSemana.find(
            (
                dia,
            ) =>
                Number(
                    dia.value,
                ) ===
                diaSemana,
        )
            ?.label ??
        "Dia inválido"
    );
}


function horarioResumo(
    horario:
        PromocaoHorario,
) {
    return `${dayLabel(
        horario.dia_semana,
    )} ${horario.hora_inicio}–${horario.hora_fim}`;
}


function timeToMinutes(
    value:
        string,
) {
    const [
        hourValue,
        minuteValue,
    ] =
        value
            .split(":")
            .map(
                Number,
            );

    return (
        hourValue *
        60
    ) +
        minuteValue;
}


function getSaoPauloNow() {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Sao_Paulo",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hourCycle:
                    "h23",

                weekday:
                    "short",
            },
        )
            .formatToParts(
                new Date(),
            );

    const values =
        Object.fromEntries(
            parts.map(
                (
                    part,
                ) => [
                    part.type,
                    part.value,
                ],
            ),
        );

    const weekdays:
        Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    return {
        date:
            `${values.year}-${values.month}-${values.day}`,

        weekday:
            weekdays[
                values.weekday
            ],

        minuteOfDay:
            Number(
                values.hour,
            ) *
            60 +
            Number(
                values.minute,
            ),
    };
}


function horarioEstaAtivo(
    horario:
        PromocaoHorario,

    now:
        ReturnType<
            typeof getSaoPauloNow
        >,
) {
    const inicio =
        timeToMinutes(
            horario
                .hora_inicio,
        );

    const fim =
        timeToMinutes(
            horario
                .hora_fim,
        );

    if (
        inicio <
        fim
    ) {
        return (
            now.weekday ===
            horario.dia_semana &&
            now.minuteOfDay >=
            inicio &&
            now.minuteOfDay <
            fim
        );
    }

    const diaSeguinte =
        (
            horario.dia_semana +
            1
        ) %
        7;

    return (
        (
            now.weekday ===
            horario.dia_semana &&
            now.minuteOfDay >=
            inicio
        ) ||
        (
            now.weekday ===
            diaSeguinte &&
            now.minuteOfDay <
            fim
        )
    );
}


function getPromocaoStatus(
    promocao:
        Promocao,
): PromocaoVisualStatus {
    if (
        !promocao.ativo
    ) {
        return "inativa";
    }

    if (
        !promocao.exibir_tv
    ) {
        return "fora_tv";
    }

    const now =
        getSaoPauloNow();

    if (
        promocao
            .validade_inicio &&
        promocao
            .validade_inicio >
        now.date
    ) {
        return "agendada";
    }

    if (
        promocao
            .validade_fim &&
        promocao
            .validade_fim <
        now.date
    ) {
        return "encerrada";
    }

    if (
        promocao
            .horarios
            .some(
                (
                    horario,
                ) =>
                    horarioEstaAtivo(
                        horario,
                        now,
                    ),
            )
    ) {
        return "exibindo";
    }

    return "fora_horario";
}


function statusBadge(
    status:
        PromocaoVisualStatus,
) {
    switch (
        status
    ) {
        case "exibindo":
            return {
                label:
                    "Exibindo agora",

                color:
                    "success" as const,
            };

        case "agendada":
            return {
                label:
                    "Agendada",

                color:
                    "info" as const,
            };

        case "encerrada":
            return {
                label:
                    "Encerrada",

                color:
                    "warning" as const,
            };

        case "fora_tv":
            return {
                label:
                    "Fora da TV",

                color:
                    "secondary" as const,
            };

        case "fora_horario":
            return {
                label:
                    "Fora do horário",

                color:
                    "secondary" as const,
            };

        case "inativa":
        default:
            return {
                label:
                    "Inativa",

                color:
                    "danger" as const,
            };
    }
}


export function ParceiroPromocoesSection({
    parceiroId,
    itens,
    initialPromocoes,
}: Props) {
    const apiBase =
        `/api/parceiro/${parceiroId}/cardapio/promocoes`;

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const nextHorarioKey =
        useRef(
            1,
        );

    const [
        promocoes,
        setPromocoes,
    ] =
        useState(
            initialPromocoes,
        );

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(false);

    const [
        editingPromocao,
        setEditingPromocao,
    ] =
        useState<Promocao | null>(
            null,
        );

    const [
        form,
        setForm,
    ] =
        useState<PromocaoForm>(
            emptyPromocaoForm,
        );

    const [
        imagemFile,
        setImagemFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        imagemPreview,
        setImagemPreview,
    ] =
        useState<string | null>(
            null,
        );

    const [
        removerImagem,
        setRemoverImagem,
    ] =
        useState(false);

    const [
        salvando,
        setSalvando,
    ] =
        useState(false);

    const [
        alterandoId,
        setAlterandoId,
    ] =
        useState<number | null>(
            null,
        );

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<SnackbarState | null>(
            null,
        );


    const itensDisponiveis =
        useMemo(
            () =>
                itens.filter(
                    (
                        item,
                    ) =>
                        Boolean(
                            item.ativo,
                        ) ||
                        form
                            .item_ids
                            .includes(
                                item.id,
                            ),
                ),
            [
                form.item_ids,
                itens,
            ],
        );


    function updateForm<
        K extends keyof PromocaoForm,
    >(
        key: K,
        value: PromocaoForm[K],
    ) {
        setForm(
            (
                current,
            ) => ({
                ...current,

                [key]:
                    value,
            }),
        );
    }


    function limparImagemNova() {
        if (
            imagemPreview
        ) {
            URL.revokeObjectURL(
                imagemPreview,
            );
        }

        setImagemFile(
            null,
        );

        setImagemPreview(
            null,
        );

        if (
            fileInputRef.current
        ) {
            fileInputRef
                .current
                .value =
                "";
        }
    }


    function resetModal() {
        limparImagemNova();

        setModalOpen(
            false,
        );

        setEditingPromocao(
            null,
        );

        setForm(
            emptyPromocaoForm,
        );

        setRemoverImagem(
            false,
        );
    }


    function fecharModal() {
        if (
            salvando
        ) {
            return;
        }

        resetModal();
    }


    function abrirCriar() {
        const primeiroItem =
            itens.find(
                (
                    item,
                ) =>
                    Boolean(
                        item.ativo,
                    ),
            );

        if (
            !primeiroItem
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Nenhum item ativo",

                message:
                    "Ative ou cadastre pelo menos um item do cardápio antes de criar uma promoção.",
            });

            return;
        }

        limparImagemNova();

        setEditingPromocao(
            null,
        );

        setRemoverImagem(
            false,
        );

        setForm({
            ...emptyPromocaoForm,

            ordem:
                String(
                    promocoes.length,
                ),

            item_ids: [
                primeiroItem.id,
            ],
        });

        setModalOpen(
            true,
        );

        setSnackbar(
            null,
        );
    }


    function abrirEditar(
        promocao:
            Promocao,
    ) {
        limparImagemNova();

        setEditingPromocao(
            promocao,
        );

        setRemoverImagem(
            false,
        );

        setForm(
            promocaoToForm(
                promocao,
            ),
        );

        setModalOpen(
            true,
        );

        setSnackbar(
            null,
        );
    }


    function handleImagemChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event
                .target
                .files?.[0];

        event.target.value =
            "";

        if (
            !file
        ) {
            return;
        }

        if (
            !file.type.startsWith(
                "image/",
            )
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Imagem inválida",

                message:
                    "Selecione uma imagem válida.",
            });

            return;
        }

        if (
            file.size >
            5 *
            1024 *
            1024
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Imagem muito grande",

                message:
                    "A imagem ultrapassa o limite de 5MB.",
            });

            return;
        }

        limparImagemNova();

        setImagemFile(
            file,
        );

        setImagemPreview(
            URL.createObjectURL(
                file,
            ),
        );

        setRemoverImagem(
            false,
        );
    }


    function toggleItem(
        itemId:
            number,
    ) {
        setForm(
            (
                current,
            ) => {
                const selected =
                    current
                        .item_ids
                        .includes(
                            itemId,
                        );

                return {
                    ...current,

                    item_ids:
                        selected
                            ? current
                                .item_ids
                                .filter(
                                    (
                                        id,
                                    ) =>
                                        id !==
                                        itemId,
                                )
                            : [
                                ...current
                                    .item_ids,
                                itemId,
                            ],
                };
            },
        );
    }


    function adicionarHorario() {
        const key =
            nextHorarioKey
                .current++;

        setForm(
            (
                current,
            ) => ({
                ...current,

                horarios: [
                    ...current
                        .horarios,

                    {
                        key:
                            -key,

                        dia_semana:
                            "5",

                        hora_inicio:
                            "17:00",

                        hora_fim:
                            "00:00",
                    },
                ],
            }),
        );
    }


    function removerHorario(
        key:
            number,
    ) {
        setForm(
            (
                current,
            ) => ({
                ...current,

                horarios:
                    current
                        .horarios
                        .filter(
                            (
                                horario,
                            ) =>
                                horario.key !==
                                key,
                        ),
            }),
        );
    }


    function updateHorario(
        key:
            number,

        field:
            "dia_semana" |
            "hora_inicio" |
            "hora_fim",

        value:
            string,
    ) {
        setForm(
            (
                current,
            ) => ({
                ...current,

                horarios:
                    current
                        .horarios
                        .map(
                            (
                                horario,
                            ) =>
                                horario.key ===
                                key
                                    ? {
                                        ...horario,

                                        [field]:
                                            value,
                                    }
                                    : horario,
                        ),
            }),
        );
    }


    const imagemAtual =
        imagemPreview ??
        (
            !removerImagem
                ? editingPromocao
                    ?.imagem
                    ?.public_url ??
                editingPromocao
                    ?.imagem_efetiva_url ??
                null
                : null
        );


    function buildFormData() {
        const payload =
            new FormData();

        payload.set(
            "titulo",
            form.titulo,
        );

        payload.set(
            "descricao",
            form.descricao,
        );

        payload.set(
            "preco_promocional",
            form
                .preco_promocional
                .trim()
                ? String(
                    parseMoneyInput(
                        form
                            .preco_promocional,
                    ),
                )
                : "",
        );

        payload.set(
            "validade_inicio",
            form
                .validade_inicio,
        );

        payload.set(
            "validade_fim",
            form
                .validade_fim,
        );

        payload.set(
            "ordem",
            form.ordem,
        );

        payload.set(
            "ativo",
            form.ativo
                ? "1"
                : "0",
        );

        payload.set(
            "exibir_tv",
            form.exibir_tv
                ? "1"
                : "0",
        );

        payload.set(
            "item_ids",
            JSON.stringify(
                form.item_ids,
            ),
        );

        payload.set(
            "horarios",
            JSON.stringify(
                form
                    .horarios
                    .map(
                        (
                            horario,
                        ) => ({
                            dia_semana:
                                Number(
                                    horario
                                        .dia_semana,
                                ),

                            hora_inicio:
                                horario
                                    .hora_inicio,

                            hora_fim:
                                horario
                                    .hora_fim,
                        }),
                    ),
            ),
        );

        payload.set(
            "remover_imagem",
            removerImagem
                ? "1"
                : "0",
        );

        if (
            imagemFile
        ) {
            payload.set(
                "imagem",
                imagemFile,
            );
        }

        return payload;
    }


    async function salvar(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            form
                .titulo
                .trim()
                .length <
            2
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Título obrigatório",

                message:
                    "Informe o título da promoção.",
            });

            return;
        }

        if (
            form
                .item_ids
                .length ===
            0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Itens obrigatórios",

                message:
                    "Selecione pelo menos um item do cardápio.",
            });

            return;
        }

        if (
            form
                .horarios
                .length ===
            0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Horário obrigatório",

                message:
                    "Cadastre pelo menos um dia e intervalo de horário.",
            });

            return;
        }

        const horarioIncompleto =
            form
                .horarios
                .some(
                    (
                        horario,
                    ) =>
                        horario
                            .dia_semana ===
                            "" ||
                        !horario
                            .hora_inicio ||
                        !horario
                            .hora_fim,
                );

        if (
            horarioIncompleto
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Horários incompletos",

                message:
                    "Preencha o dia, início e fim de todos os horários.",
            });

            return;
        }

        if (
            form
                .validade_inicio &&
            form
                .validade_fim &&
            form
                .validade_fim <
            form
                .validade_inicio
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Validade inválida",

                message:
                    "A data final não pode ser anterior à data inicial.",
            });

            return;
        }

        const ordem =
            Number(
                form.ordem,
            );

        if (
            !Number.isInteger(
                ordem,
            ) ||
            ordem <
            0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Ordem inválida",

                message:
                    "A ordem deve ser um número inteiro igual ou maior que zero.",
            });

            return;
        }

        if (
            form
                .preco_promocional
                .trim()
        ) {
            const preco =
                parseMoneyInput(
                    form
                        .preco_promocional,
                );

            if (
                !Number.isFinite(
                    preco,
                ) ||
                preco <
                0
            ) {
                setSnackbar({
                    color:
                        "warning",

                    title:
                        "Preço inválido",

                    message:
                        "Informe um preço promocional válido.",
                });

                return;
            }
        }

        try {
            setSalvando(
                true,
            );

            setSnackbar(
                null,
            );

            const isEditing =
                Boolean(
                    editingPromocao,
                );

            const response =
                await fetch(
                    isEditing
                        ? `${apiBase}/${editingPromocao!.id}`
                        : apiBase,
                    {
                        method:
                            isEditing
                                ? "PATCH"
                                : "POST",

                        body:
                            buildFormData(),
                    },
                );

            const result =
                await response
                    .json();

            if (
                !response.ok ||
                !result.ok ||
                !result
                    .data
                    ?.promocao
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar a promoção.",
                );
            }

            const promocao =
                result
                    .data
                    .promocao as Promocao;

            setPromocoes(
                (
                    current,
                ) => {
                    const exists =
                        current.some(
                            (
                                item,
                            ) =>
                                item.id ===
                                promocao.id,
                        );

                    const next =
                        exists
                            ? current.map(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    promocao.id
                                        ? promocao
                                        : item,
                            )
                            : [
                                ...current,
                                promocao,
                            ];

                    return [...next]
                        .sort(
                            (
                                a,
                                b,
                            ) =>
                                Number(
                                    Boolean(
                                        b.ativo,
                                    ),
                                ) -
                                Number(
                                    Boolean(
                                        a.ativo,
                                    ),
                                ) ||
                                a.ordem -
                                b.ordem ||
                                a.titulo.localeCompare(
                                    b.titulo,
                                    "pt-BR",
                                ) ||
                                a.id -
                                b.id,
                        );
                },
            );

            resetModal();

            setSnackbar({
                color:
                    "success",

                title:
                    isEditing
                        ? "Promoção atualizada"
                        : "Promoção criada",

                message:
                    result.message,
            });
        } catch (
            error
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao salvar promoção",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar a promoção.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(
                false,
            );
        }
    }


    async function alternarAtivo(
        promocao:
            Promocao,
    ) {
        try {
            setAlterandoId(
                promocao.id,
            );

            const novoAtivo =
                !Boolean(
                    promocao.ativo,
                );

            const response =
                await fetch(
                    `${apiBase}/${promocao.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "set_ativo",

                                ativo:
                                    novoAtivo,
                            }),
                    },
                );

            const result =
                await response
                    .json();

            if (
                !response.ok ||
                !result.ok ||
                !result
                    .data
                    ?.promocao
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível alterar a promoção.",
                );
            }

            const atualizada =
                result
                    .data
                    .promocao as Promocao;

            setPromocoes(
                (
                    current,
                ) =>
                    current.map(
                        (
                            item,
                        ) =>
                            item.id ===
                            atualizada.id
                                ? atualizada
                                : item,
                    ),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    novoAtivo
                        ? "Promoção ativada"
                        : "Promoção desativada",

                message:
                    result.message,
            });
        } catch (
            error
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar promoção",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar a promoção.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoId(
                null,
            );
        }
    }


    async function excluir(
        promocao:
            Promocao,
    ) {
        if (
            !window.confirm(
                `Excluir a promoção "${promocao.titulo}"?`,
            )
        ) {
            return;
        }

        try {
            setAlterandoId(
                promocao.id,
            );

            const response =
                await fetch(
                    `${apiBase}/${promocao.id}`,
                    {
                        method:
                            "DELETE",
                    },
                );

            const result =
                await response
                    .json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível excluir a promoção.",
                );
            }

            setPromocoes(
                (
                    current,
                ) =>
                    current.filter(
                        (
                            item,
                        ) =>
                            item.id !==
                            promocao.id,
                    ),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Promoção excluída",

                message:
                    result.message,
            });
        } catch (
            error
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao excluir promoção",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir a promoção.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoId(
                null,
            );
        }
    }


    return (
        <>
            <section
                style={{
                    marginTop:
                        32,
                }}
            >
                <div
                    style={{
                        display:
                            "flex",

                        justifyContent:
                            "space-between",

                        alignItems:
                            "flex-end",

                        gap:
                            12,

                        marginBottom:
                            14,

                        flexWrap:
                            "wrap",
                    }}
                >
                    <div>
                        <h2 className="bp-section-title">
                            Promoções
                        </h2>

                        <p className="bp-section-subtitle">
                            Programe ofertas dos itens do cardápio e escolha quando elas entram na TV.
                        </p>
                    </div>

                    <div
                        style={{
                            display:
                                "flex",

                            gap:
                                8,

                            alignItems:
                                "center",

                            flexWrap:
                                "wrap",
                        }}
                    >
                        <Badge color="secondary">
                            {promocoes.length} promoção(ões)
                        </Badge>

                        <Button
                            onClick={
                                abrirCriar
                            }
                        >
                            <Plus
                                size={17}
                            />

                            Nova promoção
                        </Button>
                    </div>
                </div>


                {promocoes.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <Tags
                                size={24}
                            />
                        }
                        title="Nenhuma promoção cadastrada"
                        description="Crie uma promoção, vincule os itens e defina os dias e horários de exibição."
                        action={
                            <Button
                                onClick={
                                    abrirCriar
                                }
                            >
                                <Plus
                                    size={17}
                                />

                                Criar promoção
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <Table
                            headers={[
                                "Promoção",
                                "Itens",
                                "Agenda",
                                "TV",
                                "Status",
                                "Ações",
                            ]}
                        >
                            {promocoes.map(
                                (
                                    promocao,
                                ) => {
                                    const busy =
                                        alterandoId ===
                                        promocao.id;

                                    const status =
                                        statusBadge(
                                            getPromocaoStatus(
                                                promocao,
                                            ),
                                        );

                                    const itensAtuais =
                                        promocao
                                            .itens
                                            .filter(
                                                (
                                                    vinculo,
                                                ) =>
                                                    !vinculo
                                                        .item
                                                        .removido,
                                            );

                                    return (
                                        <tr
                                            key={
                                                promocao.id
                                            }
                                        >
                                            <td>
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            12,
                                                    }}
                                                >
                                                    <div className="bp-product-table-thumb">
                                                        {promocao.imagem_efetiva_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={
                                                                    promocao.imagem_efetiva_url
                                                                }
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <Tags
                                                                size={19}
                                                            />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                promocao.titulo
                                                            }
                                                        </strong>

                                                        {promocao.preco_promocional !==
                                                        null ? (
                                                            <div className="bp-product-table-meta">
                                                                Oferta:{" "}
                                                                {money(
                                                                    promocao.preco_promocional,
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        itensAtuais.length
                                                    }
                                                </strong>

                                                <div className="bp-product-table-meta">
                                                    {itensAtuais
                                                        .slice(
                                                            0,
                                                            2,
                                                        )
                                                        .map(
                                                            (
                                                                vinculo,
                                                            ) =>
                                                                vinculo
                                                                    .item
                                                                    .nome,
                                                        )
                                                        .join(
                                                            ", ",
                                                        )}

                                                    {itensAtuais.length >
                                                    2
                                                        ? ` +${itensAtuais.length - 2}`
                                                        : ""}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="bp-product-table-meta">
                                                    {promocao
                                                        .horarios
                                                        .slice(
                                                            0,
                                                            2,
                                                        )
                                                        .map(
                                                            horarioResumo,
                                                        )
                                                        .join(
                                                            " · ",
                                                        )}

                                                    {promocao.horarios.length >
                                                    2
                                                        ? ` +${promocao.horarios.length - 2}`
                                                        : ""}
                                                </div>
                                            </td>

                                            <td>
                                                <Badge
                                                    color={
                                                        promocao.exibir_tv
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                >
                                                    {promocao.exibir_tv
                                                        ? "Exibir"
                                                        : "Não exibir"}
                                                </Badge>
                                            </td>

                                            <td>
                                                <Badge
                                                    color={
                                                        status.color
                                                    }
                                                >
                                                    {
                                                        status.label
                                                    }
                                                </Badge>
                                            </td>

                                            <td>
                                                <div className="bp-product-row-actions">
                                                    <Button
                                                        color={
                                                            promocao.ativo
                                                                ? "warning"
                                                                : "success"
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            alternarAtivo(
                                                                promocao,
                                                            )
                                                        }
                                                    >
                                                        {promocao.ativo ? (
                                                            <PowerOff
                                                                size={16}
                                                            />
                                                        ) : (
                                                            <Power
                                                                size={16}
                                                            />
                                                        )}

                                                        {promocao.ativo
                                                            ? "Desativar"
                                                            : "Ativar"}
                                                    </Button>

                                                    <Button
                                                        color="secondary"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            abrirEditar(
                                                                promocao,
                                                            )
                                                        }
                                                    >
                                                        <Pencil
                                                            size={16}
                                                        />

                                                        Editar
                                                    </Button>

                                                    <Button
                                                        color="danger"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            excluir(
                                                                promocao,
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            size={16}
                                                        />

                                                        Excluir
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                },
                            )}
                        </Table>


                        <div className="bp-product-admin-mobile-list">
                            {promocoes.map(
                                (
                                    promocao,
                                ) => {
                                    const busy =
                                        alterandoId ===
                                        promocao.id;

                                    const status =
                                        statusBadge(
                                            getPromocaoStatus(
                                                promocao,
                                            ),
                                        );

                                    return (
                                        <article
                                            key={
                                                promocao.id
                                            }
                                            className="bp-product-admin-mobile-card"
                                        >
                                            <div className="bp-product-admin-mobile-head">
                                                <div className="bp-product-admin-mobile-image">
                                                    {promocao.imagem_efetiva_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                promocao.imagem_efetiva_url
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <Tags
                                                            size={24}
                                                        />
                                                    )}
                                                </div>

                                                <div className="bp-product-admin-mobile-title">
                                                    <div className="bp-product-admin-mobile-title-row">
                                                        <strong>
                                                            {
                                                                promocao.titulo
                                                            }
                                                        </strong>

                                                        <Badge
                                                            color={
                                                                status.color
                                                            }
                                                        >
                                                            {
                                                                status.label
                                                            }
                                                        </Badge>
                                                    </div>

                                                    <span>
                                                        {
                                                            promocao
                                                                .itens
                                                                .filter(
                                                                    (
                                                                        vinculo,
                                                                    ) =>
                                                                        !vinculo
                                                                            .item
                                                                            .removido,
                                                                )
                                                                .length
                                                        }{" "}
                                                        item(ns)
                                                    </span>

                                                    <small>
                                                        TV:{" "}
                                                        {promocao.exibir_tv
                                                            ? "sim"
                                                            : "não"}
                                                    </small>
                                                </div>
                                            </div>

                                            {promocao.horarios.length >
                                            0 ? (
                                                <p className="bp-section-subtitle">
                                                    {promocao
                                                        .horarios
                                                        .slice(
                                                            0,
                                                            3,
                                                        )
                                                        .map(
                                                            horarioResumo,
                                                        )
                                                        .join(
                                                            " · ",
                                                        )}
                                                </p>
                                            ) : null}

                                            <div className="bp-product-admin-mobile-actions">
                                                <Button
                                                    color="secondary"
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        abrirEditar(
                                                            promocao,
                                                        )
                                                    }
                                                >
                                                    <Pencil
                                                        size={16}
                                                    />

                                                    Editar
                                                </Button>

                                                <Button
                                                    color={
                                                        promocao.ativo
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        alternarAtivo(
                                                            promocao,
                                                        )
                                                    }
                                                >
                                                    {promocao.ativo ? (
                                                        <PowerOff
                                                            size={16}
                                                        />
                                                    ) : (
                                                        <Power
                                                            size={16}
                                                        />
                                                    )}

                                                    {promocao.ativo
                                                        ? "Desativar"
                                                        : "Ativar"}
                                                </Button>

                                                <Button
                                                    color="danger"
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        excluir(
                                                            promocao,
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={16}
                                                    />

                                                    Excluir
                                                </Button>
                                            </div>
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    </>
                )}
            </section>


            <Modal
                open={
                    modalOpen
                }
                size="xl"
                title={
                    editingPromocao
                        ? "Editar promoção"
                        : "Nova promoção"
                }
                description="Escolha os itens, configure a oferta e defina quando ela poderá aparecer na TV."
                onCloseAction={
                    fecharModal
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            disabled={
                                salvando
                            }
                            onClick={
                                fecharModal
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="promocao-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar promoção"}
                        </Button>
                    </>
                }
            >
                <form
                    id="promocao-form"
                    onSubmit={
                        salvar
                    }
                >
                    <div className="bp-event-grid">
                        <Input
                            label="Título"
                            value={
                                form.titulo
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "titulo",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            maxLength={150}
                            placeholder="Ex.: Happy hour"
                            required
                        />

                        <Input
                            label="Preço da oferta"
                            value={
                                form
                                    .preco_promocional
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "preco_promocional",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            inputMode="decimal"
                            placeholder="Opcional. Ex.: 25,00"
                        />
                    </div>

                    <Textarea
                        label="Descrição"
                        value={
                            form.descricao
                        }
                        onChange={(
                            event,
                        ) =>
                            updateForm(
                                "descricao",
                                event
                                    .target
                                    .value,
                            )
                        }
                        rows={4}
                        placeholder="Ex.: 2 cervejas + porção de batata por R$ 25."
                    />


                    <div
                        style={{
                            marginTop:
                                20,
                        }}
                    >
                        <h3 className="bp-section-title">
                            Itens da promoção
                        </h3>

                        <p className="bp-section-subtitle">
                            Selecione um ou mais itens deste cardápio.
                        </p>

                        <div
                            style={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",

                                gap:
                                    10,

                                marginTop:
                                    12,
                            }}
                        >
                            {itensDisponiveis.map(
                                (
                                    item,
                                ) => {
                                    const selected =
                                        form
                                            .item_ids
                                            .includes(
                                                item.id,
                                            );

                                    return (
                                        <label
                                            key={
                                                item.id
                                            }
                                            style={{
                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                gap:
                                                    10,

                                                minWidth:
                                                    0,

                                                padding:
                                                    12,

                                                border:
                                                    selected
                                                        ? "1px solid var(--color-primary)"
                                                        : "1px solid var(--color-border)",

                                                borderRadius:
                                                    12,

                                                cursor:
                                                    "pointer",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selected
                                                }
                                                onChange={() =>
                                                    toggleItem(
                                                        item.id,
                                                    )
                                                }
                                            />

                                            <div
                                                style={{
                                                    minWidth:
                                                        0,
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        item.nome
                                                    }
                                                </strong>

                                                <div className="bp-product-table-meta">
                                                    {item.categoria.nome} ·{" "}
                                                    {money(
                                                        item.preco,
                                                    )}

                                                    {!item.ativo
                                                        ? " · inativo"
                                                        : ""}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                },
                            )}
                        </div>
                    </div>


                    <div
                        style={{
                            marginTop:
                                24,
                        }}
                    >
                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={
                                handleImagemChange
                            }
                        />

                        <div
                            style={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                gap:
                                    12,

                                marginBottom:
                                    10,
                            }}
                        >
                            <div>
                                <strong>
                                    Arte promocional
                                </strong>

                                <div className="bp-field-help">
                                    Opcional · máximo 5MB. Sem arte própria, será usada a imagem de um dos itens quando disponível.
                                </div>
                            </div>

                            <ImagePlus
                                size={20}
                            />
                        </div>

                        {imagemAtual ? (
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        imagemAtual
                                    }
                                    alt="Arte da promoção"
                                    style={{
                                        objectFit:
                                            "contain",
                                    }}
                                />

                                <div className="bp-event-banner-editor-actions">
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="soft"
                                        size="sm"
                                        onClick={() =>
                                            fileInputRef
                                                .current
                                                ?.click()
                                        }
                                    >
                                        <Upload
                                            size={15}
                                        />

                                        {editingPromocao?.imagem ||
                                        imagemFile
                                            ? "Trocar arte"
                                            : "Adicionar arte"}
                                    </Button>

                                    {editingPromocao?.imagem ||
                                    imagemFile ? (
                                        <Button
                                            type="button"
                                            color="danger"
                                            variant="soft"
                                            size="sm"
                                            onClick={() => {
                                                limparImagemNova();

                                                setRemoverImagem(
                                                    true,
                                                );
                                            }}
                                        >
                                            <X
                                                size={15}
                                            />

                                            Remover
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div
                                role="button"
                                tabIndex={0}
                                className="bp-product-dropzone"
                                onClick={() =>
                                    fileInputRef
                                        .current
                                        ?.click()
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter" ||
                                        event.key ===
                                        " "
                                    ) {
                                        event.preventDefault();

                                        fileInputRef
                                            .current
                                            ?.click();
                                    }
                                }}
                            >
                                <div className="bp-product-dropzone-content">
                                    <Upload
                                        size={25}
                                    />

                                    <strong>
                                        Selecionar arte
                                    </strong>

                                    <span>
                                        PNG, JPG ou WEBP.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>


                    <div
                        style={{
                            marginTop:
                                24,
                        }}
                    >
                        <h3 className="bp-section-title">
                            Validade
                        </h3>

                        <p className="bp-section-subtitle">
                            Opcional. Deixe vazio para uma promoção recorrente sem data final.
                        </p>

                        <div
                            className="bp-event-grid"
                            style={{
                                marginTop:
                                    12,
                            }}
                        >
                            <Input
                                label="Data inicial"
                                type="date"
                                value={
                                    form
                                        .validade_inicio
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "validade_inicio",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />

                            <Input
                                label="Data final"
                                type="date"
                                value={
                                    form
                                        .validade_fim
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "validade_fim",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />

                            <Input
                                label="Ordem"
                                type="number"
                                min="0"
                                step="1"
                                value={
                                    form.ordem
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "ordem",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                required
                            />
                        </div>
                    </div>


                    <div
                        style={{
                            marginTop:
                                24,
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "flex-end",

                                gap:
                                    12,

                                flexWrap:
                                    "wrap",
                            }}
                        >
                            <div>
                                <h3 className="bp-section-title">
                                    Dias e horários
                                </h3>

                                <p className="bp-section-subtitle">
                                    Adicione quantas janelas precisar. Um horário pode atravessar a meia-noite, como sexta 17:00 → 00:00.
                                </p>
                            </div>

                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                size="sm"
                                onClick={
                                    adicionarHorario
                                }
                            >
                                <CalendarClock
                                    size={16}
                                />

                                Adicionar horário
                            </Button>
                        </div>

                        {form.horarios.length ===
                        0 ? (
                            <div
                                className="bp-field-help"
                                style={{
                                    marginTop:
                                        12,
                                }}
                            >
                                Nenhum horário cadastrado.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display:
                                        "grid",

                                    gap:
                                        10,

                                    marginTop:
                                        12,
                                }}
                            >
                                {form.horarios.map(
                                    (
                                        horario,
                                    ) => (
                                        <div
                                            key={
                                                horario.key
                                            }
                                            style={{
                                                display:
                                                    "grid",

                                                gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(150px, 1fr))",

                                                gap:
                                                    10,

                                                alignItems:
                                                    "end",

                                                padding:
                                                    12,

                                                border:
                                                    "1px solid var(--color-border)",

                                                borderRadius:
                                                    12,
                                            }}
                                        >
                                            <SelectMenu
                                                label="Dia"
                                                options={
                                                    diasSemana
                                                }
                                                value={
                                                    horario
                                                        .dia_semana
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    updateHorario(
                                                        horario.key,
                                                        "dia_semana",
                                                        value,
                                                    )
                                                }
                                                placeholder="Selecione"
                                                required
                                            />

                                            <Input
                                                label="Início"
                                                type="time"
                                                value={
                                                    horario
                                                        .hora_inicio
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateHorario(
                                                        horario.key,
                                                        "hora_inicio",
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                required
                                            />

                                            <Input
                                                label="Fim"
                                                type="time"
                                                value={
                                                    horario
                                                        .hora_fim
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateHorario(
                                                        horario.key,
                                                        "hora_fim",
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                required
                                            />

                                            <Button
                                                type="button"
                                                color="danger"
                                                variant="ghost"
                                                onClick={() =>
                                                    removerHorario(
                                                        horario.key,
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />

                                                Remover
                                            </Button>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>


                    <div
                        style={{
                            display:
                                "grid",

                            gap:
                                10,

                            marginTop:
                                24,
                        }}
                    >
                        <label className="bp-check">
                            <input
                                type="checkbox"
                                checked={
                                    form.ativo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "ativo",
                                        event
                                            .target
                                            .checked,
                                    )
                                }
                            />

                            Promoção ativa
                        </label>

                        <label className="bp-check">
                            <input
                                type="checkbox"
                                checked={
                                    form
                                        .exibir_tv
                                }
                                onChange={(
                                    event,
                                ) =>
                                    updateForm(
                                        "exibir_tv",
                                        event
                                            .target
                                            .checked,
                                    )
                                }
                            />

                            Exibir na TV quando a promoção estiver dentro do dia, horário e validade
                        </label>
                    </div>
                </form>
            </Modal>


            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(
                            null,
                        )
                    }
                />
            ) : null}
        </>
    );
}
