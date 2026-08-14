"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    adminNavigationItems,
    getPublicDesktopNavigation,
    isNavigationItemActive,
    type NavigationItem,
    type NavigationUserContext,
} from "@/config/navigation";

type SidebarProps = {
    mode?: "app" | "public";
    user?: NavigationUserContext;
};

const anonymousUser: NavigationUserContext = {
    isAuthenticated: false,
    isAdmin: false,
};

function NavigationLinks({
                             items,
                             pathname,
                         }: {
    items: NavigationItem[];
    pathname: string;
}) {
    return (
        <nav className="bp-nav">
            {items.map((item) => {
                const Icon = item.icon;
                const active = isNavigationItemActive(
                    pathname,
                    item,
                );

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bp-nav-item ${
                            active ? "active" : ""
                        }`}
                        aria-current={
                            active ? "page" : undefined
                        }
                    >
                        <Icon size={18} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export function Sidebar({
                            mode = "app",
                            user,
                        }: SidebarProps) {
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

    const primaryItems = isAdminArea
        ? adminNavigationItems
        : getPublicDesktopNavigation(
            effectiveUser,
        );

    return (
        <aside className="bp-sidebar">
            <div className="bp-sidebar-brand">
                <Link
                    href={isAdminArea ? "/admin" : "/"}
                    className="bp-sidebar-logo-link"
                    aria-label="AAACCU - Computaria"
                >
                    <Image
                        src="/ent/atletica/aaaccu_logo_001.png"
                        alt="AAACCU"
                        width={54}
                        height={54}
                        className="bp-sidebar-logo"
                        priority
                    />

                    <span className="bp-sidebar-brand-text">
                        <strong>AAACCU</strong>
                        <small>
                            {isAdminArea
                                ? "Administração"
                                : "Computaria"}
                        </small>
                    </span>
                </Link>
            </div>

            <section className="bp-nav-section">
                {mode === "public" ? (
                    <span className="bp-nav-section-label">
                        Navegação
                    </span>
                ) : null}

                <NavigationLinks
                    items={primaryItems}
                    pathname={pathname}
                />
            </section>

            {mode === "public" &&
            effectiveUser.isAdmin ? (
                <section className="bp-nav-section bp-nav-section-admin">
                    <span className="bp-nav-section-label">
                        Administração
                    </span>

                    <NavigationLinks
                        items={adminNavigationItems}
                        pathname={pathname}
                    />
                </section>
            ) : null}
        </aside>
    );
}
