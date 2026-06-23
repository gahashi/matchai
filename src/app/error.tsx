"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ErrorPageProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
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
                    <AlertTriangle size={28} />
                </div>

                <span className="bp-status-code">Erro</span>

                <h1>Algo deu errado</h1>

                <p>
                    Não foi possível carregar esta área do sistema. Tente
                    novamente em alguns instantes.
                </p>

                {process.env.NODE_ENV === "development" && (
                    <pre className="bp-status-error-debug">
                        {error.message}
                    </pre>
                )}

                <div className="bp-status-actions">
                    <Button onClick={reset}>
                        <RotateCcw size={17} />
                        Tentar novamente
                    </Button>
                </div>
            </section>
        </main>
    );
}