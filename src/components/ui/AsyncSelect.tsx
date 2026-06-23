"use client";

import {
    ChangeEvent,
    KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

export type AsyncSelectOption = {
    id: number | string;
    label: string;
    description?: string | null;
    avatar_url?: string | null;
    icon?: string | null;
};

type AsyncSelectMode = "single" | "multiple";

type AsyncSelectBaseProps = {
    label?: string;
    placeholder?: string;
    endpoint: string;
    disabled?: boolean;
    minChars?: number;
    debounceMs?: number;
    limit?: number;
    mode?: AsyncSelectMode;
    emptyMessage?: string;
    loadingMessage?: string;
    maxSelected?: number;
};

type AsyncSelectSingleProps = AsyncSelectBaseProps & {
    mode?: "single";
    value?: AsyncSelectOption | null;
    onChange: (option: AsyncSelectOption | null) => void;
};

type AsyncSelectMultipleProps = AsyncSelectBaseProps & {
    mode: "multiple";
    value?: AsyncSelectOption[];
    onChange: (options: AsyncSelectOption[]) => void;
};

type AsyncSelectProps = AsyncSelectSingleProps | AsyncSelectMultipleProps;

function isMultipleProps(
    props: AsyncSelectProps
): props is AsyncSelectMultipleProps {
    return props.mode === "multiple";
}

export function AsyncSelect(props: AsyncSelectProps) {
    const isMultiple = isMultipleProps(props);

    const {
        label,
        placeholder = "Buscar...",
        endpoint,
        disabled = false,
        minChars = 0,
        debounceMs = 350,
        limit = 15,
        emptyMessage = "Nenhum resultado encontrado.",
        loadingMessage = "Buscando...",
        maxSelected,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const debounceRef = useRef<number | null>(null);
    const requestIdRef = useRef(0);

    const [search, setSearch] = useState("");
    const [singleValue, setSingleValue] = useState<AsyncSelectOption | null>(
        !isMultiple ? props.value ?? null : null
    );
    const [multipleValue, setMultipleValue] = useState<AsyncSelectOption[]>(
        isMultiple ? props.value ?? [] : []
    );

    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const selectedOptions = useMemo(() => {
        return isMultiple ? multipleValue : singleValue ? [singleValue] : [];
    }, [isMultiple, multipleValue, singleValue]);

    const selectedIds = useMemo(() => {
        return new Set(selectedOptions.map((option) => String(option.id)));
    }, [selectedOptions]);

    const visibleOptions = useMemo(() => {
        if (!isMultiple) {
            return options;
        }

        return options.filter((option) => !selectedIds.has(String(option.id)));
    }, [isMultiple, options, selectedIds]);

    const canSelectMore =
        !isMultiple || !maxSelected || multipleValue.length < maxSelected;

    function emitSingleChange(option: AsyncSelectOption | null) {
        if (!isMultipleProps(props)) {
            props.onChange(option);
        }
    }

    function emitMultipleChange(options: AsyncSelectOption[]) {
        if (isMultipleProps(props)) {
            props.onChange(options);
        }
    }

    useEffect(() => {
        if (!isMultipleProps(props)) {
            setSingleValue(props.value ?? null);
            setSearch(props.value?.label ?? "");
        }
    }, [props]);

    useEffect(() => {
        if (isMultipleProps(props)) {
            setMultipleValue(props.value ?? []);
        }
    }, [props]);

    async function fetchOptions(term: string) {
        if (term.length < minChars) {
            setOptions([]);
            return;
        }

        const currentRequestId = requestIdRef.current + 1;
        requestIdRef.current = currentRequestId;

        try {
            setLoading(true);

            const url = new URL(endpoint, window.location.origin);
            url.searchParams.set("q", term);
            url.searchParams.set("limit", String(limit));

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }

            const data = await response.json();

            if (requestIdRef.current !== currentRequestId) {
                return;
            }

            setOptions(Array.isArray(data.items) ? data.items : []);
            setHighlightIndex(0);
        } catch (error) {
            console.error("Erro no AsyncSelect:", error);
            setOptions([]);
        } finally {
            if (requestIdRef.current === currentRequestId) {
                setLoading(false);
            }
        }
    }

    function scheduleFetch(term: string) {
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            fetchOptions(term);
        }, debounceMs);
    }

    function handleFocus() {
        if (disabled) return;

        setOpen(true);
        scheduleFetch(search);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const term = event.target.value;

        setSearch(term);
        setOpen(true);

        if (!isMultiple && singleValue) {
            setSingleValue(null);
            emitSingleChange(null);
        }

        scheduleFetch(term);
    }

    function handleSelect(option: AsyncSelectOption) {
        if (isMultiple) {
            if (!canSelectMore) return;

            const alreadySelected = multipleValue.some(
                (item) => String(item.id) === String(option.id)
            );

            if (alreadySelected) return;

            const nextValue = [...multipleValue, option];

            setMultipleValue(nextValue);
            setSearch("");
            setOpen(true);
            emitMultipleChange(nextValue);
            scheduleFetch("");

            return;
        }

        setSingleValue(option);
        setSearch(option.label);
        setOpen(false);
        emitSingleChange(option);
    }

    function handleRemoveOption(option: AsyncSelectOption) {
        if (!isMultiple) return;

        const nextValue = multipleValue.filter(
            (item) => String(item.id) !== String(option.id)
        );

        setMultipleValue(nextValue);
        emitMultipleChange(nextValue);
    }

    function handleClear() {
        setSearch("");
        setOptions([]);
        setOpen(false);

        if (isMultiple) {
            setMultipleValue([]);
            emitMultipleChange([]);
            return;
        }

        setSingleValue(null);
        emitSingleChange(null);
    }

    function removeLastMultipleOption() {
        if (!isMultiple || search.length > 0 || multipleValue.length === 0) {
            return;
        }

        const nextValue = multipleValue.slice(0, -1);
        setMultipleValue(nextValue);
        emitMultipleChange(nextValue);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!open) {
            if (event.key === "ArrowDown" || event.key === "Enter") {
                setOpen(true);
                scheduleFetch(search);
            }

            if (event.key === "Backspace") {
                removeLastMultipleOption();
            }

            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            setHighlightIndex((current) =>
                current + 1 >= visibleOptions.length ? 0 : current + 1
            );
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            setHighlightIndex((current) =>
                current - 1 < 0 ? visibleOptions.length - 1 : current - 1
            );
        }

        if (event.key === "Enter") {
            event.preventDefault();

            const option = visibleOptions[highlightIndex];

            if (option) {
                handleSelect(option);
            }
        }

        if (event.key === "Escape") {
            setOpen(false);
        }

        if (event.key === "Backspace") {
            removeLastMultipleOption();
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current) return;

            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="bp-async-select">
            {label && <span className="bp-label">{label}</span>}

            {isMultiple && multipleValue.length > 0 && (
                <div className="bp-async-select-tags">
                    {multipleValue.map((option) => (
                        <span key={option.id} className="bp-async-select-tag">
                            {option.label}

                            <button
                                type="button"
                                onClick={() => handleRemoveOption(option)}
                                disabled={disabled}
                                aria-label={`Remover ${option.label}`}
                            >
                                <X size={13} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="bp-async-select-control">
                <Search size={17} className="bp-async-select-icon" />

                <input
                    className="bp-async-select-input"
                    placeholder={
                        isMultiple && multipleValue.length > 0
                            ? "Buscar mais..."
                            : placeholder
                    }
                    value={search}
                    disabled={disabled || !canSelectMore}
                    onFocus={handleFocus}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />

                {loading && (
                    <Loader2 size={17} className="bp-async-select-loader" />
                )}

                {!loading && selectedOptions.length > 0 && (
                    <button
                        type="button"
                        className="bp-async-select-clear"
                        onClick={handleClear}
                        aria-label="Limpar seleção"
                        disabled={disabled}
                    >
                        <X size={16} />
                    </button>
                )}

                {!loading && selectedOptions.length === 0 && (
                    <ChevronDown size={17} className="bp-async-select-chevron" />
                )}
            </div>

            {isMultiple && maxSelected && (
                <div className="bp-async-select-help">
                    {multipleValue.length}/{maxSelected} selecionados
                </div>
            )}

            {open && canSelectMore && (
                <div className="bp-async-select-dropdown">
                    {loading && (
                        <div className="bp-async-select-empty">
                            {loadingMessage}
                        </div>
                    )}

                    {!loading && visibleOptions.length === 0 && (
                        <div className="bp-async-select-empty">
                            {emptyMessage}
                        </div>
                    )}

                    {!loading &&
                        visibleOptions.map((option, index) => {
                            const active = index === highlightIndex;
                            const selected = selectedIds.has(String(option.id));

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`bp-async-select-option ${
                                        active ? "active" : ""
                                    }`}
                                    onMouseEnter={() => setHighlightIndex(index)}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span>{option.label}</span>

                                    {option.description && (
                                        <small>{option.description}</small>
                                    )}

                                    {selected && (
                                        <Check
                                            size={16}
                                            className="bp-async-select-check"
                                        />
                                    )}
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
}