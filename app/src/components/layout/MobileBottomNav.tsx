"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    adminNavigationItems,
    getPublicMobileNavigation,
    isNavigationItemActive,
    type NavigationUserContext,
} from "@/config/navigation";

type MobileBottomNavProps = {
    mode?: "app" | "public";
    user?: NavigationUserContext;
};

const anonymousUser: NavigationUserContext = {
    isAuthenticated: false,
    isAdmin: false,
};

export function MobileBottomNav({
                                    mode = "app",
                                    user,
                                }: MobileBottomNavProps) {
    const pathname = usePathname();
    const isAdminArea =
        mode === "app" &&
        pathname.startsWith("/admin");

    const effectiveUser =
        mode === "public"
            ? user ?? anonymousUser
            : {
                isAuthenticated: true,
                isAdmin: false,
            };

    const items = isAdminArea
        ? adminNavigationItems
        : mode === "public"
            ? getPublicMobileNavigation(
                effectiveUser,
            )
            : getPublicMobileNavigation({
                isAuthenticated: true,
                isAdmin: false,
            }).filter(
                (item) =>
                    item.href === "/" ||
                    item.href === "/perfil",
            );

    return (
        <nav
            className="bp-mobile-nav"
            aria-label="Navegação móvel"
        >
            {items.map((item) => {
                const Icon = item.icon;
                const active = isNavigationItemActive(
                    pathname,
                    item,
                );

                return (
                    <Link
                        key={`${item.label}-${item.href}`}
                        href={item.href}
                        className={
                            active ? "active" : ""
                        }
                        aria-current={
                            active ? "page" : undefined
                        }
                    >
                        <Icon size={17} />
                        {item.mobileLabel ?? item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
