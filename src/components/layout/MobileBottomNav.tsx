"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Home, Settings, Shield } from "lucide-react";

const mobileNavItems = [
    { label: "Início", icon: Home, href: "/" },
    { label: "Atlética", icon: Shield, href: "/atletica" },
    { label: "Planos", icon: CreditCard, href: "/assinaturas" },
    { label: "Tema", icon: Settings, href: "/tema" },
];

function isActiveRoute(pathname: string, href: string) {
    if (href === "/") {
        return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bp-mobile-nav">
            {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(pathname, item.href);

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={active ? "active" : ""}
                    >
                        <Icon size={17} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}