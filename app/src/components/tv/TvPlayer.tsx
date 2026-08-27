"use client";

import {
    CSSProperties,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import QRCode from "qrcode";

import type {
    TvPlaylistData,
    TvPlaylistItem,
} from "@/lib/tv/tv-playlist-service";


const TEMPO_PADRAO_IMAGEM_MS =
    18000;

const REFRESH_PLAYLIST_MS =
    60000;

const LOGO_BRAVA_PASS =
    "/brand/brava-pass-symbol-dark.png";

const LOGO_BRAVA_PASS_COMPLETA =
    "/brand/brava-pass-logo-dark.png";


type FrameFormat =
    | "story"
    | "quadrado"
    | "paisagem";


type Props = {
    initialData: TvPlaylistData;
    slug: string | null;
};


function detectFormat(
    width: number,
    height: number,
): FrameFormat {
    if (
        width <=
        0 ||
        height <=
        0
    ) {
        return "story";
    }

    const ratio =
        width /
        height;

    if (
        ratio >=
        1.25
    ) {
        return "paisagem";
    }

    if (
        ratio <=
        0.85
    ) {
        return "story";
    }

    return "quadrado";
}


function resolveLink(
    link: string | null,
) {
    if (
        !link
    ) {
        return null;
    }

    try {
        return new URL(
            link,
            window.location.origin,
        ).toString();
    } catch {
        return null;
    }
}


function renderInlineMarkdown(
    text: string,
) {
    const parts =
        text.split(
            /(\*\*.*?\*\*)/g,
        );

    return parts.map(
        (
            part,
            index,
        ) => {
            if (
                part.startsWith(
                    "**",
                ) &&
                part.endsWith(
                    "**",
                )
            ) {
                return (
                    <strong
                        key={
                            index
                        }
                    >
                        {part.slice(
                            2,
                            -2,
                        )}
                    </strong>
                );
            }

            return (
                <span
                    key={
                        index
                    }
                >
                    {part}
                </span>
            );
        },
    );
}


function TvDescription({
                           text,
                       }: {
    text: string;
}) {
    const blocks =
        text
            .split(
                /\n\s*\n/g,
            )
            .filter(
                Boolean,
            );

    return (
        <div className="bp-tv-description">
            {blocks.map(
                (
                    block,
                    index,
                ) => {
                    const lines =
                        block
                            .split(
                                "\n",
                            )
                            .filter(
                                Boolean,
                            );

                    const isList =
                        lines.length >
                        0 &&
                        lines.every(
                            (
                                line,
                            ) =>
                                line
                                    .trim()
                                    .startsWith(
                                        "- ",
                                    ),
                        );

                    if (
                        isList
                    ) {
                        return (
                            <ul
                                key={
                                    index
                                }
                            >
                                {lines.map(
                                    (
                                        line,
                                        lineIndex,
                                    ) => (
                                        <li
                                            key={
                                                lineIndex
                                            }
                                        >
                                            {renderInlineMarkdown(
                                                line.replace(
                                                    /^- /,
                                                    "",
                                                ),
                                            )}
                                        </li>
                                    ),
                                )}
                            </ul>
                        );
                    }

                    return (
                        <p
                            key={
                                index
                            }
                        >
                            {lines.map(
                                (
                                    line,
                                    lineIndex,
                                ) => (
                                    <span
                                        key={
                                            lineIndex
                                        }
                                    >
                                        {renderInlineMarkdown(
                                            line,
                                        )}

                                        {lineIndex <
                                        lines.length -
                                        1 ? (
                                            <br />
                                        ) : null}
                                    </span>
                                ),
                            )}
                        </p>
                    );
                },
            )}
        </div>
    );
}


function TvMedia({
                     item,
                     background = false,
                     paused = false,
                     onEnded,
                     onFormatDetected,
                 }: {
    item: TvPlaylistItem;
    background?: boolean;
    paused?: boolean;
    onEnded?: () => void;
    onFormatDetected?: (
        format: FrameFormat,
        aspectRatio: number,
    ) => void;
}) {
    const videoRef =
        useRef<HTMLVideoElement | null>(
            null,
        );


    useEffect(
        () => {
            if (
                item.media_tipo !==
                "video"
            ) {
                return;
            }


            const video =
                videoRef.current;


            if (
                !video
            ) {
                return;
            }


            if (
                paused
            ) {
                video.pause();

                return;
            }


            void video
                .play()
                .catch(
                    () => {
                        // Autoplay pode ser bloqueado até o navegador permitir mídia.
                    },
                );
        },
        [
            item.media_tipo,
            item.media_url,
            paused,
        ],
    );


    if (
        !item.media_url
    ) {
        return null;
    }

    if (
        item.media_tipo ===
        "video"
    ) {
        return (
            <video
                ref={
                    videoRef
                }
                key={
                    item.media_url
                }
                className={
                    background
                        ? "bp-tv-media bp-tv-background-media"
                        : "bp-tv-media"
                }
                src={
                    item.media_url
                }
                autoPlay
                muted
                loop={
                    background
                }
                playsInline
                preload="auto"
                onLoadedMetadata={(
                    event,
                ) => {
                    if (
                        background ||
                        !onFormatDetected
                    ) {
                        return;
                    }

                    const width =
                        event
                            .currentTarget
                            .videoWidth;

                    const height =
                        event
                            .currentTarget
                            .videoHeight;

                    onFormatDetected(
                        detectFormat(
                            width,
                            height,
                        ),

                        width /
                        height,
                    );
                }}
                onEnded={
                    background
                        ? undefined
                        : onEnded
                }
            />
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            key={
                item.media_url
            }
            className={
                background
                    ? "bp-tv-media bp-tv-background-media"
                    : "bp-tv-media"
            }
            src={
                item.media_url
            }
            alt=""
            onLoad={(
                event,
            ) => {
                if (
                    background ||
                    !onFormatDetected
                ) {
                    return;
                }

                const width =
                    event
                        .currentTarget
                        .naturalWidth;

                const height =
                    event
                        .currentTarget
                        .naturalHeight;

                onFormatDetected(
                    detectFormat(
                        width,
                        height,
                    ),

                    width /
                    height,
                );
            }}
        />
    );
}


export function TvPlayer({
                             initialData,
                             slug,
                         }: Props) {
    const [
        data,
        setData,
    ] =
        useState(
            initialData,
        );

    const [
        currentIndex,
        setCurrentIndex,
    ] =
        useState(
            0,
        );

    const [
        visible,
        setVisible,
    ] =
        useState(
            true,
        );

    const [
        qrCodeUrl,
        setQrCodeUrl,
    ] =
        useState(
            "",
        );

    const [
        frameFormat,
        setFrameFormat,
    ] =
        useState<FrameFormat>(
            "story",
        );


    const [
        mediaAspectRatio,
        setMediaAspectRatio,
    ] =
        useState(
            9 / 16,
        );

    const [
        refreshFailed,
        setRefreshFailed,
    ] =
        useState(
            false,
        );


    const [
        paused,
        setPaused,
    ] =
        useState(
            false,
        );


    const imageTimerRef =
        useRef<number | null>(
            null,
        );

    const imageTimerStartedAtRef =
        useRef<number | null>(
            null,
        );

    const imageTimerRemainingRef =
        useRef(
            TEMPO_PADRAO_IMAGEM_MS,
        );

    const transitionTimerRef =
        useRef<number | null>(
            null,
        );


    const currentItem =
        data
            .itens[
            currentIndex
            ];


    const currentImageDurationMs =
        currentItem
            ?.duracao_segundos &&
        currentItem
            .duracao_segundos >
        0
            ? currentItem
                .duracao_segundos *
            1000
            : TEMPO_PADRAO_IMAGEM_MS;


    const navigate =
        useCallback(
            (
                direction:
                    1 |
                    -1,
            ) => {
                if (
                    data
                        .itens
                        .length <=
                    1
                ) {
                    return;
                }


                if (
                    transitionTimerRef
                        .current !==
                    null
                ) {
                    window.clearTimeout(
                        transitionTimerRef
                            .current,
                    );
                }


                setVisible(
                    false,
                );


                transitionTimerRef
                    .current =
                    window.setTimeout(
                        () => {
                            setCurrentIndex(
                                (
                                    index,
                                ) =>
                                    (
                                        index +
                                        direction +
                                        data
                                            .itens
                                            .length
                                    ) %
                                    data
                                        .itens
                                        .length,
                            );


                            imageTimerRemainingRef
                                .current =
                                TEMPO_PADRAO_IMAGEM_MS;

                            imageTimerStartedAtRef
                                .current =
                                null;


                            setVisible(
                                true,
                            );


                            transitionTimerRef
                                .current =
                                null;
                        },
                        350,
                    );
            },
            [
                data.itens.length,
            ],
        );


    const advance =
        useCallback(
            () => {
                navigate(
                    1,
                );
            },
            [
                navigate,
            ],
        );


    const previous =
        useCallback(
            () => {
                navigate(
                    -1,
                );
            },
            [
                navigate,
            ],
        );


    const progress =
        useMemo(
            () => {
                if (
                    data
                        .itens
                        .length ===
                    0
                ) {
                    return 0;
                }

                return (
                        (
                            currentIndex +
                            1
                        ) /
                        data
                            .itens
                            .length
                    ) *
                    100;
            },
            [
                currentIndex,
                data.itens.length,
            ],
        );


    useEffect(
        () => {
            const defaultFormat =
                currentItem
                    ?.origem ===
                "promocao"
                    ? "quadrado"
                    : "story";

            setFrameFormat(
                defaultFormat,
            );

            setMediaAspectRatio(
                defaultFormat ===
                "quadrado"
                    ? 1
                    : 9 / 16,
            );
        },
        [
            currentItem?.id,
            currentItem?.origem,
        ],
    );


    useEffect(
        () => {
            const link =
                resolveLink(
                    currentItem
                        ?.link ??
                    null,
                );

            if (
                !link
            ) {
                setQrCodeUrl(
                    "",
                );

                return;
            }

            let active =
                true;

            QRCode.toDataURL(
                link,
                {
                    width:
                        360,

                    margin:
                        2,

                    errorCorrectionLevel:
                        "H",

                    color: {
                        dark:
                            "#050507",

                        light:
                            "#ffffff",
                    },
                },
            )
                .then(
                    (
                        url,
                    ) => {
                        if (
                            active
                        ) {
                            setQrCodeUrl(
                                url,
                            );
                        }
                    },
                )
                .catch(
                    () => {
                        if (
                            active
                        ) {
                            setQrCodeUrl(
                                "",
                            );
                        }
                    },
                );

            return () => {
                active =
                    false;
            };
        },
        [
            currentItem?.link,
        ],
    );


    useEffect(
        () => {
            imageTimerRemainingRef
                .current =
                currentImageDurationMs;

            imageTimerStartedAtRef
                .current =
                null;


            if (
                imageTimerRef
                    .current !==
                null
            ) {
                window.clearTimeout(
                    imageTimerRef
                        .current,
                );

                imageTimerRef
                    .current =
                    null;
            }
        },
        [
            currentImageDurationMs,
            currentItem?.id,
        ],
    );


    useEffect(
        () => {
            if (
                !currentItem ||
                data
                    .itens
                    .length <=
                1 ||
                currentItem
                    .media_tipo ===
                "video" ||
                paused
            ) {
                return;
            }


            const remaining =
                Math.max(
                    0,
                    imageTimerRemainingRef
                        .current,
                );


            imageTimerStartedAtRef
                .current =
                Date.now();


            imageTimerRef
                .current =
                window.setTimeout(
                    () => {
                        imageTimerRef
                            .current =
                            null;

                        imageTimerStartedAtRef
                            .current =
                            null;

                        imageTimerRemainingRef
                            .current =
                            currentImageDurationMs;

                        advance();
                    },
                    remaining,
                );


            return () => {
                if (
                    imageTimerRef
                        .current !==
                    null
                ) {
                    window.clearTimeout(
                        imageTimerRef
                            .current,
                    );

                    imageTimerRef
                        .current =
                        null;
                }


                if (
                    imageTimerStartedAtRef
                        .current !==
                    null
                ) {
                    const elapsed =
                        Date.now() -
                        imageTimerStartedAtRef
                            .current;


                    imageTimerRemainingRef
                        .current =
                        Math.max(
                            0,
                            imageTimerRemainingRef
                                .current -
                            elapsed,
                        );


                    imageTimerStartedAtRef
                        .current =
                        null;
                }
            };
        },
        [
            advance,
            currentImageDurationMs,
            currentItem,
            data.itens.length,
            paused,
        ],
    );


    useEffect(
        () => {
            function handleKeyDown(
                event:
                    KeyboardEvent,
            ) {
                const target =
                    event.target as HTMLElement | null;


                if (
                    target &&
                    [
                        "INPUT",
                        "TEXTAREA",
                        "SELECT",
                        "BUTTON",
                    ].includes(
                        target.tagName,
                    )
                ) {
                    return;
                }


                if (
                    event.code ===
                    "Space"
                ) {
                    event.preventDefault();

                    setPaused(
                        (
                            current,
                        ) =>
                            !current,
                    );

                    return;
                }


                if (
                    event.key ===
                    "ArrowRight"
                ) {
                    event.preventDefault();

                    advance();

                    return;
                }


                if (
                    event.key ===
                    "ArrowLeft"
                ) {
                    event.preventDefault();

                    previous();
                }
            }


            window.addEventListener(
                "keydown",
                handleKeyDown,
            );


            return () =>
                window.removeEventListener(
                    "keydown",
                    handleKeyDown,
                );
        },
        [
            advance,
            previous,
        ],
    );


    useEffect(
        () => {
            return () => {
                if (
                    transitionTimerRef
                        .current !==
                    null
                ) {
                    window.clearTimeout(
                        transitionTimerRef
                            .current,
                    );
                }
            };
        },
        [],
    );


    useEffect(
        () => {
            let active =
                true;

            async function refreshPlaylist() {
                try {
                    const query =
                        slug
                            ? `?slug=${encodeURIComponent(
                                slug,
                            )}`
                            : "";

                    const response =
                        await fetch(
                            `/api/tv/playlist${query}`,
                            {
                                cache:
                                    "no-store",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            },
                        );

                    const result =
                        await response
                            .json();

                    if (
                        !response.ok ||
                        !result.ok ||
                        !result.data
                    ) {
                        throw new Error(
                            result.message ||
                            "Não foi possível atualizar a playlist.",
                        );
                    }

                    if (
                        !active
                    ) {
                        return;
                    }

                    setRefreshFailed(
                        false,
                    );

                    setData(
                        (
                            current,
                        ) => {
                            const currentId =
                                current
                                    .itens[
                                    currentIndex
                                    ]
                                    ?.id;

                            const nextData =
                                result
                                    .data as TvPlaylistData;

                            if (
                                nextData
                                    .itens
                                    .length ===
                                0
                            ) {
                                setCurrentIndex(
                                    0,
                                );

                                return nextData;
                            }

                            const nextIndex =
                                currentId
                                    ? nextData
                                        .itens
                                        .findIndex(
                                            (
                                                item,
                                            ) =>
                                                item.id ===
                                                currentId,
                                        )
                                    : -1;

                            setCurrentIndex(
                                nextIndex >=
                                0
                                    ? nextIndex
                                    : 0,
                            );

                            return nextData;
                        },
                    );
                } catch {
                    if (
                        active
                    ) {
                        setRefreshFailed(
                            true,
                        );
                    }
                }
            }

            const interval =
                window.setInterval(
                    refreshPlaylist,
                    REFRESH_PLAYLIST_MS,
                );

            return () => {
                active =
                    false;

                window.clearInterval(
                    interval,
                );
            };
        },
        [
            currentIndex,
            slug,
        ],
    );


    if (
        !currentItem
    ) {
        return (
            <main className="bp-tv-empty">
                <div className="bp-tv-empty-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={
                            LOGO_BRAVA_PASS_COMPLETA
                        }
                        alt="Brava Pass"
                    />

                    <h1>
                        Nenhuma divulgação disponível
                    </h1>

                    <p>
                        Não há conteúdo ativo para este telão no momento.
                    </p>

                    {refreshFailed ? (
                        <small>
                            Conexão instável. A TV continuará tentando atualizar automaticamente.
                        </small>
                    ) : null}
                </div>
            </main>
        );
    }


    const accentColor =
        currentItem.origem ===
        "evento"
            ? "#9CD91A"
            : currentItem
                .cor_destaque ||
            "#9CD91A";


    const style =
        {
            "--tv-accent":
            accentColor,
        } as CSSProperties;


    const isTallMedia =
        mediaAspectRatio <
        (
            1 /
            1.5
        );


    const hasQr =
        Boolean(
            currentItem.link &&
            qrCodeUrl,
        );


    const frameClass =
        [
            "bp-tv-media-frame",

            `bp-tv-media-${frameFormat}`,

            isTallMedia
                ? "bp-tv-media-tall"
                : "",

            hasQr
                ? "bp-tv-media-with-qr"
                : "bp-tv-media-without-qr",
        ]
            .filter(
                Boolean,
            )
            .join(
                " ",
            );


    const frameStyle:
        CSSProperties =
        isTallMedia
            ? {
                height:
                    "min(82vh, 780px)",

                width:
                    "auto",

                aspectRatio:
                    String(
                        mediaAspectRatio,
                    ),

                right:
                    hasQr
                        ? "390px"
                        : "64px",
            }
            : frameFormat ===
            "paisagem"
                ? {
                    width:
                        hasQr
                            ? "min(42vw, 720px)"
                            : "min(46vw, 800px)",

                    aspectRatio:
                        String(
                            mediaAspectRatio,
                        ),

                    right:
                        hasQr
                            ? "360px"
                            : "64px",
                }
                : {
                    width:
                        hasQr
                            ? "min(32vw, 520px)"
                            : "min(36vw, 590px)",

                    aspectRatio:
                        String(
                            mediaAspectRatio,
                        ),

                    right:
                        hasQr
                            ? "390px"
                            : "64px",
                };

    const partnerLogo =
        currentItem
            .parceiro
            ?.logo_url;


    return (
        <main
            className="bp-tv-screen"
            style={
                style
            }
        >
            {currentItem.media_url ? (
                <div
                    key={
                        `bg:${currentItem.id}`
                    }
                    className={`bp-tv-background ${visible ? "is-visible" : "is-hidden"}`}
                >
                    <TvMedia
                        item={
                            currentItem
                        }
                        background
                        paused={
                            paused
                        }
                    />
                </div>
            ) : (
                <div className="bp-tv-background bp-tv-background-fallback" />
            )}

            <div className="bp-tv-overlay" />

            {currentItem.media_url ? (
                <div
                    key={
                        `frame:${currentItem.id}`
                    }
                    className={`${frameClass} ${visible ? "is-visible" : "is-hidden"}`}
                    style={
                        frameStyle
                    }
                >
                    <TvMedia
                        item={
                            currentItem
                        }
                        paused={
                            paused
                        }
                        onEnded={
                            advance
                        }
                        onFormatDetected={(
                            format,
                            aspectRatio,
                        ) => {
                            setFrameFormat(
                                format,
                            );

                            setMediaAspectRatio(
                                aspectRatio,
                            );
                        }}
                    />
                </div>
            ) : null}

            <section
                className={`bp-tv-content ${visible ? "is-visible" : "is-hidden"}`}
            >
                <header className="bp-tv-brand-area">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="bp-tv-brand-logo"
                        src={
                            LOGO_BRAVA_PASS
                        }
                        alt="Brava Pass"
                    />

                    {partnerLogo ? (
                        <>
                            <span className="bp-tv-brand-separator">
                                ×
                            </span>

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                className="bp-tv-partner-logo"
                                src={
                                    partnerLogo
                                }
                                alt={
                                    currentItem
                                        .parceiro
                                        ?.nome ??
                                    "Parceiro"
                                }
                            />
                        </>
                    ) : null}

                    <div>
                        <strong>
                            {currentItem
                                    .parceiro
                                    ?.nome ??
                                data
                                    .contexto
                                    .titulo}
                        </strong>

                        <span>
                            {currentItem.origem ===
                            "promocao"
                                ? "Parceiro Brava Pass"
                                : "Eventos universitários"}
                        </span>
                    </div>
                </header>


                <div className="bp-tv-main">
                    <div className="bp-tv-text">
                        <div className="bp-tv-kicker">
                            {
                                currentItem.kicker
                            }
                        </div>

                        <h1>
                            {
                                currentItem.titulo
                            }
                        </h1>

                        {currentItem.preco_label ? (
                            <div className="bp-tv-price">
                                {
                                    currentItem.preco_label
                                }
                            </div>
                        ) : null}

                        {currentItem.descricao ? (
                            <TvDescription
                                text={
                                    currentItem.descricao
                                }
                            />
                        ) : null}

                        {currentItem.meta.length >
                        0 ? (
                            <div className="bp-tv-meta">
                                {currentItem.meta.map(
                                    (
                                        item,
                                        index,
                                    ) => (
                                        <span
                                            key={
                                                `${item}:${index}`
                                            }
                                        >
                                            {item}
                                        </span>
                                    ),
                                )}
                            </div>
                        ) : null}
                    </div>

                    {currentItem.link &&
                    qrCodeUrl ? (
                        <aside className="bp-tv-qr-card">
                            <div className="bp-tv-qr-wrapper">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        qrCodeUrl
                                    }
                                    alt={`QR Code para ${currentItem.titulo}`}
                                />
                            </div>

                            <strong>
                                Escaneie para acessar
                            </strong>

                            <span>
                                {currentItem.origem ===
                                "promocao"
                                    ? "Veja o cardápio completo"
                                    : "Ingressos e detalhes"}
                            </span>
                        </aside>
                    ) : null}
                </div>


                <footer className="bp-tv-bottom-area">
                    <div className="bp-tv-counter">
                        {String(
                            currentIndex +
                            1,
                        ).padStart(
                            2,
                            "0",
                        )}

                        <span>
                            /
                        </span>

                        {String(
                            data
                                .itens
                                .length,
                        ).padStart(
                            2,
                            "0",
                        )}
                    </div>

                    <div className="bp-tv-progress-track">
                        <div
                            className="bp-tv-progress-fill"
                            style={{
                                width:
                                    `${progress}%`,
                            }}
                        />
                    </div>

                    {refreshFailed ? (
                        <div className="bp-tv-refresh-warning">
                            Exibindo última playlist válida
                        </div>
                    ) : null}
                </footer>
            </section>
        </main>
    );
}
