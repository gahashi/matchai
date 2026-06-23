import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
};

export function Input({ label, id, ...props }: InputProps) {
    return (
        <label>
            {label && <span className="bp-label">{label}</span>}
            <input id={id} className="bp-input" {...props} />
        </label>
    );
}