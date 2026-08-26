"use client";

import Link from "next/link";

import {
    Building2,
    CalendarDays,
    Home,
    ShieldCheck,
    ShoppingBag,
} from "lucide-react";

import {
    usePathname,
} from "next/navigation";

import type {
    NavigationUserContext,
} from "@/config/navigation";


type MobileBottomNavProps = {
    mode?: "app" | "public";

    user?:
        NavigationUserContext;

    hasPartners?:
        boolean;
};


const anonymousUser:
    NavigationUserContext = {
    isAuthenticated:
        false,

    isAdmin:
        false,
};


type MobileItem = {
    label:
        string;

    href:
        string;

    icon:
        typeof Home;

    active:
        boolean;
};


export function MobileBottomNav({
    mode = "app",
    user,
    hasPartners = false,
}: MobileBottomNavProps) {
    const pathname =
        usePathname();


    const effectiveUser =
        user ??
        (
            mode ===
            "app"
                ? {
                    isAuthenticated:
                        true,

                    isAdmin:
                        false,
                }
                : anonymousUser
        );


    const items:
        MobileItem[] = [
        {
            label:
                "Início",

            href:
                "/",

            icon:
                Home,

            active:
                pathname ===
                "/",
        },

        ...(
            mode ===
            "public"
                ? [
                    {
                        label:
                            "Eventos",

                        href:
                            "/#eventos",

                        icon:
                            CalendarDays,

                        active:
                            false,
                    },

                    {
                        label:
                            "Loja",

                        href:
                            "/#produtos",

                        icon:
                            ShoppingBag,

                        active:
                            false,
                    },
                ] satisfies MobileItem[]
                : []
        ),

        ...(
            effectiveUser
                .isAuthenticated &&
            hasPartners
                ? [
                    {
                        label:
                            "Parceiros",

                        href:
                            "/parceiro",

                        icon:
                            Building2,

                        active:
                            pathname ===
                            "/parceiro" ||
                            pathname.startsWith(
                                "/parceiro/",
                            ),
                    },
                ] satisfies MobileItem[]
                : []
        ),

        ...(
            effectiveUser
                .isAuthenticated &&
            effectiveUser
                .isAdmin
                ? [
                    {
                        label:
                            "Admin",

                        href:
                            "/admin",

                        icon:
                            ShieldCheck,

                        active:
                            pathname ===
                            "/admin" ||
                            pathname.startsWith(
                                "/admin/",
                            ),
                    },
                ] satisfies MobileItem[]
                : []
        ),
    ];


    return (
        <nav
            className="bp-mobile-nav"
            aria-label="Navegação móvel"
        >
            {items.map(
                (
                    item,
                ) => {
                    const Icon =
                        item.icon;

                    return (
                        <Link
                            key={
                                item.href
                            }
                            href={
                                item.href
                            }
                            className={
                                item.active
                                    ? "active"
                                    : ""
                            }
                            aria-current={
                                item.active
                                    ? "page"
                                    : undefined
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
