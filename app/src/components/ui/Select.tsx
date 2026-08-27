import { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectOption = {
    label: string;
    value: string | number;
    disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    helperText?: ReactNode;
    error?: ReactNode;
    options?: SelectOption[];
    placeholder?: string;
    wrapperClassName?: string;
};

export function Select({
                           label,
                           helperText,
                           error,
                           options,
                           placeholder,
                           className,
                           wrapperClassName,
                           children,
                           ...props
                       }: SelectProps) {
    return (
        <label className={wrapperClassName}>
            {label && <span className="bp-label">{label}</span>}

            <select
                className={cn("bp-select", className)}
                aria-invalid={Boolean(error)}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}

                {options?.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}

                {children}
            </select>

            {error ? (
                <span
                    style={{
                        display: "block",
                        marginTop: 6,
                        color: "var(--color-danger)",
                        fontSize: 12,
                        lineHeight: 1.4,
                    }}
                >
                    {error}
                </span>
            ) : helperText ? (
                <span
                    style={{
                        display: "block",
                        marginTop: 6,
                        color: "var(--color-text-soft)",
                        fontSize: 12,
                        lineHeight: 1.4,
                    }}
                >
                    {helperText}
                </span>
            ) : null}
        </label>
    );
}