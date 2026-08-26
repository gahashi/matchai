"use client";

import {
    ArrowLeftRight,
    BookOpen,
    Info,
    LayoutDashboard,
    MonitorPlay,
    Palette,
    Tags,
    UsersRound,
} from "lucide-react";

import {
    usePathname,
} from "next/navigation";

import {
    AppLink,
} from "@/components/ui/AppLink";


type ParceiroContextNavProps = {
    slug:
        string;
};


export function ParceiroContextNav({
    slug,
}: ParceiroContextNavProps) {
    const pathname =
        usePathname();

    const baseHref =
        `/parceiro/${slug}`;


    const items = [
        {
            label:
                "Visão geral",

            href:
                baseHref,

            icon:
                LayoutDashboard,

            exact:
                true,
        },

        {
            label:
                "Cardápio",

            href:
                `${baseHref}/cardapio`,

            icon:
                BookOpen,
        },

        {
            label:
                "Promoções",

            href:
                `${baseHref}/promocoes`,

            icon:
                Tags,
        },

        {
            label:
                "Informações",

            href:
                `${baseHref}/informacoes`,

            icon:
                Info,
        },

        {
            label:
                "Aparência",

            href:
                `${baseHref}/aparencia`,

            icon:
                Palette,
        },

        {
            label:
                "Membros",

            href:
                `${baseHref}/membros`,

            icon:
                UsersRound,
        },

        {
            label:
                "TV",

            href:
                `/tv/${slug}`,

            icon:
                MonitorPlay,

            external:
                true,
        },
    ];


    return (
        <div className="bp-partner-context-wrap bp-mb-5">
            <nav
                className="bp-inbox-filter-tabs"
                aria-label="Navegação do parceiro"
            >
                {items.map(
                    (
                        item,
                    ) => {
                        const Icon =
                            item.icon;

                        const active =
                            item.external
                                ? false
                                : item.exact
                                    ? pathname ===
                                    item.href
                                    : pathname ===
                                        item.href ||
                                    pathname.startsWith(
                                        `${item.href}/`,
                                    );

                        return (
                            <AppLink
                                key={
                                    item.href
                                }
                                href={
                                    item.href
                                }
                                color="secondary"
                                variant="ghost"
                                className={[
                                    "bp-inbox-filter-tab",

                                    active
                                        ? "active"
                                        : "",
                                ]
                                    .filter(
                                        Boolean,
                                    )
                                    .join(
                                        " ",
                                    )}
                                aria-current={
                                    active
                                        ? "page"
                                        : undefined
                                }
                            >
                                <Icon
                                    size={15}
                                />

                                {
                                    item.label
                                }

                                {item.external ? (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            opacity:
                                                0.58,
                                        }}
                                    >
                                        ↗
                                    </span>
                                ) : null}
                            </AppLink>
                        );
                    },
                )}
            </nav>

            <AppLink
                href="/parceiro"
                color="secondary"
                variant="ghost"
                size="sm"
            >
                <ArrowLeftRight
                    size={15}
                />

                Trocar parceiro
            </AppLink>
        </div>
    );
}
