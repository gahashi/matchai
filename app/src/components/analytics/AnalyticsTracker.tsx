"use client";

import {
    useEffect,
} from "react";

import {
    usePathname,
} from "next/navigation";

const SESSION_KEY =
    "brava_pass_analytics_session";

const PREVIOUS_PATH_KEY =
    "brava_pass_analytics_previous_path";

const LAST_EVENT_KEY =
    "brava_pass_analytics_last_event";

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

function shouldIgnorePath(
    pathname: string,
) {
    return (
        pathname === "/admin" ||
        pathname.startsWith(
            "/admin/",
        )
    );
}

export function AnalyticsTracker() {
    const pathname =
        usePathname();

    useEffect(() => {
        if (
            !pathname ||
            shouldIgnorePath(pathname)
        ) {
            return;
        }

        /*
         * Evita duplicidade causada pelo
         * Strict Mode durante desenvolvimento.
         */
        const now =
            Date.now();

        const ultimoEventoRaw =
            window.sessionStorage.getItem(
                LAST_EVENT_KEY,
            );

        if (ultimoEventoRaw) {
            try {
                const ultimoEvento =
                    JSON.parse(
                        ultimoEventoRaw,
                    ) as {
                        path?: string;
                        at?: number;
                    };

                if (
                    ultimoEvento.path ===
                    pathname &&
                    typeof ultimoEvento.at ===
                    "number" &&
                    now -
                    ultimoEvento.at <
                    1000
                ) {
                    return;
                }
            } catch {
                // Ignora valor inválido.
            }
        }

        const sessionId =
            getSessionId();

        const rotaAnterior =
            window.sessionStorage.getItem(
                PREVIOUS_PATH_KEY,
            );

        window.sessionStorage.setItem(
            LAST_EVENT_KEY,
            JSON.stringify({
                path:
                pathname,

                at:
                now,
            }),
        );

        window.sessionStorage.setItem(
            PREVIOUS_PATH_KEY,
            pathname,
        );

        void fetch(
            "/api/sys/analytics/event",
            {
                method:
                    "POST",

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
                        "page_view",

                    nome:
                        null,

                    rota:
                    pathname,

                    rota_anterior:
                    rotaAnterior,

                    entidade_tipo:
                        null,

                    entidade_id:
                        null,
                }),

                keepalive:
                    true,
            },
        ).catch(() => {
            /*
             * Falha de analytics não deve
             * gerar erro para o usuário.
             */
        });
    }, [
        pathname,
    ]);

    return null;
}