"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    CalendarDays,
    Home,
    Package,
    ShoppingBag,
    UserRound,
    UsersRound,
} from "lucide-react";


const defaultMobileNavItems = [
    {
        label: "Início",
        icon: Home,
        href: "/",
    },
    {
        label: "Minha conta",
        icon: UserRound,
        href: "/perfil",
    },
];


const adminMobileNavItems = [
    {
        label: "Produtos",
        icon: Package,
        href: "/admin/produtos",
    },
    {
        label: "Eventos",
        icon: CalendarDays,
        href: "/admin/eventos",
    },
    {
        label: "Pedidos",
        icon: ShoppingBag,
        href: "/admin/pedidos",
    },
    {
        label: "Sócios",
        icon: UsersRound,
        href: "/admin/socios",
    },
];


function isActiveRoute(
    pathname: string,
    href: string,
) {
    if (href === "/") {
        return pathname === "/";
    }

    return (
        pathname === href ||
        pathname.startsWith(
            `${href}/`,
        )
    );
}


export function MobileBottomNav() {
    const pathname =
        usePathname();

    const isAdmin =
        pathname.startsWith(
            "/admin",
        );

    const mobileNavItems =
        isAdmin
            ? adminMobileNavItems
            : defaultMobileNavItems;

    return (
        <nav className="bp-mobile-nav">
            {mobileNavItems.map(
                (item) => {
                    const Icon =
                        item.icon;

                    const active =
                        isActiveRoute(
                            pathname,
                            item.href,
                        );

                    return (
                        <Link
                            key={
                                item.href
                            }
                            href={
                                item.href
                            }
                            className={
                                active
                                    ? "active"
                                    : ""
                            }
                        >
                            <Icon
                                size={17}
                            />

                            {
                                item.label
                            }
                        </Link>
                    );
                },
            )}
        </nav>
    );
}