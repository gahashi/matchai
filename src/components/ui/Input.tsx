import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    helperText?: ReactNode;
    error?: ReactNode;
    wrapperClassName?: string;
};

export function Input({
                          label,
                          helperText,
                          error,
                          id,
                          className,
                          wrapperClassName,
                          ...props
                      }: InputProps) {
    return (
        <label className={wrapperClassName}>
            {label && <span className="bp-label">{label}</span>}

            <input
                id={id}
                className={cn("bp-input", className)}
                aria-invalid={Boolean(error)}
                {...props}
            />

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