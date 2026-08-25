"use client";

import {
    ChangeEvent,
    FormEvent,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    FolderOpen,
    ImagePlus,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Store,
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


type Categoria = {
    id: number;

    nome: string;
    descricao: string | null;

    ordem: number;
    ativo: number;

    quantidade_itens: number;
};


type ItemImagem = {
    sys_arquivo_id: number;
    public_url: string | null;
    original_name: string;
};


type Item = {
    id: number;

    crd_categoria_id: number;

    nome: string;
    descricao: string | null;

    preco: number;

    ordem: number;
    ativo: number;

    categoria: {
        id: number;
        nome: string;
        ativo: number;
    };

    imagem: ItemImagem | null;
};


type CardapioData = {
    categorias: Categoria[];
    itens: Item[];
};


type Props = {
    parceiro: {
        id: number;
        nome: string;
    };

    initialData: CardapioData;
};


type CategoriaForm = {
    nome: string;
    descricao: string;
    ordem: string;
    ativo: boolean;
};


type ItemForm = {
    crd_categoria_id: string;

    nome: string;
    descricao: string;

    preco: string;

    ordem: string;
    ativo: boolean;
};


const emptyCategoriaForm: CategoriaForm = {
    nome: "",
    descricao: "",
    ordem: "0",
    ativo: true,
};


const emptyItemForm: ItemForm = {
    crd_categoria_id: "",

    nome: "",
    descricao: "",

    preco: "",

    ordem: "0",
    ativo: true,
};


function money(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        },
    ).format(value);
}


function parseMoneyInput(
    value: string,
) {
    const normalized =
        value
            .trim()
            .replace(/\./g, "")
            .replace(",", ".");

    return Number(
        normalized,
    );
}


function categoriaToForm(
    categoria: Categoria,
): CategoriaForm {
    return {
        nome:
        categoria.nome,

        descricao:
            categoria.descricao ??
            "",

        ordem:
            String(
                categoria.ordem,
            ),

        ativo:
            Boolean(
                categoria.ativo,
            ),
    };
}


function itemToForm(
    item: Item,
): ItemForm {
    return {
        crd_categoria_id:
            String(
                item.crd_categoria_id,
            ),

        nome:
        item.nome,

        descricao:
            item.descricao ??
            "",

        preco:
            item.preco
                .toFixed(2)
                .replace(
                    ".",
                    ",",
                ),

        ordem:
            String(
                item.ordem,
            ),

        ativo:
            Boolean(
                item.ativo,
            ),
    };
}


export default function ParceiroCardapioClient({
                                                   parceiro,
                                                   initialData,
                                               }: Props) {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );

    const [
        data,
        setData,
    ] =
        useState(
            initialData,
        );

    const [
        categoriaModalOpen,
        setCategoriaModalOpen,
    ] =
        useState(false);

    const [
        editingCategoria,
        setEditingCategoria,
    ] =
        useState<Categoria | null>(
            null,
        );

    const [
        categoriaForm,
        setCategoriaForm,
    ] =
        useState<CategoriaForm>(
            emptyCategoriaForm,
        );


    const [
        itemModalOpen,
        setItemModalOpen,
    ] =
        useState(false);

    const [
        editingItem,
        setEditingItem,
    ] =
        useState<Item | null>(
            null,
        );

    const [
        itemForm,
        setItemForm,
    ] =
        useState<ItemForm>(
            emptyItemForm,
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


    const categoriasOptions =
        useMemo(
            () =>
                data
                    .categorias
                    .filter(
                        (
                            categoria,
                        ) =>
                            Boolean(
                                categoria.ativo,
                            ) ||
                            categoria.id ===
                            editingItem
                                ?.crd_categoria_id,
                    )
                    .map(
                        (
                            categoria,
                        ) => ({
                            value:
                            categoria.id,

                            label:
                            categoria.nome,
                        }),
                    ),
            [
                data.categorias,
                editingItem,
            ],
        );


    function updateCategoriaForm<
        K extends keyof CategoriaForm,
    >(
        key: K,
        value: CategoriaForm[K],
    ) {
        setCategoriaForm(
            (current) => ({
                ...current,
                [key]:
                value,
            }),
        );
    }


    function updateItemForm<
        K extends keyof ItemForm,
    >(
        key: K,
        value: ItemForm[K],
    ) {
        setItemForm(
            (current) => ({
                ...current,
                [key]:
                value,
            }),
        );
    }


    function abrirCriarCategoria() {
        setEditingCategoria(
            null,
        );

        setCategoriaForm({
            ...emptyCategoriaForm,

            ordem:
                String(
                    data
                        .categorias
                        .length,
                ),
        });

        setCategoriaModalOpen(
            true,
        );

        setSnackbar(null);
    }


    function abrirEditarCategoria(
        categoria: Categoria,
    ) {
        setEditingCategoria(
            categoria,
        );

        setCategoriaForm(
            categoriaToForm(
                categoria,
            ),
        );

        setCategoriaModalOpen(
            true,
        );

        setSnackbar(null);
    }


    function fecharCategoriaModal() {
        if (salvando) {
            return;
        }

        setCategoriaModalOpen(
            false,
        );

        setEditingCategoria(
            null,
        );

        setCategoriaForm(
            emptyCategoriaForm,
        );
    }


    async function salvarCategoria(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const ordem =
            Number(
                categoriaForm.ordem,
            );

        if (
            categoriaForm
                .nome
                .trim()
                .length < 2
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Nome obrigatório",

                message:
                    "Informe o nome da categoria.",
            });

            return;
        }

        if (
            !Number.isInteger(
                ordem,
            ) ||
            ordem < 0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Ordem inválida",

                message:
                    "Informe uma ordem igual ou maior que zero.",
            });

            return;
        }

        try {
            setSalvando(true);
            setSnackbar(null);

            const isEditing =
                Boolean(
                    editingCategoria,
                );

            const response =
                await fetch(
                    isEditing
                        ? `/api/parceiro/cardapio/categorias/${editingCategoria!.id}`
                        : "/api/parceiro/cardapio/categorias",
                    {
                        method:
                            isEditing
                                ? "PATCH"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                nome:
                                categoriaForm.nome,

                                descricao:
                                categoriaForm.descricao,

                                ordem,

                                ativo:
                                categoriaForm.ativo,
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
                    "Não foi possível salvar a categoria.",
                );
            }

            const categoria =
                result
                    .data
                    .categoria as Categoria;

            setData(
                (current) => {
                    const exists =
                        current
                            .categorias
                            .some(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    categoria.id,
                            );

                    return {
                        ...current,

                        categorias:
                            exists
                                ? current
                                    .categorias
                                    .map(
                                        (
                                            item,
                                        ) =>
                                            item.id ===
                                            categoria.id
                                                ? categoria
                                                : item,
                                    )
                                : [
                                    ...current
                                        .categorias,
                                    categoria,
                                ],
                    };
                },
            );

            fecharCategoriaModal();

            setSnackbar({
                color:
                    "success",

                title:
                    isEditing
                        ? "Categoria atualizada"
                        : "Categoria criada",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao salvar categoria",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar a categoria.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(false);
        }
    }


    async function alternarCategoria(
        categoria: Categoria,
    ) {
        const key =
            `categoria:${categoria.id}`;

        try {
            setAlterandoKey(
                key,
            );

            const novoAtivo =
                !Boolean(
                    categoria.ativo,
                );

            const response =
                await fetch(
                    `/api/parceiro/cardapio/categorias/${categoria.id}`,
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
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message,
                );
            }

            const atualizado =
                result
                    .data
                    .categoria as Categoria;

            setData(
                (current) => ({
                    ...current,

                    categorias:
                        current
                            .categorias
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
                        ? "Categoria ativada"
                        : "Categoria desativada",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar categoria",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar a categoria.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoKey(
                null,
            );
        }
    }


    async function excluirCategoria(
        categoria: Categoria,
    ) {
        if (
            !window.confirm(
                `Excluir a categoria "${categoria.nome}"?`,
            )
        ) {
            return;
        }

        const key =
            `categoria:${categoria.id}`;

        try {
            setAlterandoKey(
                key,
            );

            const response =
                await fetch(
                    `/api/parceiro/cardapio/categorias/${categoria.id}`,
                    {
                        method:
                            "DELETE",
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message,
                );
            }

            setData(
                (current) => ({
                    ...current,

                    categorias:
                        current
                            .categorias
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    categoria.id,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Categoria excluída",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao excluir categoria",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir a categoria.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoKey(
                null,
            );
        }
    }


    function limparImagemNova() {
        if (imagemPreview) {
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
                .value = "";
        }
    }


    function abrirCriarItem() {
        if (
            data
                .categorias
                .filter(
                    (
                        categoria,
                    ) =>
                        Boolean(
                            categoria.ativo,
                        ),
                )
                .length === 0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Crie uma categoria primeiro",

                message:
                    "O cardápio precisa possuir pelo menos uma categoria ativa antes de cadastrar itens.",
            });

            return;
        }

        limparImagemNova();

        setRemoverImagem(
            false,
        );

        setEditingItem(
            null,
        );

        const primeiraCategoria =
            data
                .categorias
                .find(
                    (
                        categoria,
                    ) =>
                        Boolean(
                            categoria.ativo,
                        ),
                );

        setItemForm({
            ...emptyItemForm,

            crd_categoria_id:
                primeiraCategoria
                    ? String(
                        primeiraCategoria.id,
                    )
                    : "",

            ordem:
                String(
                    data
                        .itens
                        .length,
                ),
        });

        setItemModalOpen(
            true,
        );

        setSnackbar(null);
    }


    function abrirEditarItem(
        item: Item,
    ) {
        limparImagemNova();

        setRemoverImagem(
            false,
        );

        setEditingItem(
            item,
        );

        setItemForm(
            itemToForm(
                item,
            ),
        );

        setItemModalOpen(
            true,
        );

        setSnackbar(null);
    }


    function fecharItemModal() {
        if (salvando) {
            return;
        }

        limparImagemNova();

        setRemoverImagem(
            false,
        );

        setItemModalOpen(
            false,
        );

        setEditingItem(
            null,
        );

        setItemForm(
            emptyItemForm,
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

        if (!file) {
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
            5 * 1024 * 1024
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


    const imagemAtual =
        imagemPreview ??
        (
            !removerImagem
                ? editingItem
                    ?.imagem
                    ?.public_url ??
                null
                : null
        );


    function buildItemFormData() {
        const payload =
            new FormData();

        payload.set(
            "crd_categoria_id",
            itemForm
                .crd_categoria_id,
        );

        payload.set(
            "nome",
            itemForm.nome,
        );

        payload.set(
            "descricao",
            itemForm.descricao,
        );

        payload.set(
            "preco",
            String(
                parseMoneyInput(
                    itemForm.preco,
                ),
            ),
        );

        payload.set(
            "ordem",
            itemForm.ordem,
        );

        payload.set(
            "ativo",
            itemForm.ativo
                ? "1"
                : "0",
        );

        payload.set(
            "remover_imagem",
            removerImagem
                ? "1"
                : "0",
        );

        if (imagemFile) {
            payload.set(
                "imagem",
                imagemFile,
            );
        }

        return payload;
    }


    async function salvarItem(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const categoriaId =
            Number(
                itemForm
                    .crd_categoria_id,
            );

        const preco =
            parseMoneyInput(
                itemForm.preco,
            );

        const ordem =
            Number(
                itemForm.ordem,
            );

        if (
            !Number.isInteger(
                categoriaId,
            ) ||
            categoriaId <= 0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Categoria obrigatória",

                message:
                    "Selecione uma categoria.",
            });

            return;
        }

        if (
            itemForm
                .nome
                .trim()
                .length < 2
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Nome obrigatório",

                message:
                    "Informe o nome do item.",
            });

            return;
        }

        if (
            !Number.isFinite(
                preco,
            ) ||
            preco < 0
        ) {
            setSnackbar({
                color:
                    "warning",

                title:
                    "Preço inválido",

                message:
                    "Informe um preço válido.",
            });

            return;
        }

        if (
            !Number.isInteger(
                ordem,
            ) ||
            ordem < 0
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

        try {
            setSalvando(true);
            setSnackbar(null);

            const isEditing =
                Boolean(
                    editingItem,
                );

            const response =
                await fetch(
                    isEditing
                        ? `/api/parceiro/cardapio/itens/${editingItem!.id}`
                        : "/api/parceiro/cardapio/itens",
                    {
                        method:
                            isEditing
                                ? "PATCH"
                                : "POST",

                        body:
                            buildItemFormData(),
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
                    "Não foi possível salvar o item.",
                );
            }

            const item =
                result
                    .data
                    .item as Item;

            setData(
                (current) => {
                    const exists =
                        current
                            .itens
                            .some(
                                (
                                    existente,
                                ) =>
                                    existente.id ===
                                    item.id,
                            );

                    return {
                        ...current,

                        itens:
                            exists
                                ? current
                                    .itens
                                    .map(
                                        (
                                            existente,
                                        ) =>
                                            existente.id ===
                                            item.id
                                                ? item
                                                : existente,
                                    )
                                : [
                                    ...current
                                        .itens,
                                    item,
                                ],

                        categorias:
                            !exists
                                ? current
                                    .categorias
                                    .map(
                                        (
                                            categoria,
                                        ) =>
                                            categoria.id ===
                                            item.crd_categoria_id
                                                ? {
                                                    ...categoria,

                                                    quantidade_itens:
                                                        categoria.quantidade_itens +
                                                        1,
                                                }
                                                : categoria,
                                    )
                                : current.categorias,
                    };
                },
            );

            fecharItemModal();

            setSnackbar({
                color:
                    "success",

                title:
                    isEditing
                        ? "Item atualizado"
                        : "Item criado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao salvar item",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar o item.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(false);
        }
    }


    async function alternarItem(
        item: Item,
    ) {
        const key =
            `item:${item.id}`;

        try {
            setAlterandoKey(
                key,
            );

            const novoAtivo =
                !Boolean(
                    item.ativo,
                );

            const response =
                await fetch(
                    `/api/parceiro/cardapio/itens/${item.id}`,
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
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message,
                );
            }

            const atualizado =
                result
                    .data
                    .item as Item;

            setData(
                (current) => ({
                    ...current,

                    itens:
                        current
                            .itens
                            .map(
                                (
                                    existente,
                                ) =>
                                    existente.id ===
                                    atualizado.id
                                        ? atualizado
                                        : existente,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    novoAtivo
                        ? "Item ativado"
                        : "Item desativado",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao alterar item",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o item.",

                autoClose:
                    false,
            });
        } finally {
            setAlterandoKey(
                null,
            );
        }
    }


    async function excluirItem(
        item: Item,
    ) {
        if (
            !window.confirm(
                `Excluir "${item.nome}" do cardápio?`,
            )
        ) {
            return;
        }

        const key =
            `item:${item.id}`;

        try {
            setAlterandoKey(
                key,
            );

            const response =
                await fetch(
                    `/api/parceiro/cardapio/itens/${item.id}`,
                    {
                        method:
                            "DELETE",
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message,
                );
            }

            setData(
                (current) => ({
                    ...current,

                    itens:
                        current
                            .itens
                            .filter(
                                (
                                    existente,
                                ) =>
                                    existente.id !==
                                    item.id,
                            ),

                    categorias:
                        current
                            .categorias
                            .map(
                                (
                                    categoria,
                                ) =>
                                    categoria.id ===
                                    item.crd_categoria_id
                                        ? {
                                            ...categoria,

                                            quantidade_itens:
                                                Math.max(
                                                    0,
                                                    categoria.quantidade_itens -
                                                    1,
                                                ),
                                        }
                                        : categoria,
                            ),
                }),
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Item excluído",

                message:
                result.message,
            });
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao excluir item",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o item.",

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
                title="Cardápio"
                subtitle={`Gerencie categorias e itens do cardápio de ${parceiro.nome}.`}
                actions={
                    <div
                        style={{
                            display:
                                "flex",

                            gap:
                                8,

                            flexWrap:
                                "wrap",
                        }}
                    >
                        <Button
                            color="secondary"
                            variant="soft"
                            onClick={
                                abrirCriarCategoria
                            }
                        >
                            <FolderOpen
                                size={17}
                            />

                            Nova categoria
                        </Button>

                        <Button
                            onClick={
                                abrirCriarItem
                            }
                        >
                            <Plus
                                size={17}
                            />

                            Novo item
                        </Button>
                    </div>
                }
            />


            <section
                style={{
                    marginBottom:
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
                            Categorias
                        </h2>

                        <p className="bp-section-subtitle">
                            Organize os itens exibidos no cardápio.
                        </p>
                    </div>

                    <Badge color="secondary">
                        {data.categorias.length} categoria(s)
                    </Badge>
                </div>


                {data.categorias.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <FolderOpen
                                size={24}
                            />
                        }
                        title="Nenhuma categoria"
                        description="Crie a primeira categoria para começar a montar o cardápio."
                        action={
                            <Button
                                onClick={
                                    abrirCriarCategoria
                                }
                            >
                                <Plus
                                    size={17}
                                />

                                Criar categoria
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <Table
                            headers={[
                                "Categoria",
                                "Itens",
                                "Ordem",
                                "Status",
                                "Ações",
                            ]}
                        >
                            {data.categorias.map(
                                (
                                    categoria,
                                ) => {
                                    const busy =
                                        alterandoKey ===
                                        `categoria:${categoria.id}`;

                                    return (
                                        <tr
                                            key={
                                                categoria.id
                                            }
                                        >
                                            <td>
                                                <strong>
                                                    {
                                                        categoria.nome
                                                    }
                                                </strong>

                                                {categoria.descricao ? (
                                                    <div className="bp-product-table-meta">
                                                        {
                                                            categoria.descricao
                                                        }
                                                    </div>
                                                ) : null}
                                            </td>

                                            <td>
                                                {
                                                    categoria.quantidade_itens
                                                }
                                            </td>

                                            <td>
                                                {
                                                    categoria.ordem
                                                }
                                            </td>

                                            <td>
                                                <Badge
                                                    color={
                                                        categoria.ativo
                                                            ? "success"
                                                            : "danger"
                                                    }
                                                >
                                                    {categoria.ativo
                                                        ? "Ativa"
                                                        : "Inativa"}
                                                </Badge>
                                            </td>

                                            <td>
                                                <div className="bp-product-row-actions">
                                                    <Button
                                                        color={
                                                            categoria.ativo
                                                                ? "warning"
                                                                : "success"
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            alternarCategoria(
                                                                categoria,
                                                            )
                                                        }
                                                    >
                                                        {categoria.ativo ? (
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

                                                        {categoria.ativo
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
                                                            abrirEditarCategoria(
                                                                categoria,
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
                                                            excluirCategoria(
                                                                categoria,
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


                        <div className="bp-product-admin-mobile-list">
                            {data.categorias.map(
                                (
                                    categoria,
                                ) => {
                                    const busy =
                                        alterandoKey ===
                                        `categoria:${categoria.id}`;

                                    return (
                                        <article
                                            key={
                                                categoria.id
                                            }
                                            className="bp-product-admin-mobile-card"
                                        >
                                            <div className="bp-product-admin-mobile-head">
                                                <div className="bp-product-admin-mobile-image">
                                                    <FolderOpen
                                                        size={
                                                            24
                                                        }
                                                    />
                                                </div>

                                                <div className="bp-product-admin-mobile-title">
                                                    <div className="bp-product-admin-mobile-title-row">
                                                        <strong>
                                                            {
                                                                categoria.nome
                                                            }
                                                        </strong>

                                                        <Badge
                                                            color={
                                                                categoria.ativo
                                                                    ? "success"
                                                                    : "danger"
                                                            }
                                                        >
                                                            {categoria.ativo
                                                                ? "Ativa"
                                                                : "Inativa"}
                                                        </Badge>
                                                    </div>

                                                    <span>
                                                        Ordem{" "}
                                                        {
                                                            categoria.ordem
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            categoria.quantidade_itens
                                                        }{" "}
                                                        item(ns)
                                                    </small>
                                                </div>
                                            </div>

                                            {categoria.descricao ? (
                                                <p className="bp-section-subtitle">
                                                    {
                                                        categoria.descricao
                                                    }
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
                                                        abrirEditarCategoria(
                                                            categoria,
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
                                                    color={
                                                        categoria.ativo
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        alternarCategoria(
                                                            categoria,
                                                        )
                                                    }
                                                >
                                                    {categoria.ativo ? (
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

                                                    {categoria.ativo
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
                                                        excluirCategoria(
                                                            categoria,
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
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    </>
                )}
            </section>


            <section>
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
                            Itens
                        </h2>

                        <p className="bp-section-subtitle">
                            Produtos exibidos aos clientes no cardápio.
                        </p>
                    </div>

                    <Badge color="secondary">
                        {data.itens.length} item(ns)
                    </Badge>
                </div>


                {data.itens.length ===
                0 ? (
                    <EmptyState
                        icon={
                            <Store
                                size={24}
                            />
                        }
                        title="Nenhum item cadastrado"
                        description="Cadastre o primeiro item do cardápio."
                        action={
                            <Button
                                onClick={
                                    abrirCriarItem
                                }
                            >
                                <Plus
                                    size={17}
                                />

                                Criar item
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <Table
                            headers={[
                                "Item",
                                "Categoria",
                                "Preço",
                                "Ordem",
                                "Status",
                                "Ações",
                            ]}
                        >
                            {data.itens.map(
                                (
                                    item,
                                ) => {
                                    const busy =
                                        alterandoKey ===
                                        `item:${item.id}`;

                                    return (
                                        <tr
                                            key={
                                                item.id
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
                                                        {item
                                                            .imagem
                                                            ?.public_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={
                                                                    item
                                                                        .imagem
                                                                        .public_url
                                                                }
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <Store
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                item.nome
                                                            }
                                                        </strong>

                                                        {item.descricao ? (
                                                            <div className="bp-product-table-meta">
                                                                {
                                                                    item.descricao
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    item
                                                        .categoria
                                                        .nome
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {money(
                                                        item.preco,
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    item.ordem
                                                }
                                            </td>

                                            <td>
                                                <Badge
                                                    color={
                                                        item.ativo
                                                            ? "success"
                                                            : "danger"
                                                    }
                                                >
                                                    {item.ativo
                                                        ? "Ativo"
                                                        : "Inativo"}
                                                </Badge>
                                            </td>

                                            <td>
                                                <div className="bp-product-row-actions">
                                                    <Button
                                                        color={
                                                            item.ativo
                                                                ? "warning"
                                                                : "success"
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={
                                                            busy
                                                        }
                                                        onClick={() =>
                                                            alternarItem(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        {item.ativo ? (
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

                                                        {item.ativo
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
                                                            abrirEditarItem(
                                                                item,
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
                                                            excluirItem(
                                                                item,
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


                        <div className="bp-product-admin-mobile-list">
                            {data.itens.map(
                                (
                                    item,
                                ) => {
                                    const busy =
                                        alterandoKey ===
                                        `item:${item.id}`;

                                    return (
                                        <article
                                            key={
                                                item.id
                                            }
                                            className="bp-product-admin-mobile-card"
                                        >
                                            <div className="bp-product-admin-mobile-head">
                                                <div className="bp-product-admin-mobile-image">
                                                    {item
                                                        .imagem
                                                        ?.public_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                item
                                                                    .imagem
                                                                    .public_url
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <Store
                                                            size={
                                                                24
                                                            }
                                                        />
                                                    )}
                                                </div>

                                                <div className="bp-product-admin-mobile-title">
                                                    <div className="bp-product-admin-mobile-title-row">
                                                        <strong>
                                                            {
                                                                item.nome
                                                            }
                                                        </strong>

                                                        <Badge
                                                            color={
                                                                item.ativo
                                                                    ? "success"
                                                                    : "danger"
                                                            }
                                                        >
                                                            {item.ativo
                                                                ? "Ativo"
                                                                : "Inativo"}
                                                        </Badge>
                                                    </div>

                                                    <span>
                                                        {
                                                            item
                                                                .categoria
                                                                .nome
                                                        }
                                                    </span>

                                                    <small>
                                                        Ordem{" "}
                                                        {
                                                            item.ordem
                                                        }
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="bp-product-admin-mobile-info">
                                                <div>
                                                    <span>
                                                        Preço
                                                    </span>

                                                    <strong>
                                                        {money(
                                                            item.preco,
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Categoria
                                                    </span>

                                                    <strong>
                                                        {
                                                            item
                                                                .categoria
                                                                .nome
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="bp-product-admin-mobile-actions">
                                                <Button
                                                    color="secondary"
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        abrirEditarItem(
                                                            item,
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
                                                    color={
                                                        item.ativo
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    variant="soft"
                                                    size="sm"
                                                    disabled={
                                                        busy
                                                    }
                                                    onClick={() =>
                                                        alternarItem(
                                                            item,
                                                        )
                                                    }
                                                >
                                                    {item.ativo ? (
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

                                                    {item.ativo
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
                                                        excluirItem(
                                                            item,
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
                    categoriaModalOpen
                }
                title={
                    editingCategoria
                        ? "Editar categoria"
                        : "Nova categoria"
                }
                description="Organize os itens do cardápio em grupos."
                onCloseAction={
                    fecharCategoriaModal
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
                                fecharCategoriaModal
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="categoria-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar categoria"}
                        </Button>
                    </>
                }
            >
                <form
                    id="categoria-form"
                    onSubmit={
                        salvarCategoria
                    }
                >
                    <div className="bp-event-grid">
                        <Input
                            label="Nome"
                            value={
                                categoriaForm.nome
                            }
                            onChange={(
                                event,
                            ) =>
                                updateCategoriaForm(
                                    "nome",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            maxLength={
                                120
                            }
                            placeholder="Ex.: Bebidas"
                            required
                        />

                        <Input
                            label="Ordem"
                            type="number"
                            min="0"
                            step="1"
                            value={
                                categoriaForm.ordem
                            }
                            onChange={(
                                event,
                            ) =>
                                updateCategoriaForm(
                                    "ordem",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            required
                        />
                    </div>

                    <Textarea
                        label="Descrição"
                        value={
                            categoriaForm.descricao
                        }
                        onChange={(
                            event,
                        ) =>
                            updateCategoriaForm(
                                "descricao",
                                event
                                    .target
                                    .value,
                            )
                        }
                        maxLength={
                            500
                        }
                        rows={3}
                    />

                    <label className="bp-check">
                        <input
                            type="checkbox"
                            checked={
                                categoriaForm.ativo
                            }
                            onChange={(
                                event,
                            ) =>
                                updateCategoriaForm(
                                    "ativo",
                                    event
                                        .target
                                        .checked,
                                )
                            }
                        />

                        Categoria ativa
                    </label>
                </form>
            </Modal>


            <Modal
                open={
                    itemModalOpen
                }
                size="lg"
                title={
                    editingItem
                        ? "Editar item"
                        : "Novo item"
                }
                description="Cadastre o produto que será exibido no cardápio."
                onCloseAction={
                    fecharItemModal
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
                                fecharItemModal
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            form="item-form"
                            disabled={
                                salvando
                            }
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar item"}
                        </Button>
                    </>
                }
            >
                <form
                    id="item-form"
                    onSubmit={
                        salvarItem
                    }
                >
                    <div className="bp-event-grid">
                        <SelectMenu
                            label="Categoria"
                            options={
                                categoriasOptions
                            }
                            value={
                                itemForm
                                    .crd_categoria_id
                            }
                            onChange={(
                                value,
                            ) =>
                                updateItemForm(
                                    "crd_categoria_id",
                                    value,
                                )
                            }
                            placeholder="Selecione uma categoria"
                            required
                        />

                        <Input
                            label="Nome"
                            value={
                                itemForm.nome
                            }
                            onChange={(
                                event,
                            ) =>
                                updateItemForm(
                                    "nome",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            maxLength={
                                150
                            }
                            placeholder="Ex.: X-Bacon"
                            required
                        />

                        <Input
                            label="Preço"
                            value={
                                itemForm.preco
                            }
                            onChange={(
                                event,
                            ) =>
                                updateItemForm(
                                    "preco",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            inputMode="decimal"
                            placeholder="Ex.: 27,90"
                            required
                        />

                        <Input
                            label="Ordem"
                            type="number"
                            min="0"
                            step="1"
                            value={
                                itemForm.ordem
                            }
                            onChange={(
                                event,
                            ) =>
                                updateItemForm(
                                    "ordem",
                                    event
                                        .target
                                        .value,
                                )
                            }
                            required
                        />
                    </div>

                    <Textarea
                        label="Descrição"
                        value={
                            itemForm.descricao
                        }
                        onChange={(
                            event,
                        ) =>
                            updateItemForm(
                                "descricao",
                                event
                                    .target
                                    .value,
                            )
                        }
                        rows={4}
                        placeholder="Ex.: pão, carne, bacon, queijo..."
                    />

                    <label className="bp-check">
                        <input
                            type="checkbox"
                            checked={
                                itemForm.ativo
                            }
                            onChange={(
                                event,
                            ) =>
                                updateItemForm(
                                    "ativo",
                                    event
                                        .target
                                        .checked,
                                )
                            }
                        />

                        Item ativo
                    </label>


                    <div
                        style={{
                            marginTop:
                                20,
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
                                    Imagem
                                </strong>

                                <div className="bp-field-help">
                                    Opcional · máximo 5MB.
                                </div>
                            </div>

                            <ImagePlus
                                size={
                                    20
                                }
                            />
                        </div>

                        {imagemAtual ? (
                            <div className="bp-event-banner-editor">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        imagemAtual
                                    }
                                    alt="Imagem do item"
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

                                        Trocar
                                    </Button>

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
                                        size={
                                            25
                                        }
                                    />

                                    <strong>
                                        Selecionar imagem
                                    </strong>

                                    <span>
                                        PNG, JPG ou WEBP.
                                    </span>
                                </div>
                            </div>
                        )}
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