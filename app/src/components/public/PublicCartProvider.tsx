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

export type PublicCartItem = {
    produtoId: number;
    variacaoId: number | null;
    quantidade: number;

    // Cache visual. O backend nunca confia nestes dados para fechar pedido.
    produtoNome: string;
    produtoCodigo: string;
    variacaoNome: string | null;
    imagemUrl: string | null;
    precoVisual: number;
};

type CartStorage = {
    version: 1;
    items: PublicCartItem[];
};

type AddCartItem = Omit<PublicCartItem, "quantidade"> & {
    quantidade?: number;
};

type CartContextValue = {
    hydrated: boolean;
    items: PublicCartItem[];
    itemCount: number;
    addItem: (item: AddCartItem) => void;
    setQuantity: (
        produtoId: number,
        variacaoId: number | null,
        quantidade: number,
    ) => void;
    removeItem: (produtoId: number, variacaoId: number | null) => void;
    clearCart: () => void;
};

const STORAGE_KEY = "aaaccu_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function itemKey(produtoId: number, variacaoId: number | null) {
    return `${produtoId}:${variacaoId ?? "none"}`;
}

function sanitizeItems(value: unknown): PublicCartItem[] {
    if (!value || typeof value !== "object") return [];

    const storage = value as Partial<CartStorage>;
    if (storage.version !== 1 || !Array.isArray(storage.items)) return [];

    return storage.items
        .filter((item): item is PublicCartItem =>
            Boolean(
                item &&
                Number.isInteger(item.produtoId) &&
                item.produtoId > 0 &&
                (item.variacaoId === null ||
                    (Number.isInteger(item.variacaoId) && item.variacaoId > 0)) &&
                Number.isInteger(item.quantidade) &&
                item.quantidade > 0,
            ),
        )
        .map((item) => ({
            ...item,
            quantidade: Math.min(Math.max(item.quantidade, 1), 99),
        }))
        .slice(0, 50);
}

export function PublicCartProvider({ children }: { children: ReactNode }) {
    const [hydrated, setHydrated] = useState(false);
    const [items, setItems] = useState<PublicCartItem[]>([]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) setItems(sanitizeItems(JSON.parse(raw)));
        } catch {
            setItems([]);
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;

        const payload: CartStorage = {
            version: 1,
            items,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, [hydrated, items]);

    useEffect(() => {
        function handleStorage(event: StorageEvent) {
            if (event.key !== STORAGE_KEY) return;

            try {
                setItems(
                    event.newValue
                        ? sanitizeItems(JSON.parse(event.newValue))
                        : [],
                );
            } catch {
                setItems([]);
            }
        }

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const addItem = useCallback((item: AddCartItem) => {
        setItems((current) => {
            const key = itemKey(item.produtoId, item.variacaoId);
            const quantidade = Math.min(
                Math.max(item.quantidade ?? 1, 1),
                99,
            );

            const existing = current.find(
                (currentItem) =>
                    itemKey(currentItem.produtoId, currentItem.variacaoId) ===
                    key,
            );

            if (existing) {
                return current.map((currentItem) =>
                    itemKey(currentItem.produtoId, currentItem.variacaoId) ===
                    key
                        ? {
                            ...currentItem,
                            ...item,
                            quantidade: Math.min(
                                currentItem.quantidade + quantidade,
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
                    quantidade,
                },
            ].slice(0, 50);
        });
    }, []);

    const setQuantity = useCallback(
        (
            produtoId: number,
            variacaoId: number | null,
            quantidade: number,
        ) => {
            if (quantidade <= 0) {
                setItems((current) =>
                    current.filter(
                        (item) =>
                            itemKey(item.produtoId, item.variacaoId) !==
                            itemKey(produtoId, variacaoId),
                    ),
                );
                return;
            }

            setItems((current) =>
                current.map((item) =>
                    itemKey(item.produtoId, item.variacaoId) ===
                    itemKey(produtoId, variacaoId)
                        ? {
                            ...item,
                            quantidade: Math.min(
                                Math.max(Math.trunc(quantidade), 1),
                                99,
                            ),
                        }
                        : item,
                ),
            );
        },
        [],
    );

    const removeItem = useCallback(
        (produtoId: number, variacaoId: number | null) => {
            setItems((current) =>
                current.filter(
                    (item) =>
                        itemKey(item.produtoId, item.variacaoId) !==
                        itemKey(produtoId, variacaoId),
                ),
            );
        },
        [],
    );

    const clearCart = useCallback(() => setItems([]), []);

    const itemCount = useMemo(
        () => items.reduce((total, item) => total + item.quantidade, 0),
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

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function usePublicCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error(
            "usePublicCart precisa estar dentro de PublicCartProvider.",
        );
    }
    return context;
}
