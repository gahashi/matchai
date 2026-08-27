"use client";

import {
    ChangeEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    CalendarClock,
    Eye,
    ImagePlus,
    MonitorPlay,
    Pencil,
    Play,
    Plus,
    Power,
    PowerOff,
    Search,
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
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";

import {
    Textarea,
} from "@/components/ui/Textarea";

import type {
    TvCanal,
    TvDisponivelItem,
    TvHorarioInput,
    TvOrigem,
    TvProgramacaoData,
    TvProgramacaoItem,
    TvProgramacaoStatus,
} from "@/lib/tv/tv-programacao-service";


type Props = {
    mode:
        | "admin"
        | "parceiro";

    apiBase:
        string;

    initialData:
        TvProgramacaoData;

    parceiro?: {
        id: number;
        slug: string;
        nome: string;
    };

    canManage?: boolean;

    roleLabel?: string;
};


type FormHorario = {
    key: number;

    dia_semana: string;
    hora_inicio: string;
    hora_fim: string;
};


type FormState = {
    titulo: string;
    descricao: string;
    link: string;
    kicker: string;
    cor_destaque: string;
    duracao_segundos: string;

    ordem: string;
    ativo: boolean;

    inicio_exibicao: string;
    fim_exibicao: string;

    horarios: FormHorario[];
};


const emptyForm:
    FormState = {
    titulo:
        "",

    descricao:
        "",

    link:
        "",

    kicker:
        "",

    cor_destaque:
        "",

    duracao_segundos:
        "",

    ordem:
        "0",

    ativo:
        true,

    inicio_exibicao:
        "",

    fim_exibicao:
        "",

    horarios:
        [],
};


const diasSemana = [
    ["0", "Domingo"],
    ["1", "Segunda-feira"],
    ["2", "Terça-feira"],
    ["3", "Quarta-feira"],
    ["4", "Quinta-feira"],
    ["5", "Sexta-feira"],
    ["6", "Sábado"],
] as const;


function tipoLabel(
    tipo:
        TvOrigem,
) {
    switch (
        tipo
    ) {
        case "evento":
            return "Evento";

        case "promocao":
            return "Promoção";

        case "divulgacao":
        default:
            return "Divulgação";
    }
}


function statusInfo(
    status:
        TvProgramacaoStatus,
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

        case "programado":
            return {
                label:
                    "Programado",

                color:
                    "info" as const,
            };

        case "encerrado":
            return {
                label:
                    "Encerrado",

                color:
                    "warning" as const,
            };

        case "fora_horario":
            return {
                label:
                    "Fora do horário",

                color:
                    "secondary" as const,
            };

        case "inativo":
        default:
            return {
                label:
                    "Pausado",

                color:
                    "danger" as const,
            };
    }
}


function canalMatches(
    canal:
        TvCanal,

    parceiroId:
        number |
        null,
) {
    if (
        canal.tipo ===
        "geral"
    ) {
        return true;
    }

    if (
        canal.tipo ===
        "aaaccu"
    ) {
        return parceiroId ===
            null;
    }

    return parceiroId ===
        canal
            .parceiro_id;
}


function localInputValue(
    value:
        string |
        null,
) {
    if (
        !value
    ) {
        return "";
    }

    const date =
        new Date(
            value,
        );

    const parts =
        new Intl.DateTimeFormat(
            "sv-SE",
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
            },
        ).format(date);

    return parts.replace(
        " ",
        "T",
    );
}


function saoPauloIso(
    value:
        string,
) {
    if (
        !value
    ) {
        return null;
    }

    return new Date(
        `${value}:00-03:00`,
    ).toISOString();
}


function itemForm(
    item:
        TvProgramacaoItem,
): FormState {
    return {
        titulo:
            item
                .titulo_override ??
            "",

        descricao:
            item
                .descricao_override ??
            "",

        link:
            item
                .link_override ??
            "",

        kicker:
            item
                .kicker ??
            "",

        cor_destaque:
            item
                .cor_destaque ??
            "",

        duracao_segundos:
            item
                .duracao_segundos ===
            null
                ? ""
                : String(
                    item
                        .duracao_segundos,
                ),

        ordem:
            String(
                item.ordem,
            ),

        ativo:
            Boolean(
                item.ativo,
            ),

        inicio_exibicao:
            localInputValue(
                item
                    .inicio_exibicao,
            ),

        fim_exibicao:
            localInputValue(
                item
                    .fim_exibicao,
            ),

        horarios:
            item
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


function horarioResumo(
    item:
        TvProgramacaoItem,
) {
    if (
        item
            .horarios
            .length ===
        0
    ) {
        return "Sem restrição semanal da TV";
    }

    const resumo =
        item
            .horarios
            .slice(
                0,
                2,
            )
            .map(
                (
                    horario,
                ) => {
                    const dia =
                        diasSemana
                            .find(
                                (
                                    option,
                                ) =>
                                    Number(
                                        option[0],
                                    ) ===
                                    horario
                                        .dia_semana,
                            )
                            ?.[1] ??
                        "";

                    return `${dia} ${horario.hora_inicio}–${horario.hora_fim}`;
                },
            )
            .join(
                " · ",
            );

    return item
        .horarios
        .length >
        2
        ? `${resumo} +${item.horarios.length - 2}`
        : resumo;
}


function searchable(
    value:
        string |
        null |
        undefined,
) {
    return (
        value ??
        ""
    )
        .toLocaleLowerCase(
            "pt-BR",
        );
}


export function TvProgramacaoManager({
    mode,
    apiBase,
    initialData,
    parceiro,
    canManage = true,
    roleLabel,
}: Props) {
    const [
        data,
        setData,
    ] =
        useState(
            initialData,
        );

    const [
        selectedChannelKey,
        setSelectedChannelKey,
    ] =
        useState(
            mode ===
            "admin"
                ? "all"
                : initialData
                    .canais[0]
                    ?.key ??
                "",
        );

    const [
        busca,
        setBusca,
    ] =
        useState(
            "",
        );

    const [
        editing,
        setEditing,
    ] =
        useState<TvProgramacaoItem | null>(
            null,
        );

    const [
        creating,
        setCreating,
    ] =
        useState(
            false,
        );

    const [
        form,
        setForm,
    ] =
        useState<FormState>(
            emptyForm,
        );

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [
        midiaFile,
        setMidiaFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        midiaPreview,
        setMidiaPreview,
    ] =
        useState<string | null>(
            null,
        );

    const [
        removerMidia,
        setRemoverMidia,
    ] =
        useState(
            false,
        );


    const [
        busyKey,
        setBusyKey,
    ] =
        useState<string | null>(
            null,
        );

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<SnackbarState | null>(
            null,
        );


    const [
        previewOpen,
        setPreviewOpen,
    ] =
        useState(
            false,
        );


    const manageEnabled =
        mode ===
        "admin" ||
        canManage;


    const [
        horarioSequence,
        setHorarioSequence,
    ] =
        useState(
            100000,
        );


    useEffect(
        () => {
            return () => {
                if (
                    midiaPreview
                        ?.startsWith(
                            "blob:",
                        )
                ) {
                    URL.revokeObjectURL(
                        midiaPreview,
                    );
                }
            };
        },
        [
            midiaPreview,
        ],
    );


    const selectedChannel =
        data
            .canais
            .find(
                (
                    canal,
                ) =>
                    canal.key ===
                    selectedChannelKey,
            ) ??
        data
            .canais[0];


    const midiaAtualUrl =
        midiaPreview ??
        (
            editing
                ?.media_tipo ===
            "imagem"
                ? editing
                    .media_url
                : null
        );


    const midiaAtualEhFonte =
        Boolean(
            editing
                ?.media_url,
        ) &&
        !editing
            ?.midia_propria &&
        !midiaFile;


    const query =
        busca
            .trim()
            .toLocaleLowerCase(
                "pt-BR",
            );


    const visibleItems =
        useMemo(
            () =>
                selectedChannel
                    ? data
                        .itens
                        .filter(
                            (
                                item,
                            ) =>
                                canalMatches(
                                    selectedChannel,
                                    item
                                        .parceiro_id,
                                ),
                        )
                        .filter(
                            (
                                item,
                            ) =>
                                !query ||
                                searchable(
                                    item.titulo,
                                )
                                    .includes(
                                        query,
                                    ) ||
                                searchable(
                                    item
                                        .descricao,
                                )
                                    .includes(
                                        query,
                                    ) ||
                                searchable(
                                    item
                                        .parceiro
                                        ?.nome,
                                )
                                    .includes(
                                        query,
                                    ),
                        )
                    : [],
            [
                data.itens,
                query,
                selectedChannel,
            ],
        );


    const visibleAvailable =
        useMemo(
            () =>
                selectedChannel
                    ? data
                        .disponiveis
                        .filter(
                            (
                                item,
                            ) =>
                                canalMatches(
                                    selectedChannel,
                                    item
                                        .parceiro_id,
                                ),
                        )
                        .filter(
                            (
                                item,
                            ) =>
                                !query ||
                                searchable(
                                    item.titulo,
                                )
                                    .includes(
                                        query,
                                    ) ||
                                searchable(
                                    item
                                        .descricao,
                                )
                                    .includes(
                                        query,
                                    ) ||
                                searchable(
                                    item
                                        .parceiro_nome,
                                )
                                    .includes(
                                        query,
                                    ),
                        )
                    : [],
            [
                data.disponiveis,
                query,
                selectedChannel,
            ],
        );


    const exibindo =
        visibleItems
            .filter(
                (
                    item,
                ) =>
                    item.status ===
                    "exibindo",
            );


    const programados =
        visibleItems
            .filter(
                (
                    item,
                ) =>
                    item.status !==
                    "exibindo",
            );


    async function reload() {
        const response =
            await fetch(
                apiBase,
                {
                    cache:
                        "no-store",

                    headers: {
                        Accept:
                            "application/json",
                    },
                },
            );

        const result =
            await response
                .json();

        if (
            !response.ok ||
            !result.ok ||
            !result.data
        ) {
            throw new Error(
                result.message ||
                "Não foi possível atualizar a programação.",
            );
        }

        setData(
            result.data as TvProgramacaoData,
        );
    }


    function updateForm<
        K extends keyof FormState,
    >(
        key:
            K,

        value:
            FormState[K],
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


    function openEdit(
        item:
            TvProgramacaoItem,
    ) {
        setEditing(
            item,
        );

        setCreating(
            false,
        );

        setForm(
            itemForm(
                item,
            ),
        );

        setMidiaFile(
            null,
        );

        setMidiaPreview(
            null,
        );

        setRemoverMidia(
            false,
        );

        if (
            fileInputRef
                .current
        ) {
            fileInputRef
                .current
                .value =
                "";
        }
    }


    function openCreate() {
        if (
            !manageEnabled ||
            !selectedChannel ||
            selectedChannel
                .tipo ===
            "geral"
        ) {
            return;
        }

        setEditing(
            null,
        );

        setCreating(
            true,
        );

        setForm({
            ...emptyForm,

            ordem:
                String(
                    visibleItems
                        .length,
                ),
        });

        setMidiaFile(
            null,
        );

        setMidiaPreview(
            null,
        );

        setRemoverMidia(
            false,
        );

        if (
            fileInputRef
                .current
        ) {
            fileInputRef
                .current
                .value =
                "";
        }
    }


    function closeModal() {
        if (
            busyKey ===
            "save"
        ) {
            return;
        }

        setEditing(
            null,
        );

        setCreating(
            false,
        );

        setForm(
            emptyForm,
        );

        setMidiaFile(
            null,
        );

        setMidiaPreview(
            null,
        );

        setRemoverMidia(
            false,
        );

        if (
            fileInputRef
                .current
        ) {
            fileInputRef
                .current
                .value =
                "";
        }
    }


    function handleMidiaChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event
                .target
                .files
                ?.[0] ??
            null;


        if (
            !file
        ) {
            return;
        }


        if (
            !file.type
                .startsWith(
                    "image/",
                )
        ) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Imagem inválida",

                message:
                    "Selecione um arquivo de imagem.",

                autoClose:
                    false,
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
                    "danger",

                title:
                    "Imagem muito grande",

                message:
                    "A imagem ultrapassa o limite de 5MB.",

                autoClose:
                    false,
            });

            return;
        }


        setMidiaFile(
            file,
        );

        setMidiaPreview(
            URL.createObjectURL(
                file,
            ),
        );

        setRemoverMidia(
            false,
        );
    }


    function limparMidiaSelecionada() {
        setMidiaFile(
            null,
        );

        setMidiaPreview(
            null,
        );

        if (
            fileInputRef
                .current
        ) {
            fileInputRef
                .current
                .value =
                "";
        }
    }


    function removerMidiaAtual() {
        const possuiMidiaPropria =
            Boolean(
                editing
                    ?.midia_propria,
            );


        limparMidiaSelecionada();

        setRemoverMidia(
            possuiMidiaPropria,
        );
    }


    function addHorario() {
        const key =
            horarioSequence;

        setHorarioSequence(
            (
                value,
            ) =>
                value +
                1,
        );

        setForm(
            (
                current,
            ) => ({
                ...current,

                horarios: [
                    ...current
                        .horarios,

                    {
                        key,

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


    function removeHorario(
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


    function payload() {
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
            throw new Error(
                "Informe uma ordem válida.",
            );
        }

        const duracao =
            form
                .duracao_segundos
                .trim()
                ? Number(
                    form
                        .duracao_segundos,
                )
                : null;


        if (
            duracao !==
            null &&
            (
                !Number.isInteger(
                    duracao,
                ) ||
                duracao <=
                0
            )
        ) {
            throw new Error(
                "A duração precisa ser um número inteiro maior que zero.",
            );
        }


        const horarios:
            TvHorarioInput[] =
            form
                .horarios
                .map(
                    (
                        horario,
                    ) => ({
                        diaSemana:
                            Number(
                                horario
                                    .dia_semana,
                            ),

                        horaInicio:
                            horario
                                .hora_inicio,

                        horaFim:
                            horario
                                .hora_fim,
                    }),
                );

        return {
            titulo:
                form.titulo,

            descricao:
                form.descricao,

            link:
                form.link,

            kicker:
                form.kicker,

            cor_destaque:
                form
                    .cor_destaque,

            duracao_segundos:
                duracao,

            ordem,

            ativo:
                form.ativo,

            inicio_exibicao:
                saoPauloIso(
                    form
                        .inicio_exibicao,
                ),

            fim_exibicao:
                saoPauloIso(
                    form
                        .fim_exibicao,
                ),

            horarios,
        };
    }


    async function persistirMidia(
        exibicaoId:
            number,
    ) {
        if (
            midiaFile
        ) {
            const formData =
                new FormData();

            formData.append(
                "midia",
                midiaFile,
            );


            const response =
                await fetch(
                    `${apiBase}/${exibicaoId}/midia`,
                    {
                        method:
                            "POST",

                        body:
                            formData,
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
                    "A programação foi salva, mas não foi possível atualizar a imagem.",
                );
            }

            return;
        }


        if (
            removerMidia
        ) {
            const response =
                await fetch(
                    `${apiBase}/${exibicaoId}/midia`,
                    {
                        method:
                            "DELETE",

                        headers: {
                            Accept:
                                "application/json",
                        },
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
                    "A programação foi salva, mas não foi possível remover a imagem própria.",
                );
            }
        }
    }


    async function save() {
        try {
            setBusyKey(
                "save",
            );

            const body =
                payload();

            let response:
                Response;

            if (
                creating
            ) {
                if (
                    !selectedChannel ||
                    selectedChannel
                        .tipo ===
                    "geral"
                ) {
                    throw new Error(
                        "Selecione AAACCU ou um parceiro para criar a divulgação.",
                    );
                }

                if (
                    form
                        .titulo
                        .trim()
                        .length <
                    2
                ) {
                    throw new Error(
                        "Informe o título da divulgação.",
                    );
                }

                response =
                    await fetch(
                        apiBase,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    action:
                                        "create_divulgacao",

                                    parceiro_id:
                                        selectedChannel
                                            .parceiro_id,

                                    ...body,
                                }),
                        },
                    );
            } else {
                if (
                    !editing
                ) {
                    return;
                }

                response =
                    await fetch(
                        `${apiBase}/${editing.id}`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    action:
                                        "update",

                                    ...body,
                                }),
                        },
                    );
            }

            const result =
                await response
                    .json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar a programação.",
                );
            }


            const exibicaoId =
                Number(
                    result
                        .data
                        ?.exibicao
                        ?.id ??
                    editing
                        ?.id,
                );


            if (
                (
                    midiaFile ||
                    removerMidia
                ) &&
                (
                    !Number.isInteger(
                        exibicaoId,
                    ) ||
                    exibicaoId <=
                    0
                )
            ) {
                throw new Error(
                    "A programação foi salva, mas não foi possível identificar a exibição para atualizar a imagem.",
                );
            }


            if (
                Number.isInteger(
                    exibicaoId,
                ) &&
                exibicaoId >
                0
            ) {
                await persistirMidia(
                    exibicaoId,
                );
            }


            await reload();

            setEditing(
                null,
            );

            setCreating(
                false,
            );

            setForm(
                emptyForm,
            );

            setMidiaFile(
                null,
            );

            setMidiaPreview(
                null,
            );

            setRemoverMidia(
                false,
            );

            if (
                fileInputRef
                    .current
            ) {
                fileInputRef
                    .current
                    .value =
                    "";
            }

            setSnackbar({
                color:
                    "success",

                title:
                    creating
                        ? "Divulgação criada"
                        : "Programação atualizada",

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
                    "Erro ao salvar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar a programação.",

                autoClose:
                    false,
            });
        } finally {
            setBusyKey(
                null,
            );
        }
    }


    async function toggle(
        item:
            TvProgramacaoItem,
    ) {
        const key =
            `toggle:${item.id}`;

        try {
            setBusyKey(
                key,
            );

            const ativo =
                !Boolean(
                    item.ativo,
                );

            const response =
                await fetch(
                    `${apiBase}/${item.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "set_ativo",

                                ativo,
                            }),
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
                    "Não foi possível alterar a exibição.",
                );
            }

            await reload();

            setSnackbar({
                color:
                    "success",

                title:
                    ativo
                        ? "Conteúdo ativado"
                        : "Conteúdo pausado",

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
                    "Erro ao alterar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar a exibição.",

                autoClose:
                    false,
            });
        } finally {
            setBusyKey(
                null,
            );
        }
    }


    async function addAvailable(
        item:
            TvDisponivelItem,
    ) {
        const key =
            `add:${item.tipo}:${item.id}`;

        try {
            setBusyKey(
                key,
            );

            const response =
                await fetch(
                    apiBase,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "add_source",

                                tipo:
                                    item.tipo,

                                source_id:
                                    item.id,
                            }),
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
                    "Não foi possível adicionar o conteúdo à TV.",
                );
            }

            await reload();

            setSnackbar({
                color:
                    "success",

                title:
                    "Adicionado à TV",

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
                    "Erro ao adicionar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível adicionar o conteúdo à TV.",

                autoClose:
                    false,
            });
        } finally {
            setBusyKey(
                null,
            );
        }
    }


    async function remove(
        item:
            TvProgramacaoItem,
    ) {
        if (
            !window.confirm(
                `Remover "${item.titulo}" da programação da TV?`,
            )
        ) {
            return;
        }

        const key =
            `remove:${item.id}`;

        try {
            setBusyKey(
                key,
            );

            const response =
                await fetch(
                    `${apiBase}/${item.id}`,
                    {
                        method:
                            "DELETE",

                        headers: {
                            Accept:
                                "application/json",
                        },
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
                    "Não foi possível remover o conteúdo da TV.",
                );
            }

            await reload();

            setSnackbar({
                color:
                    "success",

                title:
                    "Removido da TV",

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
                    "Erro ao remover",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível remover o conteúdo da TV.",

                autoClose:
                    false,
            });
        } finally {
            setBusyKey(
                null,
            );
        }
    }


    function openTv() {
        if (
            !selectedChannel
        ) {
            return;
        }

        window.open(
            selectedChannel
                .tv_url,
            "_blank",
            "noopener,noreferrer",
        );
    }


    function ProgramacaoCard({
        item,
    }: {
        item:
            TvProgramacaoItem;
    }) {
        const info =
            statusInfo(
                item.status,
            );

        const toggling =
            busyKey ===
            `toggle:${item.id}`;

        const removing =
            busyKey ===
            `remove:${item.id}`;

        return (
            <article className="bp-card">
                <div
                    className="bp-card-body"
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            14,

                        flexWrap:
                            "wrap",
                    }}
                >
                    <div
                        style={{
                            width:
                                64,

                            height:
                                64,

                            flex:
                                "0 0 64px",

                            borderRadius:
                                14,

                            overflow:
                                "hidden",

                            display:
                                "grid",

                            placeItems:
                                "center",

                            background:
                                "var(--color-surface-2)",

                            color:
                                "var(--color-text-soft)",
                        }}
                    >
                        {item.media_url ? (
                            item.media_tipo ===
                            "video" ? (
                                <MonitorPlay
                                    size={
                                        25
                                    }
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        item.media_url
                                    }
                                    alt=""
                                    style={{
                                        width:
                                            "100%",

                                        height:
                                            "100%",

                                        objectFit:
                                            "cover",
                                    }}
                                />
                            )
                        ) : (
                            <MonitorPlay
                                size={
                                    25
                                }
                            />
                        )}
                    </div>

                    <div
                        style={{
                            flex:
                                "1 1 260px",

                            minWidth:
                                0,
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    7,

                                flexWrap:
                                    "wrap",
                            }}
                        >
                            <strong>
                                {
                                    item.titulo
                                }
                            </strong>

                            <Badge color="secondary">
                                {
                                    tipoLabel(
                                        item.tipo,
                                    )
                                }
                            </Badge>

                            <Badge
                                color={
                                    info.color
                                }
                            >
                                {
                                    info.label
                                }
                            </Badge>
                        </div>

                        <div
                            style={{
                                marginTop:
                                    6,

                                color:
                                    "var(--color-text-muted)",

                                fontSize:
                                    12,

                                display:
                                    "flex",

                                gap:
                                    7,

                                flexWrap:
                                    "wrap",
                            }}
                        >
                            <span>
                                {item
                                    .parceiro
                                    ?.nome ??
                                    "AAACCU"}
                            </span>

                            <span>
                                ·
                            </span>

                            <span>
                                {
                                    horarioResumo(
                                        item,
                                    )
                                }
                            </span>
                        </div>

                        {item.descricao ? (
                            <p
                                style={{
                                    margin:
                                        "7px 0 0",

                                    color:
                                        "var(--color-text-soft)",

                                    fontSize:
                                        12,

                                    lineHeight:
                                        1.45,
                                }}
                            >
                                {
                                    item.descricao
                                }
                            </p>
                        ) : null}
                    </div>

                    {manageEnabled ? (
                        <div
                        style={{
                            display:
                                "flex",

                            gap:
                                6,

                            flex:
                                "0 1 auto",

                            flexWrap:
                                "wrap",
                        }}
                    >
                        <Button
                            color={
                                item.ativo
                                    ? "warning"
                                    : "success"
                            }
                            variant="ghost"
                            size="sm"
                            disabled={
                                toggling
                            }
                            onClick={() =>
                                void toggle(
                                    item,
                                )
                            }
                        >
                            {item.ativo ? (
                                <PowerOff
                                    size={
                                        15
                                    }
                                />
                            ) : (
                                <Power
                                    size={
                                        15
                                    }
                                />
                            )}

                            {item.ativo
                                ? "Pausar"
                                : "Ativar"}
                        </Button>

                        <Button
                            color="secondary"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                openEdit(
                                    item,
                                )
                            }
                        >
                            <Pencil
                                size={
                                    15
                                }
                            />

                            Editar
                        </Button>

                        <Button
                            color="danger"
                            variant="ghost"
                            size="sm"
                            disabled={
                                removing
                            }
                            onClick={() =>
                                void remove(
                                    item,
                                )
                            }
                        >
                            <Trash2
                                size={
                                    15
                                }
                            />

                            Remover
                        </Button>
                    </div>
                    ) : null}
                </div>
            </article>
        );
    }


    return (
        <>
            <PageHeader
                title={
                    mode ===
                    "admin"
                        ? "TV"
                        : `TV — ${parceiro?.nome ?? "Parceiro"}`
                }
                subtitle={
                    mode ===
                    "admin"
                        ? "Veja o que aparece em cada rota, altere a programação e adicione conteúdos à TV."
                        : manageEnabled
                            ? "Gerencie somente o canal deste parceiro. Tudo que estiver ativo aqui também participa automaticamente da TV Geral."
                            : `Visualização da programação do parceiro${roleLabel ? ` · ${roleLabel}` : ""}. Alterações são restritas a proprietários e administradores.`
                }
                actions={
                    <>
                        {!manageEnabled ? (
                            <Badge color="secondary">
                                Somente leitura
                            </Badge>
                        ) : null}

                        {manageEnabled &&
                        selectedChannel &&
                        selectedChannel
                            .tipo !==
                        "geral" ? (
                            <Button
                                color="secondary"
                                variant="soft"
                                onClick={
                                    openCreate
                                }
                            >
                                <Plus
                                    size={
                                        16
                                    }
                                />

                                Nova divulgação
                            </Button>
                        ) : null}

                        <Button
                            color="secondary"
                            variant="soft"
                            onClick={() =>
                                setPreviewOpen(
                                    true,
                                )
                            }
                        >
                            <Eye
                                size={
                                    16
                                }
                            />

                            Pré-visualizar
                        </Button>

                        <Button
                            onClick={
                                openTv
                            }
                        >
                            <Play
                                size={
                                    16
                                }
                            />

                            Abrir TV
                        </Button>
                    </>
                }
            />

            {mode ===
            "admin" ? (
                <div
                    className="bp-inbox-filter-tabs bp-mb-5"
                    style={{
                        overflowX:
                            "auto",

                        flexWrap:
                            "nowrap",
                    }}
                >
                    {data
                        .canais
                        .map(
                            (
                                canal,
                            ) => (
                                <Button
                                    key={
                                        canal.key
                                    }
                                    color="secondary"
                                    variant={
                                        canal.key ===
                                        selectedChannel
                                            ?.key
                                            ? "soft"
                                            : "ghost"
                                    }
                                    size="sm"
                                    onClick={() =>
                                        setSelectedChannelKey(
                                            canal.key,
                                        )
                                    }
                                >
                                    <MonitorPlay
                                        size={
                                            14
                                        }
                                    />

                                    {
                                        canal.label
                                    }
                                </Button>
                            ),
                        )}
                </div>
            ) : null}


            <div
                style={{
                    maxWidth:
                        520,

                    marginBottom:
                        24,
                }}
            >
                <Input
                    label="Buscar na programação"
                    value={
                        busca
                    }
                    onChange={(
                        event,
                    ) =>
                        setBusca(
                            event
                                .target
                                .value,
                        )
                    }
                    placeholder="Título, descrição ou parceiro"
                />
            </div>


            <section
                className="bp-mb-6"
            >
                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "flex-end",

                        justifyContent:
                            "space-between",

                        gap:
                            12,

                        flexWrap:
                            "wrap",

                        marginBottom:
                            12,
                    }}
                >
                    <div>
                        <h2 className="bp-section-title">
                            Exibindo agora
                        </h2>

                        <p className="bp-section-subtitle">
                            Conteúdos que atendem às regras da fonte e da programação neste momento.
                        </p>
                    </div>

                    <Badge
                        color={
                            exibindo.length >
                            0
                                ? "success"
                                : "secondary"
                        }
                    >
                        {
                            exibindo.length
                        }{" "}
                        no ar
                    </Badge>
                </div>

                {exibindo.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <Eye
                                size={
                                    24
                                }
                            />
                        }
                        title="Nada sendo exibido agora"
                        description="Itens ativos podem estar aguardando a data, o horário da TV ou a validade do conteúdo."
                    />
                ) : (
                    <div
                        style={{
                            display:
                                "grid",

                            gap:
                                10,
                        }}
                    >
                        {exibindo.map(
                            (
                                item,
                            ) => (
                                <ProgramacaoCard
                                    key={
                                        item.id
                                    }
                                    item={
                                        item
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>


            <section
                className="bp-mb-6"
            >
                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "flex-end",

                        justifyContent:
                            "space-between",

                        gap:
                            12,

                        flexWrap:
                            "wrap",

                        marginBottom:
                            12,
                    }}
                >
                    <div>
                        <h2 className="bp-section-title">
                            Programação
                        </h2>

                        <p className="bp-section-subtitle">
                            Conteúdos pausados, agendados, encerrados ou fora do horário.
                        </p>
                    </div>

                    <Badge color="secondary">
                        {
                            programados.length
                        }{" "}
                        item(ns)
                    </Badge>
                </div>

                {programados.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <CalendarClock
                                size={
                                    24
                                }
                            />
                        }
                        title="Sem outros itens programados"
                        description="Adicione conteúdo disponível ou crie uma divulgação para este canal."
                    />
                ) : (
                    <div
                        style={{
                            display:
                                "grid",

                            gap:
                                10,
                        }}
                    >
                        {programados.map(
                            (
                                item,
                            ) => (
                                <ProgramacaoCard
                                    key={
                                        item.id
                                    }
                                    item={
                                        item
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>


            <section>
                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "flex-end",

                        justifyContent:
                            "space-between",

                        gap:
                            12,

                        flexWrap:
                            "wrap",

                        marginBottom:
                            12,
                    }}
                >
                    <div>
                        <h2 className="bp-section-title">
                            Disponíveis
                        </h2>

                        <p className="bp-section-subtitle">
                            Eventos e promoções cadastrados que ainda não fazem parte desta programação.
                        </p>
                    </div>

                    <Badge color="secondary">
                        {
                            visibleAvailable.length
                        }{" "}
                        disponível(is)
                    </Badge>
                </div>

                {visibleAvailable.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <Search
                                size={
                                    24
                                }
                            />
                        }
                        title="Nenhum conteúdo disponível"
                        description="Todos os conteúdos encontrados já estão programados ou não correspondem à busca."
                    />
                ) : (
                    <div
                        style={{
                            display:
                                "grid",

                            gap:
                                9,
                        }}
                    >
                        {visibleAvailable.map(
                            (
                                item,
                            ) => {
                                const key =
                                    `add:${item.tipo}:${item.id}`;

                                return (
                                    <article
                                        key={
                                            `${item.tipo}:${item.id}`
                                        }
                                        className="bp-card"
                                    >
                                        <div
                                            className="bp-card-body"
                                            style={{
                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "space-between",

                                                gap:
                                                    12,

                                                flexWrap:
                                                    "wrap",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        gap:
                                                            7,

                                                        alignItems:
                                                            "center",

                                                        flexWrap:
                                                            "wrap",
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            item.titulo
                                                        }
                                                    </strong>

                                                    <Badge color="secondary">
                                                        {
                                                            tipoLabel(
                                                                item.tipo,
                                                            )
                                                        }
                                                    </Badge>

                                                    {!item.ativo ? (
                                                        <Badge color="warning">
                                                            Fonte inativa
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop:
                                                            5,

                                                        color:
                                                            "var(--color-text-muted)",

                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    {item
                                                        .parceiro_nome ??
                                                        "AAACCU"}
                                                </div>
                                            </div>

                                            {manageEnabled ? (
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        busyKey ===
                                                        key
                                                    }
                                                    onClick={() =>
                                                        void addAvailable(
                                                            item,
                                                        )
                                                    }
                                                >
                                                    <Plus
                                                        size={
                                                            15
                                                        }
                                                    />

                                                    Adicionar à TV
                                                </Button>
                                            ) : (
                                                <Badge color="secondary">
                                                    Disponível
                                                </Badge>
                                            )}
                                        </div>
                                    </article>
                                );
                            },
                        )}
                    </div>
                )}
            </section>


            <Modal
                open={
                    creating ||
                    Boolean(
                        editing,
                    )
                }
                title={
                    creating
                        ? "Nova divulgação"
                        : "Editar exibição"
                }
                description={
                    creating
                        ? "Conteúdo criado diretamente para a TV, sem precisar ser um evento ou uma promoção."
                        : editing
                            ?.fonte_titulo
                            ? `Campos vazios continuam usando os dados de "${editing.fonte_titulo}".`
                            : "Ajuste os dados e a agenda desta divulgação."
                }
                size="lg"
                onCloseAction={
                    closeModal
                }
                footer={
                    <>
                        <Button
                            color="secondary"
                            variant="ghost"
                            disabled={
                                busyKey ===
                                "save"
                            }
                            onClick={
                                closeModal
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            disabled={
                                busyKey ===
                                "save"
                            }
                            onClick={() =>
                                void save()
                            }
                        >
                            Salvar
                        </Button>
                    </>
                }
            >
                <div
                    style={{
                        display:
                            "grid",

                        gap:
                            18,
                    }}
                >
                    <div
                        style={{
                            display:
                                "grid",

                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(210px, 1fr))",

                            gap:
                                12,
                        }}
                    >
                        <Input
                            label={
                                creating
                                    ? "Título"
                                    : "Título na TV (opcional)"
                            }
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
                            placeholder={
                                editing
                                    ?.fonte_titulo ??
                                "Título"
                            }
                        />

                        <Input
                            label="Kicker (opcional)"
                            value={
                                form.kicker
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "kicker",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Ex.: Destaque"
                        />

                        <Input
                            label="Link / QR Code (opcional)"
                            value={
                                form.link
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "link",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="https://..."
                        />

                        <Input
                            label="Cor de destaque (opcional)"
                            value={
                                form
                                    .cor_destaque
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "cor_destaque",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="#9CD91A"
                        />

                        <Input
                            label="Duração da imagem em segundos"
                            type="number"
                            min="1"
                            value={
                                form
                                    .duracao_segundos
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "duracao_segundos",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="18 (padrão)"
                        />

                        <Input
                            label="Ordem"
                            type="number"
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
                        />

                        <Input
                            label="Início da exibição"
                            type="datetime-local"
                            value={
                                form
                                    .inicio_exibicao
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "inicio_exibicao",
                                    event
                                        .target
                                        .value,
                                )
                            }
                        />

                        <Input
                            label="Fim da exibição"
                            type="datetime-local"
                            value={
                                form
                                    .fim_exibicao
                            }
                            onChange={(
                                event,
                            ) =>
                                updateForm(
                                    "fim_exibicao",
                                    event
                                        .target
                                        .value,
                                )
                            }
                        />
                    </div>

                    <Textarea
                        label={
                            creating
                                ? "Descrição"
                                : "Descrição na TV (opcional)"
                        }
                        value={
                            form
                                .descricao
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
                        rows={5}
                    />

                    <div>
                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={
                                handleMidiaChange
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
                                    Imagem da TV
                                </strong>

                                <div className="bp-field-help">
                                    Opcional · máximo 5MB. Sem imagem própria, evento e promoção continuam usando a mídia da fonte.
                                </div>
                            </div>

                            <ImagePlus
                                size={
                                    20
                                }
                            />
                        </div>

                        {midiaAtualUrl ? (
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        midiaAtualUrl
                                    }
                                    alt="Imagem da exibição da TV"
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
                                            size={
                                                15
                                            }
                                        />

                                        {midiaFile ||
                                        editing
                                            ?.midia_propria
                                            ? "Trocar imagem"
                                            : "Adicionar imagem"}
                                    </Button>

                                    {midiaFile ||
                                    editing
                                        ?.midia_propria ? (
                                        <Button
                                            type="button"
                                            color="danger"
                                            variant="soft"
                                            size="sm"
                                            onClick={
                                                removerMidiaAtual
                                            }
                                        >
                                            <X
                                                size={
                                                    15
                                                }
                                            />

                                            Remover imagem própria
                                        </Button>
                                    ) : null}
                                </div>

                                {midiaAtualEhFonte ? (
                                    <div className="bp-field-help">
                                        Esta é a mídia original da fonte. Enviar uma imagem cria um override somente para a TV.
                                    </div>
                                ) : null}
                            </div>
                        ) : editing
                            ?.media_tipo ===
                        "video" &&
                        editing
                            .media_url &&
                        !midiaFile ? (
                            <div className="bp-product-dropzone">
                                <MonitorPlay
                                    size={
                                        28
                                    }
                                />

                                <strong>
                                    A fonte atual usa vídeo
                                </strong>

                                <span className="bp-field-help">
                                    Você pode manter o vídeo ou enviar uma imagem para sobrescrever somente a exibição da TV.
                                </span>

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
                                        size={
                                            15
                                        }
                                    />

                                    Enviar imagem
                                </Button>
                            </div>
                        ) : (
                            <div
                                role="button"
                                tabIndex={
                                    0
                                }
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
                                <ImagePlus
                                    size={
                                        28
                                    }
                                />

                                <strong>
                                    Adicionar imagem à TV
                                </strong>

                                <span className="bp-field-help">
                                    Clique para selecionar uma imagem.
                                </span>
                            </div>
                        )}
                    </div>


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

                        Ativo na programação
                    </label>

                    <div>
                        <div
                            style={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                gap:
                                    10,

                                flexWrap:
                                    "wrap",

                                marginBottom:
                                    10,
                            }}
                        >
                            <div>
                                <strong>
                                    Horários da TV
                                </strong>

                                <p
                                    style={{
                                        margin:
                                            "4px 0 0",

                                        color:
                                            "var(--color-text-muted)",

                                        fontSize:
                                            12,
                                    }}
                                >
                                    Se deixar vazio, a TV usa toda a janela de datas. A validade da promoção continua independente.
                                </p>
                            </div>

                            <Button
                                color="secondary"
                                variant="soft"
                                size="sm"
                                onClick={
                                    addHorario
                                }
                            >
                                <Plus
                                    size={
                                        14
                                    }
                                />

                                Adicionar horário
                            </Button>
                        </div>

                        <div
                            style={{
                                display:
                                    "grid",

                                gap:
                                    8,
                            }}
                        >
                            {form
                                .horarios
                                .map(
                                    (
                                        horario,
                                    ) => (
                                        <div
                                            key={
                                                horario.key
                                            }
                                            className="bp-card"
                                        >
                                            <div
                                                className="bp-card-body"
                                                style={{
                                                    display:
                                                        "grid",

                                                    gridTemplateColumns:
                                                        "repeat(auto-fit, minmax(130px, 1fr))",

                                                    gap:
                                                        8,

                                                    alignItems:
                                                        "end",
                                                }}
                                            >
                                                <label>
                                                    <span className="bp-label">
                                                        Dia
                                                    </span>

                                                    <select
                                                        className="bp-input"
                                                        value={
                                                            horario
                                                                .dia_semana
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateHorario(
                                                                horario.key,
                                                                "dia_semana",
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        {diasSemana.map(
                                                            (
                                                                option,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        option[0]
                                                                    }
                                                                    value={
                                                                        option[0]
                                                                    }
                                                                >
                                                                    {
                                                                        option[1]
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>

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
                                                />

                                                <Button
                                                    color="danger"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeHorario(
                                                            horario.key,
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={
                                                            15
                                                        }
                                                    />

                                                    Remover
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                        </div>
                    </div>
                </div>
            </Modal>


            <Modal
                open={
                    previewOpen
                }
                title={
                    selectedChannel
                        ? `Prévia — ${selectedChannel.label}`
                        : "Prévia da TV"
                }
                description="Prévia da rota pública atualmente selecionada."
                size="xl"
                onCloseAction={() =>
                    setPreviewOpen(
                        false,
                    )
                }
                footer={
                    <>
                        <Button
                            color="secondary"
                            variant="ghost"
                            onClick={() =>
                                setPreviewOpen(
                                    false,
                                )
                            }
                        >
                            Fechar
                        </Button>

                        <Button
                            onClick={
                                openTv
                            }
                        >
                            <Play
                                size={
                                    16
                                }
                            />

                            Abrir em nova aba
                        </Button>
                    </>
                }
            >
                {selectedChannel ? (
                    <div
                        style={{
                            width:
                                "100%",

                            aspectRatio:
                                "16 / 9",

                            minHeight:
                                360,

                            overflow:
                                "hidden",

                            borderRadius:
                                16,

                            border:
                                "1px solid var(--color-border-soft)",

                            background:
                                "#050507",
                        }}
                    >
                        <iframe
                            key={
                                selectedChannel
                                    .tv_url
                            }
                            src={
                                selectedChannel
                                    .tv_url
                            }
                            title={
                                `Prévia ${selectedChannel.label}`
                            }
                            style={{
                                width:
                                    "100%",

                                height:
                                    "100%",

                                border:
                                    0,
                            }}
                        />
                    </div>
                ) : null}
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
