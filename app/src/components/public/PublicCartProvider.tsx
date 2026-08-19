"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type PublicCartCampoValor = {
    campoId: number;
    codigo: string;
    nome: string;
    valor: string;
};

export type PublicCartComponente = {
    componenteId: number;
    produtoId: number;
    produtoNome: string;
    quantidadePorKit: number;
    variacaoId: number | null;
    variacaoNome: string | null;
    campos: PublicCartCampoValor[];
};

export type PublicCartItem = {
    lineKey: string;

    produtoId: number;
    variacaoId: number | null;
    quantidade: number;

    campos: PublicCartCampoValor[];
    componentes: PublicCartComponente[];

    // Cache visual. O backend nunca confia nestes dados para fechar pedido.
    produtoNome: string;
    produtoCodigo: string;
    variacaoNome: string | null;
    imagemUrl: string | null;
    precoVisual: number;
};

type CartStorageV2 = {
    version: 2;
    items: PublicCartItem[];
};

type CartStorageV1 = {
    version: 1;
    items: Array<
        Omit<
            PublicCartItem,
            "lineKey" | "campos" | "componentes"
        >
    >;
};

type AddCartItem = Omit<
    PublicCartItem,
    "lineKey" | "quantidade"
> & {
    quantidade?: number;
};

type SetQuantity = {
    (lineKey: string, quantidade: number): void;
    (
        produtoId: number,
        variacaoId: number | null,
        quantidade: number,
    ): void;
};

type RemoveItem = {
    (lineKey: string): void;
    (
        produtoId: number,
        variacaoId: number | null,
    ): void;
};

type CartContextValue = {
    hydrated: boolean;
    items: PublicCartItem[];
    itemCount: number;
    addItem: (item: AddCartItem) => void;
    setQuantity: SetQuantity;
    removeItem: RemoveItem;
    clearCart: () => void;
};

const STORAGE_KEY = "aaaccu_cart_v1";
const CartContext =
    createContext<CartContextValue | null>(null);

function legacyItemKey(
    produtoId: number,
    variacaoId: number | null,
) {
    return `${produtoId}:${variacaoId ?? "none"}`;
}

function normalizeCampoValor(
    campo: PublicCartCampoValor,
) {
    return {
        campoId: campo.campoId,
        codigo: campo.codigo,
        nome: campo.nome,
        valor: campo.valor.trim(),
    };
}

function buildConfigurationKey(
    item: Pick<
        PublicCartItem,
        | "produtoId"
        | "variacaoId"
        | "campos"
        | "componentes"
    >,
) {
    const campos = [...item.campos]
        .map(normalizeCampoValor)
        .sort((a, b) => a.campoId - b.campoId)
        .map(
            (campo) =>
                `${campo.campoId}=${encodeURIComponent(
                    campo.valor,
                )}`,
        )
        .join("&");

    const componentes = [...item.componentes]
        .sort(
            (a, b) =>
                a.componenteId - b.componenteId,
        )
        .map((componente) => {
            const camposComponente = [
                ...componente.campos,
            ]
                .map(normalizeCampoValor)
                .sort(
                    (a, b) =>
                        a.campoId - b.campoId,
                )
                .map(
                    (campo) =>
                        `${campo.campoId}=${encodeURIComponent(
                            campo.valor,
                        )}`,
                )
                .join("&");

            return [
                componente.componenteId,
                componente.variacaoId ?? "none",
                camposComponente,
            ].join(":");
        })
        .join("|");

    return [
        item.produtoId,
        item.variacaoId ?? "none",
        campos,
        componentes,
    ].join("::");
}

function isPositiveInteger(value: unknown) {
    return (
        Number.isInteger(value) &&
        Number(value) > 0
    );
}

function sanitizeCampoValores(
    value: unknown,
): PublicCartCampoValor[] {
    if (!Array.isArray(value)) return [];

    return value
        .filter(
            (campo): campo is PublicCartCampoValor =>
                Boolean(
                    campo &&
                    typeof campo === "object" &&
                    isPositiveInteger(
                        (campo as PublicCartCampoValor)
                            .campoId,
                    ) &&
                    typeof (
                        campo as PublicCartCampoValor
                    ).codigo === "string" &&
                    typeof (
                        campo as PublicCartCampoValor
                    ).nome === "string" &&
                    typeof (
                        campo as PublicCartCampoValor
                    ).valor === "string",
                ),
        )
        .map(normalizeCampoValor);
}

function sanitizeComponentes(
    value: unknown,
): PublicCartComponente[] {
    if (!Array.isArray(value)) return [];

    return value
        .filter((raw) =>
            Boolean(
                raw &&
                typeof raw === "object" &&
                isPositiveInteger(
                    (
                        raw as PublicCartComponente
                    ).componenteId,
                ) &&
                isPositiveInteger(
                    (
                        raw as PublicCartComponente
                    ).produtoId,
                ) &&
                isPositiveInteger(
                    (
                        raw as PublicCartComponente
                    ).quantidadePorKit,
                ),
            ),
        )
        .map((raw) => {
            const componente =
                raw as PublicCartComponente;

            return {
                componenteId:
                componente.componenteId,
                produtoId:
                componente.produtoId,
                produtoNome:
                    typeof componente.produtoNome ===
                    "string"
                        ? componente.produtoNome
                        : "",
                quantidadePorKit:
                componente.quantidadePorKit,
                variacaoId:
                    componente.variacaoId === null ||
                    isPositiveInteger(
                        componente.variacaoId,
                    )
                        ? componente.variacaoId
                        : null,
                variacaoNome:
                    typeof componente.variacaoNome ===
                    "string"
                        ? componente.variacaoNome
                        : null,
                campos: sanitizeCampoValores(
                    componente.campos,
                ),
            };
        });
}

function sanitizeItem(
    raw: any,
): PublicCartItem | null {
    if (
        !raw ||
        typeof raw !== "object" ||
        !isPositiveInteger(raw.produtoId) ||
        !Number.isInteger(raw.quantidade) ||
        raw.quantidade <= 0 ||
        !(
            raw.variacaoId === null ||
            isPositiveInteger(raw.variacaoId)
        )
    ) {
        return null;
    }

    const campos = sanitizeCampoValores(
        raw.campos,
    );
    const componentes = sanitizeComponentes(
        raw.componentes,
    );

    const base: Omit<
        PublicCartItem,
        "lineKey"
    > = {
        produtoId: raw.produtoId,
        variacaoId: raw.variacaoId,
        quantidade: Math.min(
            Math.max(raw.quantidade, 1),
            99,
        ),
        campos,
        componentes,
        produtoNome:
            typeof raw.produtoNome === "string"
                ? raw.produtoNome
                : "",
        produtoCodigo:
            typeof raw.produtoCodigo === "string"
                ? raw.produtoCodigo
                : "",
        variacaoNome:
            typeof raw.variacaoNome === "string"
                ? raw.variacaoNome
                : null,
        imagemUrl:
            typeof raw.imagemUrl === "string"
                ? raw.imagemUrl
                : null,
        precoVisual:
            Number.isFinite(raw.precoVisual)
                ? Number(raw.precoVisual)
                : 0,
    };

    return {
        ...base,
        lineKey: buildConfigurationKey(base),
    };
}

function sanitizeItems(
    value: unknown,
): PublicCartItem[] {
    if (!value || typeof value !== "object") {
        return [];
    }

    const storage = value as
        | Partial<CartStorageV1>
        | Partial<CartStorageV2>;

    if (
        (storage.version !== 1 &&
            storage.version !== 2) ||
        !Array.isArray(storage.items)
    ) {
        return [];
    }

    return storage.items
        .map(sanitizeItem)
        .filter(
            (
                item,
            ): item is PublicCartItem =>
                item !== null,
        )
        .slice(0, 50);
}

export function PublicCartProvider({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    const [hydrated, setHydrated] =
        useState(false);
    const [items, setItems] = useState<
        PublicCartItem[]
    >([]);

    useEffect(() => {
        try {
            const raw =
                window.localStorage.getItem(
                    STORAGE_KEY,
                );

            if (raw) {
                setItems(
                    sanitizeItems(
                        JSON.parse(raw),
                    ),
                );
            }
        } catch {
            setItems([]);
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;

        const payload: CartStorageV2 = {
            version: 2,
            items,
        };

        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(payload),
        );
    }, [hydrated, items]);

    useEffect(() => {
        function handleStorage(
            event: StorageEvent,
        ) {
            if (event.key !== STORAGE_KEY) {
                return;
            }

            try {
                setItems(
                    event.newValue
                        ? sanitizeItems(
                            JSON.parse(
                                event.newValue,
                            ),
                        )
                        : [],
                );
            } catch {
                setItems([]);
            }
        }

        window.addEventListener(
            "storage",
            handleStorage,
        );

        return () =>
            window.removeEventListener(
                "storage",
                handleStorage,
            );
    }, []);

    const addItem = useCallback(
        (item: AddCartItem) => {
            setItems((current) => {
                const quantidade = Math.min(
                    Math.max(
                        item.quantidade ?? 1,
                        1,
                    ),
                    99,
                );

                const lineKey =
                    buildConfigurationKey({
                        produtoId:
                        item.produtoId,
                        variacaoId:
                        item.variacaoId,
                        campos:
                            item.campos ?? [],
                        componentes:
                            item.componentes ??
                            [],
                    });

                const existing =
                    current.find(
                        (currentItem) =>
                            currentItem.lineKey ===
                            lineKey,
                    );

                if (existing) {
                    return current.map(
                        (currentItem) =>
                            currentItem.lineKey ===
                            lineKey
                                ? {
                                    ...currentItem,
                                    ...item,
                                    lineKey,
                                    quantidade:
                                        Math.min(
                                            currentItem.quantidade +
                                            quantidade,
                                            99,
                                        ),
                                }
                                : currentItem,
                    );
                }

                return [
                    ...current,
                    {
                        ...item,
                        campos:
                            item.campos ?? [],
                        componentes:
                            item.componentes ??
                            [],
                        lineKey,
                        quantidade,
                    },
                ].slice(0, 50);
            });
        },
        [],
    );

    const setQuantity =
        useCallback<SetQuantity>(
            (
                first: string | number,
                second: number | null,
                third?: number,
            ) => {
                const lineKey =
                    typeof first === "string"
                        ? first
                        : null;

                const quantidade =
                    typeof first === "string"
                        ? Number(second)
                        : Number(third);

                setItems((current) => {
                    const matches = (
                        item: PublicCartItem,
                    ) =>
                        lineKey
                            ? item.lineKey ===
                            lineKey
                            : legacyItemKey(
                                item.produtoId,
                                item.variacaoId,
                            ) ===
                            legacyItemKey(
                                first as number,
                                second,
                            );

                    if (quantidade <= 0) {
                        return current.filter(
                            (item) =>
                                !matches(item),
                        );
                    }

                    return current.map(
                        (item) =>
                            matches(item)
                                ? {
                                    ...item,
                                    quantidade:
                                        Math.min(
                                            Math.max(
                                                Math.trunc(
                                                    quantidade,
                                                ),
                                                1,
                                            ),
                                            99,
                                        ),
                                }
                                : item,
                    );
                });
            },
            [],
        );

    const removeItem =
        useCallback<RemoveItem>(
            (
                first: string | number,
                second?: number | null,
            ) => {
                setItems((current) =>
                    current.filter(
                        (item) => {
                            if (
                                typeof first ===
                                "string"
                            ) {
                                return (
                                    item.lineKey !==
                                    first
                                );
                            }

                            return (
                                legacyItemKey(
                                    item.produtoId,
                                    item.variacaoId,
                                ) !==
                                legacyItemKey(
                                    first,
                                    second ?? null,
                                )
                            );
                        },
                    ),
                );
            },
            [],
        );

    const clearCart = useCallback(
        () => setItems([]),
        [],
    );

    const itemCount = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total +
                    item.quantidade,
                0,
            ),
        [items],
    );

    const value = useMemo(
        () => ({
            hydrated,
            items,
            itemCount,
            addItem,
            setQuantity,
            removeItem,
            clearCart,
        }),
        [
            hydrated,
            items,
            itemCount,
            addItem,
            setQuantity,
            removeItem,
            clearCart,
        ],
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function usePublicCart() {
    const context =
        useContext(CartContext);

    if (!context) {
        throw new Error(
            "usePublicCart precisa estar dentro de PublicCartProvider.",
        );
    }

    return context;
}
