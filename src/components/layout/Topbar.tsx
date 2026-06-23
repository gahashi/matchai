import { Bell, Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Topbar() {
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
                    <Button variant="secondary" aria-label="Notificações">
                        <Bell size={17} />
                    </Button>

                    <Avatar name="Admin Dev" />
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
                <Button variant="secondary" aria-label="Notificações">
                    <Bell size={17} />
                </Button>

                <Button>
                    <Plus size={17} />
                    <span className="hide-mobile">Nova atlética</span>
                </Button>

                <Avatar name="Admin Dev" />
            </div>
        </header>
    );
}