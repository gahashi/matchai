import {
    Building2,
    CreditCard,
    Home,
    Settings,
    Shield,
    Store,
} from "lucide-react";

const navItems = [
    { label: "Dashboard", icon: Home, href: "/", active: true },
    { label: "Atléticas", icon: Shield, href: "/atletica" },
    { label: "Parceiros", icon: Store, href: "#" },
    { label: "Assinaturas", icon: CreditCard, href: "#" },
    { label: "Organizações", icon: Building2, href: "#" },
    { label: "Configurações", icon: Settings, href: "/tema" },
];

export function Sidebar() {
    return (
        <aside className="bp-sidebar">
            <div className="bp-logo">
                <div className="bp-logo-mark">B</div>
                <div className="bp-logo-text">
                    <strong>Brava Pass</strong>
                    <span>SaaS universitário</span>
                </div>
            </div>

            <nav className="bp-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`bp-nav-item ${item.active ? "active" : ""}`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </a>
                    );
                })}
            </nav>
        </aside>
    );
}