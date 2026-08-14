import {
    CalendarDays,
    Package,
    ShoppingBag,
    UsersRound,
    WalletCards,
} from "lucide-react";

import {
    AppShell,
} from "@/components/layout/AppShell";
import {
    AppLink,
} from "@/components/ui/AppLink";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
import {
    PageHeader,
} from "@/components/ui/PageHeader";
import {
    requirePageAccess,
} from "@/lib/auth/require-access";

const adminOptions = [
    {
        title: "Produtos",
        description:
            "Cadastre e gerencie os produtos disponíveis para venda.",
        href: "/admin/produtos",
        icon: Package,
    },
    {
        title: "Eventos",
        description:
            "Gerencie banners, links e períodos de divulgação dos eventos.",
        href: "/admin/eventos",
        icon: CalendarDays,
    },
    {
        title: "Planos de sócio",
        description:
            "Cadastre e gerencie os planos de associação disponíveis.",
        href: "/admin/planos-socio",
        icon: WalletCards,
    },
    {
        title: "Pedidos",
        description:
            "Acompanhe pedidos, pagamentos e andamento das vendas.",
        href: "/admin/pedidos",
        icon: ShoppingBag,
    },
    {
        title: "Sócios",
        description:
            "Consulte e gerencie os sócios e suas associações.",
        href: "/admin/socios",
        icon: UsersRound,
    },
];

export default async function AdminPage() {
    await requirePageAccess(
        "/admin",
    );

    return (
        <AppShell>
            <PageHeader
                title="Administração"
                subtitle="Gerencie vendas, eventos e associações da AAACCU."
            />

            <div className="bp-admin-option-grid">
                {adminOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                        <AppLink
                            key={option.href}
                            href={option.href}
                            className="bp-admin-option-link"
                        >
                            <Card
                                variant="outline"
                                className="bp-admin-option-card"
                            >
                                <CardBody>
                                    <div className="bp-admin-option-content">
                                        <div className="bp-admin-option-icon">
                                            <Icon size={21} />
                                        </div>

                                        <div>
                                            <h2 className="bp-section-title bp-admin-option-title">
                                                {option.title}
                                            </h2>

                                            <p className="bp-section-subtitle bp-admin-option-description">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </AppLink>
                    );
                })}
            </div>
        </AppShell>
    );
}
