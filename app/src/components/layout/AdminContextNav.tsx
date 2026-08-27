"use client";

import Link from "next/link";

import {
    usePathname,
} from "next/navigation";

import {
    adminNavigationItems,
    isNavigationItemActive,
} from "@/config/navigation";


export function AdminContextNav() {
    const pathname =
        usePathname();


    if (
        !pathname.startsWith(
            "/admin",
        )
    ) {
        return null;
    }


    return (
        <nav
            className="bp-admin-context-nav"
            aria-label="Navegação da administração"
        >
            {adminNavigationItems.map(
                (
                    item,
                ) => {
                    const Icon =
                        item.icon;

                    const active =
                        isNavigationItemActive(
                            pathname,
                            item,
                        );

                    return (
                        <Link
                            key={
                                item.href
                            }
                            href={
                                item.href
                            }
                            target={
                                item.newTab
                                    ? "_blank"
                                    : undefined
                            }
                            rel={
                                item.newTab
                                    ? "noreferrer"
                                    : undefined
                            }
                            className={
                                active
                                    ? "active"
                                    : ""
                            }
                            aria-current={
                                active
                                    ? "page"
                                    : undefined
                            }
                        >
                            <Icon
                                size={15}
                            />

                            <span>
                                {
                                    item.mobileLabel ??
                                    item.label
                                }
                            </span>

                            {item.newTab ? (
                                <span
                                    className="bp-admin-context-nav-external"
                                    aria-hidden="true"
                                >
                                    ↗
                                </span>
                            ) : null}
                        </Link>
                    );
                },
            )}
        </nav>
    );
}
