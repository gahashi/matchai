import { ReactNode, TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
    headers: ReactNode[];
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
                    {headers.map((header, index) => (
                        <th key={index}>
                            {header}
                        </th>
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