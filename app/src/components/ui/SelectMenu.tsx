"use client";

import {
    KeyboardEvent,
    ReactNode,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectMenuOption = {
    label: string;
    value: string | number;
    disabled?: boolean;
};

type SelectMenuProps = {
    label?: string;
    helperText?: ReactNode;
    error?: ReactNode;
    options: SelectMenuOption[];
    placeholder?: string;
    value?: string | number | null;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
};

export function SelectMenu({
    label,
    helperText,
    error,
    options,
    placeholder = "Selecione",
    value,
    onChange,
    disabled = false,
    required = false,
    className,
}: SelectMenuProps) {
    const id = useId();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const selected = useMemo(
        () =>
            options.find(
                (option) => String(option.value) === String(value ?? ""),
            ) ?? null,
        [options, value],
    );

    const enabledOptions = useMemo(
        () => options.filter((option) => !option.disabled),
        [options],
    );

    useEffect(() => {
        function handleOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    function select(option: SelectMenuOption) {
        if (option.disabled) return;
        onChange(String(option.value));
        setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (disabled) return;

        if (!open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) {
            event.preventDefault();
            setOpen(true);
            return;
        }

        if (!open) return;

        if (event.key === "Escape") {
            setOpen(false);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightIndex((current) =>
                current + 1 >= enabledOptions.length ? 0 : current + 1,
            );
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex((current) =>
                current - 1 < 0 ? enabledOptions.length - 1 : current - 1,
            );
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const option = enabledOptions[highlightIndex];
            if (option) select(option);
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn("bp-select-menu", className)}
        >
            {label ? (
                <label className="bp-label" id={`${id}-label`}>
                    {label}
                    {required ? (
                        <span className="bp-required-mark" aria-hidden="true">
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}

            <button
                type="button"
                className={cn(
                    "bp-select-menu-trigger",
                    open && "is-open",
                    error && "is-invalid",
                )}
                aria-labelledby={label ? `${id}-label` : undefined}
                aria-haspopup="listbox"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={handleKeyDown}
            >
                <span className={selected ? undefined : "is-placeholder"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown size={17} />
            </button>

            {open ? (
                <div className="bp-select-menu-dropdown" role="listbox">
                    {options.map((option) => {
                        const isSelected =
                            String(option.value) === String(value ?? "");

                        return (
                            <button
                                key={String(option.value)}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                disabled={option.disabled}
                                className={cn(
                                    "bp-select-menu-option",
                                    isSelected && "is-selected",
                                )}
                                onClick={() => select(option)}
                            >
                                <span>{option.label}</span>
                                {isSelected ? <Check size={16} /> : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {error ? (
                <span className="bp-field-error">{error}</span>
            ) : helperText ? (
                <span className="bp-field-help">{helperText}</span>
            ) : null}
        </div>
    );
}
