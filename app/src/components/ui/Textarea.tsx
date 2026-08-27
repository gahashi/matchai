import { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    helperText?: ReactNode;
    error?: ReactNode;
    wrapperClassName?: string;
};

export function Textarea({
                             label,
                             helperText,
                             error,
                             className,
                             wrapperClassName,
                             ...props
                         }: TextareaProps) {
    return (
        <label className={wrapperClassName}>
            {label && <span className="bp-label">{label}</span>}

            <textarea
                className={cn("bp-textarea", className)}
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