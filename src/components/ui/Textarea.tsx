import { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
};

export function Textarea({ label, ...props }: TextareaProps) {
    return (
        <label>
            {label && <span className="bp-label">{label}</span>}
            <textarea className="bp-textarea" {...props} />
        </label>
    );
}