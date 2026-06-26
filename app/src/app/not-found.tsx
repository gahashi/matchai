import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
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

                <div className="bp-status-icon">
                    <SearchX size={28} />
                </div>

                <span className="bp-status-code">404</span>

                <h1>Página não encontrada</h1>

                <p>
                    A página que você tentou acessar não existe, foi removida ou
                    teve o endereço alterado.
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