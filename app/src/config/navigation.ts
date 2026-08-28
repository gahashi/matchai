import type {
    LucideIcon,
} from "lucide-react";

import {
    Building2,
    CalendarDays,
    Home,
    LogIn,
    MonitorPlay,
    Package,
    ShoppingBag,
    UserRound,
    UsersRound,
    WalletCards,
} from "lucide-react";


export type NavigationUserContext = {
    isAuthenticated: boolean;
    isAdmin: boolean;
};


export type NavigationPartner = {
    id: number;
    slug: string;
    nome: string;

    logoUrl:
        string |
        null;

    corPrimaria:
        string |
        null;
};


export type NavigationItem = {
    label: string;
    mobileLabel?: string;

    href: string;
    icon: LucideIcon;

    exact?: boolean;

    newTab?: boolean;
    mobileHidden?: boolean;
};


export const publicNavigationItems: NavigationItem[] = [
    {
        label:
            "Início",

        href:
            "/",

        icon:
            Home,

        exact:
            true,
    },

    {
        label:
            "Produtos",

        mobileLabel:
            "Loja",

        href:
            "/#produtos",

        icon:
            ShoppingBag,
    },

    {
        label:
            "Eventos",

        href:
            "/#eventos",

        icon:
            CalendarDays,
    },

    {
        label:
            "Planos de sócio",

        mobileLabel:
            "Planos",

        href:
            "/#planos-socio",

        icon:
            WalletCards,
    },

    {
        label:
            "Consultar pedido",

        mobileLabel:
            "Pedidos",

        href:
            "/acompanhar-pedido",

        icon:
            Package,
    },
];


export const adminNavigationItems: NavigationItem[] = [
    {
        label:
            "Visão geral",

        mobileLabel:
            "Admin",

        href:
            "/admin",

        icon:
            Home,

        exact:
            true,
    },

    {
        label:
            "Pedidos",

        href:
            "/admin/pedidos",

        icon:
            ShoppingBag,
    },

    {
        label:
            "Produtos",

        href:
            "/admin/produtos",

        icon:
            Package,
    },

    {
        label:
            "Eventos",

        href:
            "/admin/eventos",

        icon:
            CalendarDays,
    },

    {
        label:
            "Parceiros",

        href:
            "/admin/parceiros",

        icon:
            Building2,

        mobileHidden:
            true,
    },

    {
        label:
            "Sócios",

        href:
            "/admin/socios",

        icon:
            UsersRound,

        mobileHidden:
            true,
    },

    {
        label:
            "Planos de sócio",

        mobileLabel:
            "Planos",

        href:
            "/admin/planos-socio",

        icon:
            WalletCards,

        mobileHidden:
            true,
    },

    {
        label:
            "TV",

        href:
            "/admin/tv",

        icon:
            MonitorPlay,

        mobileHidden:
            true,
    },
    {
        label:
            "Usuários",

        href:
            "/admin/usuarios",

        icon:
        UserRound,

        mobileHidden:
            true,
    },
];


export function getPublicDesktopNavigation(
    user:
        NavigationUserContext,
): NavigationItem[] {
    return [
        ...publicNavigationItems,

        ...(
            user.isAuthenticated
                ? [
                    {
                        label:
                            "Minha conta",

                        href:
                            "/perfil",

                        icon:
                            UserRound,
                    } satisfies NavigationItem,
                ]
                : []
        ),
    ];
}


export function getPublicMobileNavigation(
    user:
        NavigationUserContext,
): NavigationItem[] {
    const publicMobileBase =
        publicNavigationItems
            .filter(
                (
                    item,
                ) =>
                    item.href !==
                    "/#planos-socio",
            );

    return [
        ...publicMobileBase,

        {
            label:
                "Carrinho",

            href:
                "/carrinho",

            icon:
                ShoppingBag,
        },

        user.isAuthenticated
            ? {
                label:
                    "Conta",

                href:
                    "/perfil",

                icon:
                    UserRound,
            }
            : {
                label:
                    "Entrar",

                href:
                    "/login",

                icon:
                    LogIn,
            },

        ...(
            user.isAdmin
                ? [
                    {
                        label:
                            "Admin",

                        href:
                            "/admin",

                        icon:
                            WalletCards,
                    } satisfies NavigationItem,
                ]
                : []
        ),
    ];
}


export function getAdminMobileNavigation() {
    return adminNavigationItems
        .filter(
            (
                item,
            ) =>
                !item.mobileHidden,
        );
}


export function isNavigationItemActive(
    pathname:
        string,

    item:
        NavigationItem,
) {
    if (
        item.href.includes(
            "#",
        )
    ) {
        return false;
    }

    if (
        item.href ===
        "/"
    ) {
        return pathname ===
            "/";
    }

    if (
        item.exact
    ) {
        return pathname ===
            item.href;
    }

    return (
        pathname ===
        item.href ||
        pathname.startsWith(
            `${item.href}/`,
        )
    );
}
