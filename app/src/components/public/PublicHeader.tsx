"use client";

import Link from "next/link";
import {
    LogIn,
    ShoppingBag,
} from "lucide-react";

import {
    usePublicCart,
} from "@/components/public/PublicCartProvider";
import {
    Avatar,
} from "@/components/ui/Avatar";
import {
    publicSiteConfig,
} from "@/config/public-site";

type PublicUser = {
    nome: string;
    avatar_url: string | null;
} | null;

export function PublicHeader({
                                 user,
                             }: {
    user: PublicUser;
}) {
    const {
        itemCount,
        hydrated,
    } = usePublicCart();

    return (
        <header className="bp-public-header">
            <div className="bp-public-container bp-public-header-inner">
                <Link
                    href="/"
                    className="bp-public-header-brand"
                    aria-label="AAACCU — início"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={publicSiteConfig.logoPath}
                        alt=""
                    />

                    <span>
                        <strong>
                            {publicSiteConfig.name}
                        </strong>
                        <small>
                            {publicSiteConfig.displayName}
                        </small>
                    </span>
                </Link>

                <span className="bp-public-header-spacer" />

                <div className="bp-public-header-actions">
                    <Link
                        href="/carrinho"
                        className="bp-public-cart-link"
                        aria-label={`Carrinho com ${
                            hydrated ? itemCount : 0
                        } itens`}
                    >
                        <ShoppingBag size={19} />

                        {hydrated && itemCount > 0 ? (
                            <span>
                                {itemCount > 99
                                    ? "99+"
                                    : itemCount}
                            </span>
                        ) : null}
                    </Link>

                    {user ? (
                        <Link
                            href="/perfil"
                            className="bp-topbar-user bp-public-account-link"
                            aria-label="Minha conta"
                        >
                            <Avatar
                                name={user.nome}
                                src={
                                    user.avatar_url ??
                                    undefined
                                }
                            />

                            <span className="bp-topbar-user-meta">
                                <strong>{user.nome}</strong>
                                <span>Minha conta</span>
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="bp-public-account-link bp-public-account-guest"
                        >
                            <LogIn size={17} />
                            <span>Entrar</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
