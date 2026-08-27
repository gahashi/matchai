"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Building2,
    ImagePlus,
    Palette,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Trash2,
    Upload,
    UsersRound,
    X,
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
    Table,
} from "@/components/ui/Table";

import {
    Textarea,
} from "@/components/ui/Textarea";


type ParceiroArquivo = {
    sys_arquivo_id: number;
    public_url: string | null;
    original_name: string;
};


type ParceiroTema = {
    id: number;

    cor_primaria: string | null;
    cor_secundaria: string | null;
    cor_fundo: string | null;
    cor_texto: string | null;

    ativo: number;

    logo: ParceiroArquivo | null;
    banner: ParceiroArquivo | null;
};


type ParceiroUsuario = {
    id: number;
    nome: string;
    nickname: string | null;
    email: string;
};


type Parceiro = {
    id: number;

    codigo: string;
    slug: string;

    nome: string;
    descricao: string | null;

    ativo: number;
    visivel_publico: number;

    tema: ParceiroTema | null;

    usuarios: ParceiroUsuario[];
};


type AdminParceirosData = {
    parceiros: Parceiro[];
};


type AdminParceirosClientProps = {
    initialData: AdminParceirosData;
};


type ParceiroFormState = {
    codigo: string;
    slug: string;

    nome: string;
    descricao: string;

    ativo: boolean;
    visivel_publico: boolean;

    cor_primaria: string;
    cor_secundaria: string;
    cor_fundo: string;
    cor_texto: string;
};


const emptyForm: ParceiroFormState = {
    codigo: "",
    slug: "",

    nome: "",
    descricao: "",

    ativo: true,
    visivel_publico: true,

    cor_primaria: "",
    cor_secundaria: "",
    cor_fundo: "",
    cor_texto: "",
};


function slugify(
    value: string,
) {
    return value
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        );
}


function codigoify(
    value: string,
) {
    return slugify(value)
        .replace(
            /-/g,
            "_",
        );
}


function parceiroToForm(
    parceiro: Parceiro,
): ParceiroFormState {
    return {
        codigo:
        parceiro.codigo,

        slug:
        parceiro.slug,

        nome:
        parceiro.nome,

        descricao:
            parceiro.descricao ??
            "",

        ativo:
            Boolean(
                parceiro.ativo,
            ),

        visivel_publico:
            Boolean(
                parceiro
                    .visivel_publico,
            ),

        cor_primaria:
            parceiro.tema
                ?.cor_primaria ??
            "",

        cor_secundaria:
            parceiro.tema
                ?.cor_secundaria ??
            "",

        cor_fundo:
            parceiro.tema
                ?.cor_fundo ??
            "",

        cor_texto:
            parceiro.tema
                ?.cor_texto ??
            "",
    };
}


function parceiroUsuariosToOptions(
    parceiro: Parceiro,
): AsyncSelectOption[] {
    return parceiro.usuarios.map(
        (usuario) => ({
            id:
            usuario.id,

            label:
            usuario.nome,

            description:
                [
                    usuario.nickname,
                    usuario.email,
                ]
                    .filter(Boolean)
                    .join(" · "),
        }),
    );
}


function ColorPreview({
                          value,
                      }: {
    value: string;
}) {
    const valid =
        /^#[0-9a-fA-F]{6}$/.test(
            value,
        );

    return (
        <span
            aria-hidden
            style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: 8,
                border:
                    "1px solid var(--color-border)",
                background:
                    valid
                        ? value
                        : "transparent",
            }}
        />
    );
}


export default function AdminParceirosClient({
                                                 initialData,
                                             }: AdminParceirosClientProps) {
    const logoInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const bannerInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [data, setData] =
        useState(initialData);

    const [
        editingParceiro,
        setEditingParceiro,
    ] =
        useState<Parceiro | null>(
            null,
        );

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(false);

    const [form, setForm] =
        useState<ParceiroFormState>(
            emptyForm,
        );

    const [
        usuarios,
        setUsuarios,
    ] =
        useState<AsyncSelectOption[]>(
            [],
        );

    const [
        logoFile,
        setLogoFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        bannerFile,
        setBannerFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        logoPreview,
        setLogoPreview,
    ] =
        useState<string | null>(
            null,
        );

    const [
        bannerPreview,
        setBannerPreview,
    ] =
        useState<string | null>(
            null,
        );

    const [
        removerLogo,
        setRemoverLogo,
    ] =
        useState(false);

    const [
        removerBanner,
        setRemoverBanner,
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

    const [
        slugEditado,
        setSlugEditado,
    ] =
        useState(false);

    const [
        codigoEditado,
        setCodigoEditado,
    ] =
        useState(false);


    useEffect(() => {
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(
                    logoPreview,
                );
            }

            if (bannerPreview) {
                URL.revokeObjectURL(
                    bannerPreview,
                );
            }
        };
    }, [
        logoPreview,
        bannerPreview,
    ]);


    const temaPreview =
        useMemo(
            () => ({
                primaria:
                    form.cor_primaria ||
                    "#9CD91A",

                secundaria:
                    form.cor_secundaria ||
                    "#F5F2E8",

                fundo:
                    form.cor_fundo ||
                    "#141414",

                texto:
                    form.cor_texto ||
                    "#FFFFFF",
            }),
            [
                form.cor_primaria,
                form.cor_secundaria,
                form.cor_fundo,
                form.cor_texto,
            ],
        );


    function updateForm<
        K extends keyof ParceiroFormState,
    >(
        key: K,
        value: ParceiroFormState[K],
    ) {
        setForm(
            (current) => ({
                ...current,
                [key]:
                value,
            }),
        );
    }


    function limparLogoNovo() {
        if (logoPreview) {
            URL.revokeObjectURL(
                logoPreview,
            );
        }

        setLogoFile(null);
        setLogoPreview(null);

        if (
            logoInputRef.current
        ) {
            logoInputRef
                .current
                .value = "";
        }
    }


    function limparBannerNovo() {
        if (bannerPreview) {
            URL.revokeObjectURL(
                bannerPreview,
            );
        }

        setBannerFile(null);
        setBannerPreview(null);

        if (
            bannerInputRef.current
        ) {
            bannerInputRef
                .current
                .value = "";
        }
    }


    function resetArquivos() {
        limparLogoNovo();
        limparBannerNovo();

        setRemoverLogo(false);
        setRemoverBanner(false);
    }


    function abrirCriacao() {
        resetArquivos();

        setEditingParceiro(
            null,
        );

        setForm(
            emptyForm,
        );

        setUsuarios([]);
        setSlugEditado(false);
        setCodigoEditado(false);

        setSnackbar(null);
        setModalOpen(true);
    }


    function abrirEdicao(
        parceiro: Parceiro,
    ) {
        resetArquivos();

        setEditingParceiro(
            parceiro,
        );

        setForm(
            parceiroToForm(
                parceiro,
            ),
        );

        setUsuarios(
            parceiroUsuariosToOptions(
                parceiro,
            ),
        );

        setSlugEditado(true);
        setCodigoEditado(true);

        setSnackbar(null);
        setModalOpen(true);
    }


    function fecharModal() {
        if (salvando) {
            return;
        }

        resetArquivos();

        setModalOpen(false);

        setEditingParceiro(
            null,
        );

        setForm(
            emptyForm,
        );

        setUsuarios([]);

        setSlugEditado(false);
        setCodigoEditado(false);
    }


    function handleNomeChange(
        value: string,
    ) {
        setForm(
            (current) => ({
                ...current,

                nome:
                value,

                slug:
                    slugEditado
                        ? current.slug
                        : slugify(
                            value,
                        ),

                codigo:
                    codigoEditado
                        ? current.codigo
                        : codigoify(
                            value,
                        ),
            }),
        );
    }


    function selecionarImagem(
        tipo:
            | "logo"
            | "banner",
        file: File,
    ) {
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
                    "Selecione um arquivo de imagem.",
            });

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Arquivo muito grande",

                message:
                    "A imagem ultrapassa o limite de 5MB.",
            });

            return;
        }

        const url =
            URL.createObjectURL(
                file,
            );

        if (
            tipo ===
            "logo"
        ) {
            limparLogoNovo();

            setLogoFile(file);
            setLogoPreview(url);
            setRemoverLogo(false);

            return;
        }

        limparBannerNovo();

        setBannerFile(file);
        setBannerPreview(url);
        setRemoverBanner(false);
    }


    function handleLogoChange(
        event:
        ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target
                .files?.[0];

        if (file) {
            selecionarImagem(
                "logo",
                file,
            );
        }

        event.target.value =
            "";
    }


    function handleBannerChange(
        event:
        ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target
                .files?.[0];

        if (file) {
            selecionarImagem(
                "banner",
                file,
            );
        }

        event.target.value =
            "";
    }


    const logoAtual =
        logoPreview ??
        (
            !removerLogo
                ? editingParceiro
                    ?.tema
                    ?.logo
                    ?.public_url ??
                null
                : null
        );


    const bannerAtual =
        bannerPreview ??
        (
            !removerBanner
                ? editingParceiro
                    ?.tema
                    ?.banner
                    ?.public_url ??
                null
                : null
        );


    function buildFormData() {
        const payload =
            new FormData();

        payload.set(
            "codigo",
            form.codigo,
        );

        payload.set(
            "slug",
            form.slug,
        );

        payload.set(
            "nome",
            form.nome,
        );

        payload.set(
            "descricao",
            form.descricao,
        );

        payload.set(
            "ativo",
            form.ativo
                ? "1"
                : "0",
        );

        payload.set(
            "visivel_publico",
            form.visivel_publico
                ? "1"
                : "0",
        );

        payload.set(
            "usuario_ids",
            JSON.stringify(
                usuarios.map(
                    (usuario) =>
                        Number(
                            usuario.id,
                        ),
                ),
            ),
        );

        payload.set(
            "cor_primaria",
            form.cor_primaria,
        );

        payload.set(
            "cor_secundaria",
            form.cor_secundaria,
        );

        payload.set(
            "cor_fundo",
            form.cor_fundo,
        );

        payload.set(
            "cor_texto",
            form.cor_texto,
        );

        payload.set(
            "remover_logo",
            removerLogo
                ? "1"
                : "0",
        );

        payload.set(
            "remover_banner",
            removerBanner
                ? "1"
                : "0",
        );

        if (logoFile) {
            payload.set(
                "logo",
                logoFile,
            );
        }

        if (bannerFile) {
            payload.set(
                "banner",
                bannerFile,
            );
        }

        return payload;
    }


    async function salvar(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSalvando(true);
            setSnackbar(null);

            const isEditing =
                Boolean(
                    editingParceiro,
                );

            const response =
                await fetch(
                    isEditing
                        ? `/api/admin/parceiros/${editingParceiro!.id}`
                        : "/api/admin/parceiros",
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
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar o parceiro.",
                );
            }

            const parceiro =
                result
                    .data
                    .parceiro as Parceiro;

            setData(
                (current) => {
                    const exists =
                        current
                            .parceiros
                            .some(
                                (item) =>
                                    item.id ===
                                    parceiro.id,
                            );

                    return {
                        ...current,

                        parceiros:
                            exists
                                ? current
                                    .parceiros
                                    .map(
                                        (
                                            item,
                                        ) =>
                                            item.id ===
                                            parceiro.id
                                                ? parceiro
                                                : item,
                                    )
                                : [
                                    parceiro,
                                    ...current
                                        .parceiros,
                                ],
                    };
                },
            );

            resetArquivos();

            setModalOpen(false);
            setEditingParceiro(
                null,
            );

            setForm(emptyForm);
            setUsuarios([]);

            setSnackbar({
                color:
                    "success",

                title:
                    isEditing
                        ? "Parceiro atualizado"
                        : "Parceiro criado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao salvar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar o parceiro.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(false);
        }
    }


    async function alternarAtivo(
        parceiro: Parceiro,
    ) {
        try {
            setAlterandoId(
                parceiro.id,
            );

            setSnackbar(null);

            const novoAtivo =
                !Boolean(
                    parceiro.ativo,
                );

            const response =
                await fetch(
                    `/api/admin/parceiros/${parceiro.id}`,
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

                                ativo:
                                novoAtivo,
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
                    result.message ||
                    "Não foi possível alterar o parceiro.",
                );
            }

            const atualizado =
                result
                    .data
                    .parceiro as Parceiro;

            setData(
                (current) => ({
                    ...current,

                    parceiros:
                        current
                            .parceiros
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
                    novoAtivo
                        ? "Parceiro ativado"
                        : "Parceiro desativado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar parceiro",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o parceiro.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoId(
                null,
            );
        }
    }


    async function excluirParceiro(
        parceiro: Parceiro,
    ) {
        const confirmado =
            window.confirm(
                `Excluir "${parceiro.nome}"? O parceiro perderá acesso às áreas vinculadas.`,
            );

        if (!confirmado) {
            return;
        }

        try {
            setAlterandoId(
                parceiro.id,
            );

            setSnackbar(null);

            const response =
                await fetch(
                    `/api/admin/parceiros/${parceiro.id}`,
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
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível excluir o parceiro.",
                );
            }

            setData(
                (current) => ({
                    ...current,

                    parceiros:
                        current
                            .parceiros
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    parceiro.id,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Parceiro excluído",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao excluir parceiro",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o parceiro.",

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
            <PageHeader
                title="Parceiros"
                subtitle="Gerencie parceiros, usuários responsáveis e identidade visual."
                actions={
                    <Button
                        onClick={
                            abrirCriacao
                        }
                    >
                        <Plus
                            size={17}
                        />

                        Criar parceiro
                    </Button>
                }
            />


            {data.parceiros.length ===
            0 ? (
                <EmptyState
                    icon={
                        <Building2
                            size={24}
                        />
                    }
                    title="Nenhum parceiro cadastrado"
                    description="Cadastre o primeiro parceiro para liberar cardápio, divulgações e identidade própria."
                    action={
                        <Button
                            onClick={
                                abrirCriacao
                            }
                        >
                            <Plus
                                size={
                                    17
                                }
                            />

                            Criar parceiro
                        </Button>
                    }
                />
            ) : (
                <Table
                    headers={[
                        "Parceiro",
                        "Endereço",
                        "Usuários",
                        "Tema",
                        "Status",
                        "Ações",
                    ]}
                >
                    {data.parceiros.map(
                        (
                            parceiro,
                        ) => {
                            const busy =
                                alterandoId ===
                                parceiro.id;

                            return (
                                <tr
                                    key={
                                        parceiro.id
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
                                            <div
                                                style={{
                                                    width:
                                                        44,

                                                    height:
                                                        44,

                                                    flexShrink:
                                                        0,

                                                    borderRadius:
                                                        12,

                                                    overflow:
                                                        "hidden",

                                                    display:
                                                        "grid",

                                                    placeItems:
                                                        "center",

                                                    border:
                                                        "1px solid var(--color-border)",
                                                }}
                                            >
                                                {parceiro
                                                    .tema
                                                    ?.logo
                                                    ?.public_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            parceiro
                                                                .tema
                                                                .logo!
                                                                .public_url!
                                                        }
                                                        alt=""
                                                        style={{
                                                            width:
                                                                "100%",

                                                            height:
                                                                "100%",

                                                            objectFit:
                                                                "contain",
                                                        }}
                                                    />
                                                ) : (
                                                    <Building2
                                                        size={
                                                            20
                                                        }
                                                    />
                                                )}
                                            </div>

                                            <div>
                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                    }}
                                                >
                                                    {
                                                        parceiro.nome
                                                    }
                                                </strong>

                                                <small
                                                    style={{
                                                        color:
                                                            "var(--color-text-muted)",
                                                    }}
                                                >
                                                    {
                                                        parceiro.codigo
                                                    }
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <strong>
                                            /parceiro/
                                            {
                                                parceiro.slug
                                            }
                                        </strong>

                                        <div
                                            style={{
                                                marginTop:
                                                    4,

                                                fontSize:
                                                    12,

                                                color:
                                                    "var(--color-text-muted)",
                                            }}
                                        >
                                            {parceiro.visivel_publico
                                                ? "Público"
                                                : "Oculto"}
                                        </div>
                                    </td>

                                    <td>
                                        <div
                                            style={{
                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                gap:
                                                    7,
                                            }}
                                        >
                                            <UsersRound
                                                size={
                                                    16
                                                }
                                            />

                                            <strong>
                                                {
                                                    parceiro
                                                        .usuarios
                                                        .length
                                                }
                                            </strong>
                                        </div>

                                        {parceiro
                                            .usuarios
                                            .length >
                                        0 ? (
                                            <small
                                                style={{
                                                    display:
                                                        "block",

                                                    marginTop:
                                                        4,

                                                    color:
                                                        "var(--color-text-muted)",
                                                }}
                                            >
                                                {parceiro
                                                    .usuarios
                                                    .map(
                                                        (
                                                            usuario,
                                                        ) =>
                                                            usuario.nome,
                                                    )
                                                    .join(
                                                        ", ",
                                                    )}
                                            </small>
                                        ) : null}
                                    </td>

                                    <td>
                                        <div
                                            style={{
                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                gap:
                                                    6,
                                            }}
                                        >
                                            {[
                                                parceiro
                                                    .tema
                                                    ?.cor_primaria,
                                                parceiro
                                                    .tema
                                                    ?.cor_secundaria,
                                                parceiro
                                                    .tema
                                                    ?.cor_fundo,
                                            ]
                                                .filter(
                                                    Boolean,
                                                )
                                                .map(
                                                    (
                                                        color,
                                                    ) => (
                                                        <span
                                                            key={
                                                                color
                                                            }
                                                            style={{
                                                                width:
                                                                    20,

                                                                height:
                                                                    20,

                                                                borderRadius:
                                                                    6,

                                                                background:
                                                                    color!,

                                                                border:
                                                                    "1px solid var(--color-border)",
                                                            }}
                                                        />
                                                    ),
                                                )}

                                            {!parceiro
                                                .tema ? (
                                                <span
                                                    style={{
                                                        color:
                                                            "var(--color-text-muted)",
                                                    }}
                                                >
                                                    Padrão
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>

                                    <td>
                                        <Badge
                                            color={
                                                parceiro.ativo
                                                    ? "success"
                                                    : "danger"
                                            }
                                        >
                                            {parceiro.ativo
                                                ? "Ativo"
                                                : "Inativo"}
                                        </Badge>
                                    </td>

                                    <td>
                                        <div className="bp-event-row-actions">
                                            <Button
                                                color={
                                                    parceiro.ativo
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
                                                        parceiro,
                                                    )
                                                }
                                            >
                                                {parceiro.ativo ? (
                                                    <PowerOff
                                                        size={
                                                            16
                                                        }
                                                    />
                                                ) : (
                                                    <Power
                                                        size={
                                                            16
                                                        }
                                                    />
                                                )}

                                                {parceiro.ativo
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
                                                    abrirEdicao(
                                                        parceiro,
                                                    )
                                                }
                                            >
                                                <Pencil
                                                    size={
                                                        16
                                                    }
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
                                                    excluirParceiro(
                                                        parceiro,
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={
                                                        16
                                                    }
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
            )}


            <Modal
                open={modalOpen}
                size="xl"
                title={
                    editingParceiro
                        ? "Editar parceiro"
                        : "Criar parceiro"
                }
                description={
                    editingParceiro
                        ? "Atualize os dados, responsáveis e identidade visual."
                        : "Cadastre a empresa ou estabelecimento parceiro."
                }
                onCloseAction={
                    fecharModal
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={
                                fecharModal
                            }
                            disabled={
                                salvando
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="parceiro-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : editingParceiro
                                    ? "Salvar alterações"
                                    : "Criar parceiro"}
                        </Button>
                    </>
                }
            >
                <form
                    id="parceiro-form"
                    className="bp-event-form"
                    onSubmit={
                        salvar
                    }
                >
                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Dados do parceiro
                                </h3>

                                <span className="bp-field-help">
                                    Identificação e endereço público do parceiro.
                                </span>
                            </div>

                            <Building2
                                size={20}
                            />
                        </div>

                        <div className="bp-event-grid">
                            <Input
                                label="Nome"
                                value={
                                    form.nome
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleNomeChange(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                maxLength={
                                    150
                                }
                                placeholder="Ex.: Bar do Campus"
                                required
                            />

                            <Input
                                label="Código"
                                value={
                                    form.codigo
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setCodigoEditado(
                                        true,
                                    );

                                    updateForm(
                                        "codigo",
                                        codigoify(
                                            event
                                                .target
                                                .value,
                                        ),
                                    );
                                }}
                                maxLength={
                                    60
                                }
                                helperText="Identificador interno. Ex.: bar_do_campus"
                                required
                            />

                            <Input
                                label="Endereço público"
                                value={
                                    form.slug
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setSlugEditado(
                                        true,
                                    );

                                    updateForm(
                                        "slug",
                                        slugify(
                                            event
                                                .target
                                                .value,
                                        ),
                                    );
                                }}
                                maxLength={
                                    150
                                }
                                helperText={
                                    form.slug
                                        ? `/parceiro/${form.slug}`
                                        : "O endereço será sugerido automaticamente."
                                }
                                required
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
                            placeholder="Descrição do estabelecimento ou parceiro."
                        />

                        <div className="bp-product-switches">
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

                                Parceiro ativo
                            </label>

                            <label className="bp-check">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.visivel_publico
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateForm(
                                            "visivel_publico",
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                />

                                Visível publicamente
                            </label>
                        </div>
                    </section>


                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Usuários responsáveis
                                </h3>

                                <span className="bp-field-help">
                                    Estes usuários poderão administrar os módulos vinculados ao parceiro.
                                </span>
                            </div>

                            <UsersRound
                                size={20}
                            />
                        </div>

                        <AsyncSelect
                            mode="multiple"
                            label="Usuários vinculados"
                            endpoint="/api/admin/usuarios/select"
                            placeholder="Busque por nome, nickname ou e-mail."
                            value={
                                usuarios
                            }
                            onChange={
                                setUsuarios
                            }
                            minChars={0}
                            maxSelected={
                                10
                            }
                            emptyMessage="Nenhum usuário encontrado."
                        />
                    </section>


                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Identidade visual
                                </h3>

                                <span className="bp-field-help">
                                    Se uma cor ficar vazia, a página poderá usar o padrão do sistema.
                                </span>
                            </div>

                            <Palette
                                size={20}
                            />
                        </div>

                        <div className="bp-event-grid">
                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "flex-end",

                                    gap:
                                        10,
                                }}
                            >
                                <div
                                    style={{
                                        flex:
                                            1,
                                    }}
                                >
                                    <Input
                                        label="Cor primária"
                                        value={
                                            form.cor_primaria
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "cor_primaria",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="#9CD91A"
                                        maxLength={
                                            7
                                        }
                                    />
                                </div>

                                <ColorPreview
                                    value={
                                        form.cor_primaria
                                    }
                                />
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "flex-end",

                                    gap:
                                        10,
                                }}
                            >
                                <div
                                    style={{
                                        flex:
                                            1,
                                    }}
                                >
                                    <Input
                                        label="Cor secundária"
                                        value={
                                            form.cor_secundaria
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "cor_secundaria",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="#F5F2E8"
                                        maxLength={
                                            7
                                        }
                                    />
                                </div>

                                <ColorPreview
                                    value={
                                        form.cor_secundaria
                                    }
                                />
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "flex-end",

                                    gap:
                                        10,
                                }}
                            >
                                <div
                                    style={{
                                        flex:
                                            1,
                                    }}
                                >
                                    <Input
                                        label="Cor de fundo"
                                        value={
                                            form.cor_fundo
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "cor_fundo",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="#141414"
                                        maxLength={
                                            7
                                        }
                                    />
                                </div>

                                <ColorPreview
                                    value={
                                        form.cor_fundo
                                    }
                                />
                            </div>

                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "flex-end",

                                    gap:
                                        10,
                                }}
                            >
                                <div
                                    style={{
                                        flex:
                                            1,
                                    }}
                                >
                                    <Input
                                        label="Cor do texto"
                                        value={
                                            form.cor_texto
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateForm(
                                                "cor_texto",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="#FFFFFF"
                                        maxLength={
                                            7
                                        }
                                    />
                                </div>

                                <ColorPreview
                                    value={
                                        form.cor_texto
                                    }
                                />
                            </div>
                        </div>


                        <div
                            style={{
                                marginTop:
                                    18,

                                padding:
                                    18,

                                border:
                                    "1px solid var(--color-border)",

                                borderRadius:
                                    14,

                                background:
                                temaPreview.fundo,

                                color:
                                temaPreview.texto,
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
                                }}
                            >
                                <div
                                    style={{
                                        width:
                                            42,

                                        height:
                                            42,

                                        borderRadius:
                                            12,

                                        display:
                                            "grid",

                                        placeItems:
                                            "center",

                                        background:
                                        temaPreview.primaria,

                                        color:
                                        temaPreview.fundo,
                                    }}
                                >
                                    <Building2
                                        size={
                                            20
                                        }
                                    />
                                </div>

                                <div>
                                    <strong>
                                        {form.nome ||
                                            "Nome do parceiro"}
                                    </strong>

                                    <div
                                        style={{
                                            color:
                                            temaPreview.secundaria,

                                            fontSize:
                                                13,

                                            marginTop:
                                                3,
                                        }}
                                    >
                                        Prévia básica do tema
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>


                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Logo
                                </h3>

                                <span className="bp-field-help">
                                    Imagem utilizada na identificação do parceiro. Máximo de 5MB.
                                </span>
                            </div>

                            <ImagePlus
                                size={20}
                            />
                        </div>

                        <input
                            ref={
                                logoInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={
                                handleLogoChange
                            }
                        />

                        {logoAtual ? (
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        logoAtual
                                    }
                                    alt="Logo do parceiro"
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
                                            logoInputRef
                                                .current
                                                ?.click()
                                        }
                                    >
                                        <Upload
                                            size={
                                                15
                                            }
                                        />

                                        Trocar logo
                                    </Button>

                                    <Button
                                        type="button"
                                        color="danger"
                                        variant="soft"
                                        size="sm"
                                        onClick={() => {
                                            limparLogoNovo();

                                            setRemoverLogo(
                                                true,
                                            );
                                        }}
                                    >
                                        <X
                                            size={
                                                15
                                            }
                                        />

                                        Remover
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                role="button"
                                tabIndex={0}
                                className="bp-product-dropzone"
                                onClick={() =>
                                    logoInputRef
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

                                        logoInputRef
                                            .current
                                            ?.click();
                                    }
                                }}
                            >
                                <div className="bp-product-dropzone-content">
                                    <Upload
                                        size={
                                            26
                                        }
                                    />

                                    <strong>
                                        Clique para selecionar a logo
                                    </strong>

                                    <span>
                                        PNG, JPG ou WEBP.
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>


                    <section className="bp-product-section">
                        <div className="bp-product-section-header">
                            <div>
                                <h3 className="bp-product-section-title">
                                    Banner
                                </h3>

                                <span className="bp-field-help">
                                    Imagem horizontal para a página pública do parceiro. Máximo de 5MB.
                                </span>
                            </div>

                            <ImagePlus
                                size={20}
                            />
                        </div>

                        <input
                            ref={
                                bannerInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={
                                handleBannerChange
                            }
                        />

                        {bannerAtual ? (
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        bannerAtual
                                    }
                                    alt="Banner do parceiro"
                                />

                                <div className="bp-event-banner-editor-actions">
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="soft"
                                        size="sm"
                                        onClick={() =>
                                            bannerInputRef
                                                .current
                                                ?.click()
                                        }
                                    >
                                        <Upload
                                            size={
                                                15
                                            }
                                        />

                                        Trocar banner
                                    </Button>

                                    <Button
                                        type="button"
                                        color="danger"
                                        variant="soft"
                                        size="sm"
                                        onClick={() => {
                                            limparBannerNovo();

                                            setRemoverBanner(
                                                true,
                                            );
                                        }}
                                    >
                                        <X
                                            size={
                                                15
                                            }
                                        />

                                        Remover
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                role="button"
                                tabIndex={0}
                                className="bp-product-dropzone"
                                onClick={() =>
                                    bannerInputRef
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

                                        bannerInputRef
                                            .current
                                            ?.click();
                                    }
                                }}
                            >
                                <div className="bp-product-dropzone-content">
                                    <Upload
                                        size={
                                            26
                                        }
                                    />

                                    <strong>
                                        Clique para selecionar o banner
                                    </strong>

                                    <span>
                                        Prefira uma imagem horizontal.
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>
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