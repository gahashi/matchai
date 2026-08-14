"use client";

import { useRef } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageOff,
} from "lucide-react";

import type {
    PublicEvento,
} from "@/lib/cad/evento-public-types";

function formatEventDate(value: string | null) {
    if (!value) return "Data em breve";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function EventCardContent({
    evento,
}: {
    evento: PublicEvento;
}) {
    return (
        <>
            <div className="bp-public-event-media">
                {evento.banner?.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={evento.banner.public_url}
                        alt={evento.titulo}
                    />
                ) : (
                    <div className="bp-public-event-media-empty">
                        <ImageOff size={28} />
                        <span>Evento</span>
                    </div>
                )}

                {evento.destaque ? (
                    <span className="bp-public-event-featured">
                        Destaque
                    </span>
                ) : null}
            </div>

            <div className="bp-public-event-card-body">
                <span className="bp-public-event-date">
                    <CalendarDays size={14} />
                    {formatEventDate(evento.evento_at)}
                </span>

                <strong>{evento.titulo}</strong>

                {evento.url ? (
                    <span className="bp-public-event-link-label">
                        Acessar evento
                        <ExternalLink size={13} />
                    </span>
                ) : (
                    <span className="bp-public-event-link-label is-muted">
                        Mais informações em breve
                    </span>
                )}
            </div>
        </>
    );
}

export function PublicEventsSection({
    eventos,
}: {
    eventos: PublicEvento[];
}) {
    const trackRef =
        useRef<HTMLDivElement | null>(null);

    function move(direction: -1 | 1) {
        const track = trackRef.current;
        if (!track) return;

        const firstCard =
            track.querySelector<HTMLElement>(
                ".bp-public-event-card",
            );

        const amount =
            firstCard
                ? firstCard.offsetWidth + 14
                : 300;

        track.scrollBy({
            left: amount * direction,
            behavior: "smooth",
        });
    }

    if (eventos.length === 0) return null;

    return (
        <section
            id="eventos"
            className="bp-public-section bp-public-events-section"
        >
            <div className="bp-public-container">
                <div className="bp-public-section-head bp-public-events-head">
                    <div>
                        <span className="bp-public-kicker">
                            Eventos
                        </span>

                        <h2>
                            O que está acontecendo
                        </h2>

                        <p>
                            Fique por dentro dos próximos eventos da Computaria.
                        </p>
                    </div>

                    {eventos.length > 1 ? (
                        <div
                            className="bp-public-events-controls"
                            aria-label="Navegar pelos eventos"
                        >
                            <button
                                type="button"
                                onClick={() => move(-1)}
                                aria-label="Eventos anteriores"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={() => move(1)}
                                aria-label="Próximos eventos"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    ) : null}
                </div>

                <div
                    ref={trackRef}
                    className="bp-public-events-track"
                    tabIndex={0}
                    aria-label="Eventos da Computaria"
                >
                    {eventos.map((evento) =>
                        evento.url ? (
                            <a
                                key={evento.id}
                                href={evento.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="bp-public-event-card is-link"
                                aria-label={`Acessar evento ${evento.titulo}`}
                            >
                                <EventCardContent
                                    evento={evento}
                                />
                            </a>
                        ) : (
                            <article
                                key={evento.id}
                                className="bp-public-event-card"
                            >
                                <EventCardContent
                                    evento={evento}
                                />
                            </article>
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}
