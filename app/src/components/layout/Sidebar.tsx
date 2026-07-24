"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building2,
    CreditCard,
    Home,
    Settings,
    Shield,
    Store,
} from "lucide-react";

const navItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Atléticas", icon: Shield, href: "/ent/atletica" },
    { label: "Parceiros", icon: Store, href: "/parceiros" },
    { label: "Assinaturas", icon: CreditCard, href: "/assinaturas" },
    { label: "Organizações", icon: Building2, href: "/organizacoes" },
    { label: "Configurações", icon: Settings, href: "/ent/atletica/tema" },
];

function isActiveRoute(pathname: string, href: string) {
    if (href === "/") {
        return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="bp-sidebar">
            <div className="bp-sidebar-brand">
                <Link href="/" className="bp-sidebar-logo-link">
                    <img
                        src="/brand/brava-pass-logo-dark.png"
                        alt="Brava Pass"
                        className="bp-sidebar-logo"
                    />
                </Link>
            </div>

            <nav className="bp-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(pathname, item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`bp-nav-item ${active ? "active" : ""}`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}