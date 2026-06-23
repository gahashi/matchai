import { ReactNode } from "react";

type TableProps = {
    headers: string[];
    children: ReactNode;
};

export function Table({ headers, children }: TableProps) {
    return (
        <div className="bp-table-wrap">
            <table className="bp-table">
                <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={header}>{header}</th>
                    ))}
                </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}