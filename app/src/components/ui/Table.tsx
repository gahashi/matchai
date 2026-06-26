import { ReactNode, TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
    headers: string[];
    children: ReactNode;
    emptyMessage?: string;
};

export function Table({
                          headers,
                          children,
                          emptyMessage,
                          className,
                          ...props
                      }: TableProps) {
    const hasChildren = Boolean(children);

    return (
        <div className="bp-table-wrap">
            <table className={cn("bp-table", className)} {...props}>
                <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={header}>{header}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {hasChildren ? (
                    children
                ) : emptyMessage ? (
                    <tr>
                        <td colSpan={headers.length}>
                            <div
                                style={{
                                    padding: 18,
                                    textAlign: "center",
                                    color: "var(--color-text-muted)",
                                }}
                            >
                                {emptyMessage}
                            </div>
                        </td>
                    </tr>
                ) : null}
                </tbody>
            </table>
        </div>
    );
}