"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    CalendarDays,
    Home,
    Package,
    ShoppingBag,
    UserRound,
    UsersRound,
    WalletCards,
} from "lucide-react";


const defaultNavItems = [
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


const adminNavItems = [
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
        label: "Planos de sócio",
        icon: WalletCards,
        href: "/admin/planos-socio",
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


export function Sidebar() {
    const pathname =
        usePathname();

    const isAdmin =
        pathname.startsWith(
            "/admin",
        );

    const navItems =
        isAdmin
            ? adminNavItems
            : defaultNavItems;

    return (
        <aside className="bp-sidebar">
            <div className="bp-sidebar-brand">
                <Link
                    href={
                        isAdmin
                            ? "/admin"
                            : "/"
                    }
                    className="bp-sidebar-logo-link"
                    aria-label="AAACCU - Computaria"
                >
                    <Image
                        src="/ent/atletica/aaaccu_logo_001.png"
                        alt="AAACCU"
                        width={54}
                        height={54}
                        className="bp-sidebar-logo"
                        style={{
                            objectFit:
                                "contain",
                        }}
                        priority
                    />

                    <span className="bp-sidebar-brand-text">
                        <strong>
                            AAACCU
                        </strong>

                        <small>
                            {isAdmin
                                ? "Administração"
                                : "Computaria"}
                        </small>
                    </span>
                </Link>
            </div>

            <nav className="bp-nav">
                {navItems.map(
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
                                className={`bp-nav-item ${
                                    active
                                        ? "active"
                                        : ""
                                }`}
                            >
                                <Icon
                                    size={18}
                                />

                                {
                                    item.label
                                }
                            </Link>
                        );
                    },
                )}
            </nav>
        </aside>
    );
}