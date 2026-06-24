"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);

        await authClient.signOut();

        router.replace("/login");
        router.refresh();
    }

    return (
        <Button
            color="secondary"
            variant="ghost"
            onClick={handleLogout}
            disabled={loading}
            aria-label="Sair da conta"
        >
            <LogOut size={17} />
            <span className="hide-mobile">
                {loading ? "Saindo..." : "Sair"}
            </span>
        </Button>
    );
}