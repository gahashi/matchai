"use client";

import {
    useMemo,
    useState,
} from "react";

import {
    ShieldCheck,
    Trash2,
    UserPlus,
    UsersRound,
} from "lucide-react";

import {
    AsyncSelect,
    type AsyncSelectOption,
} from "@/components/ui/AsyncSelect";

import {
    Badge,
} from "@/components/ui/Badge";

import {
    Button,
} from "@/components/ui/Button";

import {
    Card,
    CardBody,
} from "@/components/ui/Card";

import {
    EmptyState,
} from "@/components/ui/EmptyState";

import {
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";


type Tipo = {
    id: number;
    codigo: string;
    nome: string;
    descricao: string | null;
};


type Membro = {
    id: number;
    ativo: boolean;

    tipo: {
        id: number;
        codigo: string;
        nome: string;
    };

    usuario: {
        id: number;
        nome: string;
        nickname: string | null;
        email: string;
        avatar_url: string | null;
    };
};


type Data = {
    tipos: Tipo[];
    membros: Membro[];
};


type Props = {
    parceiro: {
        id: number;
        nome: string;
    };

    currentUserId: number;
    actorTipoCodigo: string;

    initialData: Data;
};


function iniciais(
    nome: string,
) {
    return nome
        .split(
            /\s+/,
        )
        .filter(
            Boolean,
        )
        .slice(
            0,
            2,
        )
        .map(
            (
                parte,
            ) =>
                parte
                    .charAt(
                        0,
                    )
                    .toUpperCase(),
        )
        .join(
            "",
        );
}


function badgeColor(
    codigo: string,
) {
    if (
        codigo ===
        "proprietario"
    ) {
        return "warning" as const;
    }

    if (
        codigo ===
        "administrador"
    ) {
        return "info" as const;
    }

    return "secondary" as const;
}


export default function ParceiroMembrosClient({
                                                  parceiro,
                                                  currentUserId,
                                                  actorTipoCodigo,
                                                  initialData,
                                              }: Props) {
    const apiBase =
        `/api/parceiro/${parceiro.id}/membros`;

    const isProprietario =
        actorTipoCodigo ===
        "proprietario";

    const [
        data,
        setData,
    ] =
        useState<Data>(
            initialData,
        );

    const [
        usuario,
        setUsuario,
    ] =
        useState<AsyncSelectOption | null>(
            null,
        );

    const [
        novoTipoCodigo,
        setNovoTipoCodigo,
    ] =
        useState(
            isProprietario
                ? "membro"
                : "membro",
        );

    const [
        salvando,
        setSalvando,
    ] =
        useState(false);

    const [
        alterandoKey,
        setAlterandoKey,
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


    const tiposDisponiveisAdicionar =
        useMemo(
            () =>
                isProprietario
                    ? data.tipos
                    : data.tipos
                        .filter(
                            (
                                tipo,
                            ) =>
                                tipo.codigo ===
                                "membro",
                        ),
            [
                data.tipos,
                isProprietario,
            ],
        );


    async function adicionarMembro() {
        if (!usuario) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Selecione um usuário",

                message:
                    "Escolha quem receberá acesso ao parceiro.",
            });

            return;
        }

        try {
            setSalvando(
                true,
            );

            setSnackbar(
                null,
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
                                sys_usuario_id:
                                    Number(
                                        usuario.id,
                                    ),

                                tipo_codigo:
                                novoTipoCodigo,
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
                    "Não foi possível adicionar o membro.",
                );
            }

            const membro =
                result
                    .data
                    .membro as Membro;

            setData(
                (
                    current,
                ) => ({
                    ...current,

                    membros: [
                        ...current
                            .membros,
                        membro,
                    ],
                }),
            );

            setUsuario(
                null,
            );

            setNovoTipoCodigo(
                "membro",
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Membro adicionado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao adicionar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível adicionar o membro.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(
                false,
            );
        }
    }


    async function alterarTipo(
        membro: Membro,
        tipoCodigo: string,
    ) {
        if (
            tipoCodigo ===
            membro.tipo.codigo
        ) {
            return;
        }

        const key =
            `tipo:${membro.id}`;

        try {
            setAlterandoKey(
                key,
            );

            setSnackbar(
                null,
            );

            const response =
                await fetch(
                    `${apiBase}/${membro.id}`,
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
                                tipo_codigo:
                                tipoCodigo,
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
                    "Não foi possível alterar o acesso.",
                );
            }

            const atualizado =
                result
                    .data
                    .membro as Membro;

            setData(
                (
                    current,
                ) => ({
                    ...current,

                    membros:
                        current
                            .membros
                            .map(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    atualizado.id
                                        ? atualizado
                                        : item,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Acesso atualizado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar acesso",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o acesso.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoKey(
                null,
            );
        }
    }


    async function removerMembro(
        membro: Membro,
    ) {
        if (
            !window.confirm(
                `Remover o acesso de "${membro.usuario.nome}" a ${parceiro.nome}?`,
            )
        ) {
            return;
        }

        const key =
            `remover:${membro.id}`;

        try {
            setAlterandoKey(
                key,
            );

            setSnackbar(
                null,
            );

            const response =
                await fetch(
                    `${apiBase}/${membro.id}`,
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
                    "Não foi possível remover o membro.",
                );
            }

            setData(
                (
                    current,
                ) => ({
                    ...current,

                    membros:
                        current
                            .membros
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    membro.id,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Acesso removido",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao remover",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível remover o membro.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoKey(
                null,
            );
        }
    }


    return (
        <>
            <PageHeader
                title="Membros"
                subtitle={`Gerencie quem possui acesso a ${parceiro.nome}.`}
            />

            <div className="bp-card-stack">
                <Card>
                    <CardBody>
                        <div
                            style={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    10,

                                marginBottom:
                                    16,
                            }}
                        >
                            <div className="bp-admin-option-icon">
                                <UserPlus
                                    size={20}
                                />
                            </div>

                            <div>
                                <h2 className="bp-section-title">
                                    Adicionar membro
                                </h2>

                                <p className="bp-section-subtitle">
                                    Selecione um usuário cadastrado e defina o nível de acesso.
                                </p>
                            </div>
                        </div>

                        <div className="bp-form-grid">
                            <AsyncSelect
                                label="Usuário"
                                endpoint={
                                    `${apiBase}/usuarios-select`
                                }
                                value={
                                    usuario
                                }
                                onChange={
                                    setUsuario
                                }
                                placeholder="Buscar por nome, nickname ou e-mail..."
                                minChars={0}
                                disabled={
                                    salvando
                                }
                            />

                            <div>
                                <label
                                    htmlFor="novo-tipo-membro"
                                    className="bp-label"
                                >
                                    Nível de acesso
                                </label>

                                <select
                                    id="novo-tipo-membro"
                                    className="bp-select"
                                    value={
                                        novoTipoCodigo
                                    }
                                    onChange={
                                        (
                                            event,
                                        ) =>
                                            setNovoTipoCodigo(
                                                event
                                                    .target
                                                    .value,
                                            )
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    {tiposDisponiveisAdicionar.map(
                                        (
                                            tipo,
                                        ) => (
                                            <option
                                                key={
                                                    tipo.id
                                                }
                                                value={
                                                    tipo.codigo
                                                }
                                            >
                                                {
                                                    tipo.nome
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                        </div>

                        <div
                            className="bp-action-row"
                            style={{
                                marginTop:
                                    16,

                                justifyContent:
                                    "flex-end",
                            }}
                        >
                            <Button
                                type="button"
                                color="primary"
                                variant="solid"
                                onClick={
                                    adicionarMembro
                                }
                                disabled={
                                    salvando ||
                                    !usuario
                                }
                            >
                                <UserPlus
                                    size={16}
                                />

                                {salvando
                                    ? "Adicionando..."
                                    : "Adicionar membro"}
                            </Button>
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
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

                                flexWrap:
                                    "wrap",

                                marginBottom:
                                    16,
                            }}
                        >
                            <div>
                                <h2 className="bp-section-title">
                                    Pessoas com acesso
                                </h2>

                                <p className="bp-section-subtitle">
                                    {data.membros.length}{" "}
                                    {data.membros.length === 1
                                        ? "membro vinculado"
                                        : "membros vinculados"}
                                </p>
                            </div>

                            <Badge color="secondary">
                                <UsersRound
                                    size={14}
                                />

                                {
                                    data
                                        .membros
                                        .length
                                }
                            </Badge>
                        </div>

                        {data.membros.length === 0 ? (
                            <EmptyState
                                title="Nenhum membro"
                                description="Ainda não existem usuários vinculados a este parceiro."
                                icon={
                                    <UsersRound
                                        size={30}
                                    />
                                }
                            />
                        ) : (
                            <div className="bp-card-stack">
                                {data.membros.map(
                                    (
                                        membro,
                                    ) => {
                                        const isCurrentUser =
                                            membro
                                                .usuario
                                                .id ===
                                            currentUserId;

                                        const adminPodeRemover =
                                            actorTipoCodigo ===
                                            "administrador" &&
                                            membro
                                                .tipo
                                                .codigo ===
                                            "membro";

                                        const podeRemover =
                                            isProprietario ||
                                            adminPodeRemover;

                                        const tipoKey =
                                            `tipo:${membro.id}`;

                                        const removeKey =
                                            `remover:${membro.id}`;

                                        return (
                                            <Card
                                                key={
                                                    membro.id
                                                }
                                                variant="outline"
                                            >
                                                <CardBody>
                                                    <div
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
                                                                    48,

                                                                height:
                                                                    48,

                                                                borderRadius:
                                                                    14,

                                                                display:
                                                                    "grid",

                                                                placeItems:
                                                                    "center",

                                                                flexShrink:
                                                                    0,

                                                                overflow:
                                                                    "hidden",

                                                                background:
                                                                    "var(--color-surface-2)",

                                                                border:
                                                                    "1px solid var(--color-border)",

                                                                fontWeight:
                                                                    800,
                                                            }}
                                                        >
                                                            {membro
                                                                .usuario
                                                                .avatar_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={
                                                                        membro
                                                                            .usuario
                                                                            .avatar_url
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
                                                            ) : (
                                                                iniciais(
                                                                    membro
                                                                        .usuario
                                                                        .nome,
                                                                )
                                                            )}
                                                        </div>

                                                        <div
                                                            style={{
                                                                flex:
                                                                    1,

                                                                minWidth:
                                                                    180,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    gap:
                                                                        8,

                                                                    flexWrap:
                                                                        "wrap",
                                                                }}
                                                            >
                                                                <strong>
                                                                    {
                                                                        membro
                                                                            .usuario
                                                                            .nome
                                                                    }
                                                                </strong>

                                                                <Badge
                                                                    color={
                                                                        badgeColor(
                                                                            membro
                                                                                .tipo
                                                                                .codigo,
                                                                        )
                                                                    }
                                                                >
                                                                    <ShieldCheck
                                                                        size={13}
                                                                    />

                                                                    {
                                                                        membro
                                                                            .tipo
                                                                            .nome
                                                                    }
                                                                </Badge>

                                                                {isCurrentUser ? (
                                                                    <Badge color="secondary">
                                                                        Você
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
                                                                        13,
                                                                }}
                                                            >
                                                                {[
                                                                    membro
                                                                        .usuario
                                                                        .nickname,

                                                                    membro
                                                                        .usuario
                                                                        .email,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        " · ",
                                                                    )}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="bp-action-row"
                                                            style={{
                                                                marginLeft:
                                                                    "auto",

                                                                justifyContent:
                                                                    "flex-end",
                                                            }}
                                                        >
                                                            {isProprietario ? (
                                                                <select
                                                                    className="bp-select"
                                                                    aria-label={`Nível de acesso de ${membro.usuario.nome}`}
                                                                    value={
                                                                        membro
                                                                            .tipo
                                                                            .codigo
                                                                    }
                                                                    onChange={
                                                                        (
                                                                            event,
                                                                        ) =>
                                                                            alterarTipo(
                                                                                membro,
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                    }
                                                                    disabled={
                                                                        alterandoKey ===
                                                                        tipoKey
                                                                    }
                                                                    style={{
                                                                        minWidth:
                                                                            160,
                                                                    }}
                                                                >
                                                                    {data.tipos.map(
                                                                        (
                                                                            tipo,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    tipo.id
                                                                                }
                                                                                value={
                                                                                    tipo.codigo
                                                                                }
                                                                            >
                                                                                {
                                                                                    tipo.nome
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            ) : null}

                                                            {podeRemover ? (
                                                                <Button
                                                                    type="button"
                                                                    color="danger"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        removerMembro(
                                                                            membro,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        alterandoKey ===
                                                                        removeKey
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={16}
                                                                    />

                                                                    Remover
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>


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
