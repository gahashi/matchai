import { Bell, LogIn, Search, UserPlus } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuthSession } from "@/lib/auth/session";

export async function Topbar() {
    const session = await getAuthSession();
    const user = session?.user ?? null;

    return (
        <header className="bp-topbar">
            <div className="bp-topbar-mobile-header">
                <AppLink
                    href="/"
                    className="bp-topbar-mobile-brand"
                    aria-label="Brava Pass"
                >
                    <span className="bp-topbar-mobile-logo-box">
                        <img
                            src="/brand/brava-pass-symbol-dark.png"
                            alt=""
                            className="bp-topbar-mobile-logo"
                        />
                    </span>

                    <span className="bp-topbar-mobile-title">
                        <strong>Brava Pass</strong>
                        <small>
                            {user ? "Painel administrativo" : "Sistema universitário"}
                        </small>
                    </span>
                </AppLink>

                <div className="bp-topbar-mobile-actions">
                    {user ? (
                        <>
                            <Button color="secondary" variant="ghost" aria-label="Notificações">
                                <Bell size={17} />
                            </Button>

                            <AppLink
                                href="/perfil"
                                color="secondary"
                                variant="ghost"
                                aria-label="Meu perfil"
                            >
                                <Avatar name={user.nome} src={user.avatar_url ?? undefined} />
                            </AppLink>
                        </>
                    ) : (
                        <>
                            <AppLink href="/login" color="secondary" variant="ghost">
                                <LogIn size={17} />
                            </AppLink>

                            <AppLink href="/cadastro" color="primary" variant="solid">
                                <UserPlus size={17} />
                            </AppLink>
                        </>
                    )}
                </div>
            </div>

            <div className="bp-topbar-search">
                <div style={{ position: "relative" }}>
                    <Search
                        size={17}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--color-text-soft)",
                        }}
                    />

                    <Input
                        placeholder="Buscar atléticas, parceiros, eventos..."
                        style={{ paddingLeft: 38 }}
                    />
                </div>
            </div>

            <div className="bp-topbar-actions">
                {user ? (
                    <>
                        <Button color="secondary" variant="ghost" aria-label="Notificações">
                            <Bell size={17} />
                        </Button>

                        <AppLink
                            href="/perfil"
                            color="secondary"
                            variant="ghost"
                            className="bp-topbar-user"
                            aria-label="Meu perfil"
                        >
                            <Avatar name={user.nome} src={user.avatar_url ?? undefined} />

                            <span className="bp-topbar-user-meta">
                                <strong>{user.nome}</strong>
                                <span>@{user.nickname}</span>
                            </span>
                        </AppLink>
                    </>
                ) : (
                    <div className="bp-topbar-auth-actions">
                        <AppLink href="/login" color="secondary" variant="ghost">
                            <LogIn size={17} />
                            Entrar
                        </AppLink>

                        <AppLink href="/cadastro" color="primary" variant="solid">
                            <UserPlus size={17} />
                            Criar conta
                        </AppLink>
                    </div>
                )}
            </div>
        </header>
    );
}