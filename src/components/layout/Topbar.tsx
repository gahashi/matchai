"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Plus, Search } from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Topbar() {
    const router = useRouter();

    async function handleLogout() {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                    router.refresh();
                },
            },
        });
    }

    return (
        <header className="bp-topbar">
            <div className="bp-topbar-mobile-header">
                <a href="/" className="bp-topbar-mobile-brand" aria-label="Brava Pass">
                    <span className="bp-topbar-mobile-logo-box">
                        <img
                            src="/brand/brava-pass-symbol-dark.png"
                            alt=""
                            className="bp-topbar-mobile-logo"
                        />
                    </span>

                    <span className="bp-topbar-mobile-title">
                        <strong>Brava Pass</strong>
                        <small>Painel administrativo</small>
                    </span>
                </a>

                <div className="bp-topbar-mobile-actions">
                    <Button variant="ghost" aria-label="Notificações">
                        <Bell size={17} />
                    </Button>

                    <Button
                        variant="ghost"
                        aria-label="Sair"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                    </Button>

                    <Avatar name="Admin Dev" size="sm" />
                </div>
            </div>

            <div className="bp-topbar-search">
                <div className="bp-search-field">
                    <Search size={17} className="bp-search-field-icon" />

                    <Input
                        placeholder="Buscar atléticas, parceiros, eventos..."
                        className="bp-search-field-input"
                    />
                </div>
            </div>

            <div className="bp-topbar-actions">
                <Button variant="ghost" aria-label="Notificações">
                    <Bell size={17} />
                </Button>

                <Button>
                    <Plus size={17} />
                    <span className="hide-mobile">Nova atlética</span>
                </Button>

                <Button variant="secondary" onClick={handleLogout}>
                    <LogOut size={17} />
                    <span className="hide-mobile">Sair</span>
                </Button>

                <Avatar name="Admin Dev" />
            </div>
        </header>
    );
}