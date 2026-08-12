import {
    LogIn,
    UserPlus,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { Avatar } from "@/components/ui/Avatar";
import { getAuthSession } from "@/lib/auth/session";

export async function Topbar() {
    const session =
        await getAuthSession();

    const user =
        session?.user ?? null;

    return (
        <header className="bp-topbar">
            <div className="bp-topbar-mobile-header">
                <AppLink
                    href="/"
                    className="bp-topbar-mobile-brand"
                    aria-label="AAACCU"
                >
                    <span className="bp-topbar-mobile-logo-box">
                        <img
                            src="/ent/atletica/aaaccu_logo_001.png"
                            alt=""
                            className="bp-topbar-mobile-logo"
                        />
                    </span>

                    <span className="bp-topbar-mobile-title">
                        <strong>
                            AAACCU
                        </strong>

                        <small>
                            Computaria
                        </small>
                    </span>
                </AppLink>

                <div className="bp-topbar-mobile-actions">
                    {user ? (
                        <AppLink
                            href="/perfil"
                            color="secondary"
                            variant="ghost"
                            aria-label="Minha conta"
                        >
                            <Avatar
                                name={
                                    user.nome
                                }
                                src={
                                    user.avatar_url ??
                                    undefined
                                }
                            />
                        </AppLink>
                    ) : (
                        <>
                            <AppLink
                                href="/login"
                                color="secondary"
                                variant="ghost"
                                aria-label="Entrar"
                            >
                                <LogIn
                                    size={17}
                                />
                            </AppLink>

                            <AppLink
                                href="/cadastro"
                                color="primary"
                                variant="solid"
                                aria-label="Criar conta"
                            >
                                <UserPlus
                                    size={17}
                                />
                            </AppLink>
                        </>
                    )}
                </div>
            </div>

            <div className="bp-topbar-spacer" />

            <div className="bp-topbar-actions">
                {user ? (
                    <AppLink
                        href="/perfil"
                        color="secondary"
                        variant="ghost"
                        className="bp-topbar-user"
                        aria-label="Minha conta"
                    >
                        <Avatar
                            name={
                                user.nome
                            }
                            src={
                                user.avatar_url ??
                                undefined
                            }
                        />

                        <span className="bp-topbar-user-meta">
                            <strong>
                                {user.nome}
                            </strong>

                            <span>
                                Minha conta
                            </span>
                        </span>
                    </AppLink>
                ) : (
                    <div className="bp-topbar-auth-actions">
                        <AppLink
                            href="/login"
                            color="secondary"
                            variant="ghost"
                        >
                            <LogIn
                                size={17}
                            />

                            Entrar
                        </AppLink>

                        <AppLink
                            href="/cadastro"
                            color="primary"
                            variant="solid"
                        >
                            <UserPlus
                                size={17}
                            />

                            Criar conta
                        </AppLink>
                    </div>
                )}
            </div>
        </header>
    );
}