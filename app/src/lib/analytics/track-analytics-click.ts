const SESSION_KEY =
    "brava_pass_analytics_session";

function getSessionId() {
    const existente =
        window.localStorage.getItem(
            SESSION_KEY,
        );

    if (existente) {
        return existente;
    }

    const sessionId =
        crypto.randomUUID();

    window.localStorage.setItem(
        SESSION_KEY,
        sessionId,
    );

    return sessionId;
}

export function trackAnalyticsClick(input: {
    nome: string;
    entidadeTipo: string;
    entidadeId: number;
}) {
    try {
        const sessionId =
            getSessionId();

        void fetch(
            "/api/sys/analytics/event",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Accept:
                        "application/json",
                },

                body: JSON.stringify({
                    session_id:
                    sessionId,

                    tipo:
                        "click",

                    nome:
                    input.nome,

                    rota:
                    window.location.pathname,

                    rota_anterior:
                        null,

                    entidade_tipo:
                    input.entidadeTipo,

                    entidade_id:
                    input.entidadeId,
                }),

                keepalive:
                    true,
            },
        ).catch(() => {
            // Analytics não pode afetar a navegação.
        });
    } catch {
        // Analytics não pode afetar a navegação.
    }
}