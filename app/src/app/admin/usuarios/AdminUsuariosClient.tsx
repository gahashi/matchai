"use client";

import {
    useMemo,
    useState,
} from "react";

import {
    Search,
    ShieldCheck,
    ShieldOff,
    UserRound,
    UsersRound,
} from "lucide-react";

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


type UsuarioTipo = {
    codigo: string;
    nome: string;
};


type Usuario = {
    id: number;
    nome: string;
    nickname: string;
    email: string;
    ativo: number;

    sys_usuario_tipo:
        UsuarioTipo;
};


type AdminUsuariosData = {
    usuarios: Usuario[];
    currentUserId:
        number |
        null;
};


type Props = {
    initialData:
        AdminUsuariosData;
};


export default function AdminUsuariosClient({
                                                initialData,
                                            }: Props) {
    const [
        usuarios,
        setUsuarios,
    ] =
        useState(
            initialData.usuarios,
        );

    const [
        busca,
        setBusca,
    ] =
        useState("");

    const [
        usuarioAlteracao,
        setUsuarioAlteracao,
    ] =
        useState<Usuario | null>(
            null,
        );

    const [
        busyId,
        setBusyId,
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


    const usuariosFiltrados =
        useMemo(
            () => {
                const termo =
                    busca
                        .trim()
                        .toLowerCase();

                if (!termo) {
                    return usuarios;
                }

                return usuarios.filter(
                    (
                        usuario,
                    ) =>
                        [
                            usuario.nome,
                            usuario.nickname,
                            usuario.email,
                            usuario
                                .sys_usuario_tipo
                                .nome,
                        ].some(
                            (
                                value,
                            ) =>
                                value
                                    .toLowerCase()
                                    .includes(
                                        termo,
                                    ),
                        ),
                );
            },
            [
                busca,
                usuarios,
            ],
        );


    const totalAdmins =
        usuarios.filter(
            (
                usuario,
            ) =>
                usuario
                    .sys_usuario_tipo
                    .codigo ===
                "admin",
        ).length;


    const totalClientes =
        usuarios.filter(
            (
                usuario,
            ) =>
                usuario
                    .sys_usuario_tipo
                    .codigo ===
                "cliente",
        ).length;


    async function alterarTipo() {
        if (!usuarioAlteracao) {
            return;
        }

        const novoTipo =
            usuarioAlteracao
                .sys_usuario_tipo
                .codigo ===
            "admin"
                ? "cliente"
                : "admin";

        try {
            setBusyId(
                usuarioAlteracao.id,
            );

            setSnackbar(
                null,
            );


            const response =
                await fetch(
                    `/api/admin/usuarios/${usuarioAlteracao.id}`,
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
                                tipo:
                                novoTipo,
                            }),
                    },
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ??
                    "Não foi possível alterar o usuário.",
                );
            }


            const atualizado =
                result.data
                    .usuario as Usuario;


            setUsuarios(
                (
                    current,
                ) =>
                    current.map(
                        (
                            usuario,
                        ) =>
                            usuario.id ===
                            atualizado.id
                                ? atualizado
                                : usuario,
                    ),
            );


            setUsuarioAlteracao(
                null,
            );


            setSnackbar({
                color:
                    "success",

                title:
                    novoTipo ===
                    "admin"
                        ? "Administrador adicionado"
                        : "Administrador removido",

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
                    "Erro ao alterar usuário",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o usuário.",

                autoClose:
                    false,
            });
        } finally {
            setBusyId(
                null,
            );
        }
    }


    return (
        <>
            <PageHeader
                title="Usuários"
                subtitle="Gerencie os usuários cadastrados e o acesso administrativo."
            />


            <div
                style={{
                    display:
                        "grid",

                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",

                    gap:
                        12,

                    marginBottom:
                        20,
                }}
            >
                <Card variant="outline">
                    <CardBody>
                        <span className="bp-section-subtitle">
                            Usuários
                        </span>

                        <strong
                            style={{
                                display:
                                    "block",

                                marginTop:
                                    6,

                                fontSize:
                                    24,
                            }}
                        >
                            {
                                usuarios.length
                            }
                        </strong>
                    </CardBody>
                </Card>


                <Card variant="outline">
                    <CardBody>
                        <span className="bp-section-subtitle">
                            Administradores
                        </span>

                        <strong
                            style={{
                                display:
                                    "block",

                                marginTop:
                                    6,

                                fontSize:
                                    24,
                            }}
                        >
                            {
                                totalAdmins
                            }
                        </strong>
                    </CardBody>
                </Card>


                <Card variant="outline">
                    <CardBody>
                        <span className="bp-section-subtitle">
                            Clientes
                        </span>

                        <strong
                            style={{
                                display:
                                    "block",

                                marginTop:
                                    6,

                                fontSize:
                                    24,
                            }}
                        >
                            {
                                totalClientes
                            }
                        </strong>
                    </CardBody>
                </Card>
            </div>


            <Card>
                <CardBody>
                    <div
                        style={{
                            maxWidth:
                                520,

                            marginBottom:
                                20,
                        }}
                    >
                        <Input
                            label="Buscar usuário"
                            value={
                                busca
                            }
                            onChange={
                                (
                                    event,
                                ) =>
                                    setBusca(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            placeholder="Nome, nickname, e-mail ou tipo..."
                        />
                    </div>


                    {usuarios.length ===
                    0 ? (
                        <EmptyState
                            icon={
                                <UsersRound
                                    size={
                                        24
                                    }
                                />
                            }
                            title="Nenhum usuário cadastrado"
                            description="Ainda não existem usuários cadastrados no sistema."
                        />
                    ) : usuariosFiltrados.length ===
                    0 ? (
                        <EmptyState
                            icon={
                                <Search
                                    size={
                                        24
                                    }
                                />
                            }
                            title="Nenhum resultado"
                            description="Nenhum usuário corresponde à busca atual."
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
                            {usuariosFiltrados.map(
                                (
                                    usuario,
                                ) => {
                                    const isAdmin =
                                        usuario
                                            .sys_usuario_tipo
                                            .codigo ===
                                        "admin";

                                    const isCurrentUser =
                                        usuario.id ===
                                        initialData.currentUserId;

                                    const busy =
                                        busyId ===
                                        usuario.id;


                                    return (
                                        <Card
                                            key={
                                                usuario.id
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

                                                        justifyContent:
                                                            "space-between",

                                                        gap:
                                                            16,

                                                        flexWrap:
                                                            "wrap",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",

                                                            alignItems:
                                                                "center",

                                                            gap:
                                                                12,

                                                            minWidth:
                                                                0,
                                                        }}
                                                    >
                                                        <div className="bp-admin-option-icon">
                                                            {isAdmin ? (
                                                                <ShieldCheck
                                                                    size={
                                                                        20
                                                                    }
                                                                />
                                                            ) : (
                                                                <UserRound
                                                                    size={
                                                                        20
                                                                    }
                                                                />
                                                            )}
                                                        </div>


                                                        <div
                                                            style={{
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
                                                                        8,

                                                                    flexWrap:
                                                                        "wrap",
                                                                }}
                                                            >
                                                                <strong>
                                                                    {
                                                                        usuario.nome
                                                                    }
                                                                </strong>

                                                                <Badge
                                                                    color={
                                                                        isAdmin
                                                                            ? "success"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    {isAdmin
                                                                        ? "Administrador"
                                                                        : "Cliente"}
                                                                </Badge>

                                                                {!usuario.ativo ? (
                                                                    <Badge color="danger">
                                                                        Inativo
                                                                    </Badge>
                                                                ) : null}

                                                                {isCurrentUser ? (
                                                                    <Badge color="primary">
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
                                                                @
                                                                {
                                                                    usuario.nickname
                                                                }{" "}
                                                                ·{" "}
                                                                {
                                                                    usuario.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>


                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        color={
                                                            isAdmin
                                                                ? "danger"
                                                                : "primary"
                                                        }
                                                        variant="soft"
                                                        disabled={
                                                            busy ||
                                                            isCurrentUser ||
                                                            !usuario.ativo
                                                        }
                                                        onClick={() =>
                                                            setUsuarioAlteracao(
                                                                usuario,
                                                            )
                                                        }
                                                    >
                                                        {isAdmin ? (
                                                            <>
                                                                <ShieldOff
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                                Remover admin
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldCheck
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                                Tornar admin
                                                            </>
                                                        )}
                                                    </Button>
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


            <Modal
                open={
                    Boolean(
                        usuarioAlteracao,
                    )
                }
                title={
                    usuarioAlteracao
                        ?.sys_usuario_tipo
                        .codigo ===
                    "admin"
                        ? "Remover administrador"
                        : "Tornar administrador"
                }
                description={
                    usuarioAlteracao
                        ? usuarioAlteracao
                            .sys_usuario_tipo
                            .codigo ===
                        "admin"
                            ? `Remover o acesso administrativo de ${usuarioAlteracao.nome}?`
                            : `${usuarioAlteracao.nome} terá acesso às áreas administrativas do sistema.`
                        : undefined
                }
                onCloseAction={() =>
                    setUsuarioAlteracao(
                        null,
                    )
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            disabled={
                                busyId !==
                                null
                            }
                            onClick={() =>
                                setUsuarioAlteracao(
                                    null,
                                )
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            color={
                                usuarioAlteracao
                                    ?.sys_usuario_tipo
                                    .codigo ===
                                "admin"
                                    ? "danger"
                                    : "primary"
                            }
                            disabled={
                                busyId !==
                                null
                            }
                            onClick={
                                alterarTipo
                            }
                        >
                            Confirmar
                        </Button>
                    </>
                }
            >
                <div
                    style={{
                        lineHeight:
                            1.6,
                    }}
                >
                    Esta alteração modifica
                    imediatamente o nível de
                    acesso do usuário.
                </div>
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