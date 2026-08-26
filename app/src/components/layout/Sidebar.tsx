"use client";

import {
    CSSProperties,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";

import Image from "next/image";

import Link from "next/link";

import {
    Building2,
    ChevronDown,
    Compass,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import {
    usePathname,
} from "next/navigation";

import {
    adminNavigationItems,
    isNavigationItemActive,
    publicNavigationItems,
    type NavigationItem,
    type NavigationPartner,
    type NavigationUserContext,
} from "@/config/navigation";


type SidebarProps = {
    mode?: "app" | "public";

    user?:
        NavigationUserContext;

    partners?:
        NavigationPartner[];
};


type GroupKey =
    | "explore"
    | "admin"
    | "partners";


const anonymousUser:
    NavigationUserContext = {
    isAuthenticated:
        false,

    isAdmin:
        false,
};


function NavigationLinks({
    items,
    pathname,
}: {
    items:
        NavigationItem[];

    pathname:
        string;
}) {
    return (
        <nav className="bp-nav">
            {items.map(
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
                            className={`bp-nav-item ${
                                active
                                    ? "active"
                                    : ""
                            }`}
                            aria-current={
                                active
                                    ? "page"
                                    : undefined
                            }
                        >
                            <Icon
                                size={18}
                            />

                            <span>
                                {
                                    item.label
                                }
                            </span>

                            {item.newTab ? (
                                <span
                                    className="bp-nav-item-external"
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


function NavigationGroup({
    label,
    href,
    icon: Icon,
    open,
    active,
    count,
    children,
    onToggle,
}: {
    label:
        string;

    href:
        string;

    icon:
        typeof Compass;

    open:
        boolean;

    active:
        boolean;

    count?:
        number;

    children:
        ReactNode;

    onToggle:
        () => void;
}) {
    return (
        <section
            className={[
                "bp-nav-group",

                open
                    ? "open"
                    : "",

                active
                    ? "active"
                    : "",
            ]
                .filter(
                    Boolean,
                )
                .join(
                    " ",
                )}
        >
            <div className="bp-nav-group-head">
                <Link
                    href={
                        href
                    }
                    className="bp-nav-group-link"
                >
                    <Icon
                        size={15}
                    />

                    <span>
                        {label}
                    </span>
                </Link>

                <button
                    type="button"
                    className="bp-nav-group-toggle"
                    aria-label={
                        open
                            ? `Recolher ${label}`
                            : `Expandir ${label}`
                    }
                    aria-expanded={
                        open
                    }
                    onClick={
                        onToggle
                    }
                >
                    {typeof count ===
                    "number" ? (
                        <span className="bp-nav-group-count">
                            {count}
                        </span>
                    ) : null}

                    <ChevronDown
                        size={15}
                        className="bp-nav-group-chevron"
                    />
                </button>
            </div>

            <div className="bp-nav-group-body">
                <div className="bp-nav-group-body-inner">
                    {children}
                </div>
            </div>
        </section>
    );
}

function PartnerLinks({
    partners,
    pathname,
}: {
    partners:
        NavigationPartner[];

    pathname:
        string;
}) {
    return (
        <nav className="bp-nav bp-nav-partners">
            {partners.map(
                (
                    partner,
                ) => {
                    const href =
                        `/parceiro/${partner.slug}`;

                    const active =
                        pathname ===
                        href ||
                        pathname.startsWith(
                            `${href}/`,
                        );

                    const partnerStyle =
                        {
                            "--bp-partner-color":
                                partner.corPrimaria ??
                                "#9CD91A",
                        } as CSSProperties;

                    return (
                        <Link
                            key={
                                partner.id
                            }
                            href={
                                href
                            }
                            className={`bp-nav-item bp-nav-partner-item ${
                                active
                                    ? "active"
                                    : ""
                            }`}
                            style={
                                partnerStyle
                            }
                            aria-current={
                                active
                                    ? "page"
                                    : undefined
                            }
                        >
                            <span className="bp-nav-partner-icon">
                                {partner.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={
                                            partner.logoUrl
                                        }
                                        alt=""
                                    />
                                ) : (
                                    <Building2
                                        size={16}
                                    />
                                )}
                            </span>

                            <span className="bp-nav-partner-name">
                                {
                                    partner.nome
                                }
                            </span>
                        </Link>
                    );
                },
            )}
        </nav>
    );
}


export function Sidebar({
    mode = "app",
    user,
    partners = [],
}: SidebarProps) {
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


    const isAdminArea =
        pathname.startsWith(
            "/admin",
        );

    const isPartnerArea =
        pathname.startsWith(
            "/parceiro",
        );


    const currentPartner =
        useMemo(
            () =>
                partners.find(
                    (
                        partner,
                    ) =>
                        pathname ===
                        `/parceiro/${partner.slug}` ||
                        pathname.startsWith(
                            `/parceiro/${partner.slug}/`,
                        ),
                ) ??
                null,
            [
                partners,
                pathname,
            ],
        );


    const [
        openGroups,
        setOpenGroups,
    ] =
        useState<
            Record<
                GroupKey,
                boolean
            >
        >({
            explore:
                !isAdminArea &&
                !isPartnerArea,

            admin:
                isAdminArea,

            partners:
                isPartnerArea,
        });


    useEffect(
        () => {
            if (
                isAdminArea
            ) {
                setOpenGroups(
                    (
                        current,
                    ) => ({
                        ...current,

                        admin:
                            true,
                    }),
                );
            }

            if (
                isPartnerArea
            ) {
                setOpenGroups(
                    (
                        current,
                    ) => ({
                        ...current,

                        partners:
                            true,
                    }),
                );
            }

            if (
                !isAdminArea &&
                !isPartnerArea
            ) {
                setOpenGroups(
                    (
                        current,
                    ) => ({
                        ...current,

                        explore:
                            true,
                    }),
                );
            }
        },
        [
            isAdminArea,
            isPartnerArea,
        ],
    );


    function toggleGroup(
        group:
            GroupKey,
    ) {
        setOpenGroups(
            (
                current,
            ) => ({
                ...current,

                [group]:
                    !current[
                        group
                    ],
            }),
        );
    }


    const brandSubtitle =
        isAdminArea
            ? "Administração"
            : currentPartner
                ?.nome ??
            (
                isPartnerArea
                    ? "Parceiros"
                    : "Computaria"
            );


    const publicAreaItems =
        publicNavigationItems
            .filter(
                (
                    item,
                ) =>
                    item.href !==
                    "/",
            );


    const adminAreaItems =
        adminNavigationItems
            .filter(
                (
                    item,
                ) =>
                    item.href !==
                    "/admin",
            );


    return (
        <aside className="bp-sidebar">
            <div className="bp-sidebar-brand">
                <Link
                    href="/"
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
                        <strong>
                            AAACCU
                        </strong>

                        <small>
                            {
                                brandSubtitle
                            }
                        </small>
                    </span>
                </Link>
            </div>


            <div className="bp-sidebar-navigation">
                <NavigationGroup
                    label="Público"
                    href="/"
                    icon={
                        Compass
                    }
                    open={
                        openGroups.explore
                    }
                    active={
                        !isAdminArea &&
                        !isPartnerArea
                    }
                    onToggle={() =>
                        toggleGroup(
                            "explore",
                        )
                    }
                >
                    <NavigationLinks
                        items={
                            publicAreaItems
                        }
                        pathname={
                            pathname
                        }
                    />
                </NavigationGroup>


                {effectiveUser.isAdmin ? (
                    <NavigationGroup
                        label="Administração"
                        href="/admin"
                        icon={
                            ShieldCheck
                        }
                        open={
                            openGroups.admin
                        }
                        active={
                            isAdminArea
                        }
                        onToggle={() =>
                            toggleGroup(
                                "admin",
                            )
                        }
                    >
                        <NavigationLinks
                            items={
                                adminAreaItems
                            }
                            pathname={
                                pathname
                            }
                        />
                    </NavigationGroup>
                ) : null}


                {effectiveUser.isAuthenticated &&
                partners.length >
                0 ? (
                    <NavigationGroup
                        label="Parceiros"
                        href="/parceiro"
                        icon={
                            Building2
                        }
                        open={
                            openGroups.partners
                        }
                        active={
                            isPartnerArea
                        }
                        count={
                            partners.length
                        }
                        onToggle={() =>
                            toggleGroup(
                                "partners",
                            )
                        }
                    >
                        <PartnerLinks
                            partners={
                                partners
                            }
                            pathname={
                                pathname
                            }
                        />
                    </NavigationGroup>
                ) : null}
            </div>


            {effectiveUser.isAuthenticated ? (
                <div className="bp-sidebar-account">
                    <Link
                        href="/perfil"
                        className={`bp-nav-item ${
                            pathname ===
                            "/perfil"
                                ? "active"
                                : ""
                        }`}
                    >
                        <UserRound
                            size={18}
                        />

                        <span>
                            Minha conta
                        </span>
                    </Link>
                </div>
            ) : null}
        </aside>
    );
}
