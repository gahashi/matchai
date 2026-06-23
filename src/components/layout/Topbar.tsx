import { Bell, Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Topbar() {
    return (
        <div className="bp-topbar">
            <div style={{ flex: 1, maxWidth: 460 }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button variant="secondary">
                    <Bell size={17} />
                </Button>

                <Button>
                    <Plus size={17} />
                    <span className="hide-mobile">Nova atlética</span>
                </Button>

                <Avatar name="Admin Dev" />
            </div>
        </div>
    );
}