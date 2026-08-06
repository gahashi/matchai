"use client";

import {
    LayoutDashboard,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
    AppLink,
} from "@/components/ui/AppLink";

type EntidadeContextNavProps = {
    slug: string;
};

export function EntidadeContextNav({
                                       slug,
                                   }: EntidadeContextNavProps) {
    const pathname = usePathname();

    const baseHref =
        `/ent/entidade/${slug}`;

    const items = [
        {
            label: "Visão geral",
            href: baseHref,
            icon: LayoutDashboard,
            exact: true,
        },
        /*
         * Novos itens serão adicionados
         * somente quando as respectivas
         * telas existirem.
         */
    ];

    return (
        <nav
            className="bp-inbox-filter-tabs bp-mb-5"
            aria-label="Navegação da entidade"
        >
            {items.map((item) => {
                const Icon = item.icon;

                const active =
                    item.exact
                        ? pathname ===
                        item.href
                        : pathname ===
                        item.href ||
                        pathname.startsWith(
                            `${item.href}/`
                        );

                return (
                    <AppLink
                        key={item.href}
                        href={item.href}
                        color="secondary"
                        variant="ghost"
                        className={[
                            "bp-inbox-filter-tab",
                            active
                                ? "active"
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        aria-current={
                            active
                                ? "page"
                                : undefined
                        }
                    >
                        <Icon size={15} />
                        {item.label}
                    </AppLink>
                );
            })}


        </nav>
    );
}