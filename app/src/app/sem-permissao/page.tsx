import Link from "next/link";
import { Lock, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SemPermissaoPage() {
    return (
        <main className="bp-status-page">
            <section className="bp-status-card">
                <div className="bp-status-logo-wrap">
                    <img
                        src="/brand/brava-pass-symbol-dark.png"
                        alt="Brava Pass"
                        className="bp-status-logo"
                    />
                </div>

                <div className="bp-status-icon danger">
                    <Lock size={28} />
                </div>

                <span className="bp-status-code">403</span>

                <h1>Sem permissão</h1>

                <p>
                    Seu usuário não possui autorização para acessar esta área do
                    sistema.
                </p>

                <div className="bp-status-actions">
                    <Link href="/">
                        <Button>
                            <Home size={17} />
                            Voltar para o painel
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}