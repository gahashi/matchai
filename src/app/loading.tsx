export default function LoadingPage() {
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

                <div className="bp-status-loading-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>

                <h1>Carregando</h1>

                <p>
                    Estamos preparando as informações do painel Brava Pass.
                </p>
            </section>
        </main>
    );
}