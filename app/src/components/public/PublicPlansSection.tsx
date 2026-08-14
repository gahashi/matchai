"use client";

import { useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Clock3,
    ImageOff,
    LogIn,
    Sparkles,
    WalletCards,
} from "lucide-react";

import {
    MarkdownContent,
} from "@/components/content/MarkdownContent";
import {
    Modal,
} from "@/components/ui/Modal";
import type {
    PublicPlanoSocio,
} from "@/lib/soc/plano-public-types";

type MembershipState = {
    isAuthenticated: boolean;
    isSocio: boolean;
    planoId: number | null;
    planoNome: string | null;
    fimAt: string | null;
};

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function formatDuration(days: number) {
    if (days % 365 === 0) {
        const years = days / 365;
        return years === 1
            ? "1 ano"
            : `${years} anos`;
    }

    if (days % 30 === 0) {
        const months = days / 30;
        return months === 1
            ? "1 mês"
            : `${months} meses`;
    }

    return days === 1
        ? "1 dia"
        : `${days} dias`;
}

function formatDate(value: string | null) {
    if (!value) return null;

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
    }).format(new Date(value));
}

export function PublicPlansSection({
    planos,
    membership,
}: {
    planos: PublicPlanoSocio[];
    membership: MembershipState;
}) {
    const [selected, setSelected] =
        useState<PublicPlanoSocio | null>(null);

    if (
        planos.length === 0 &&
        !membership.isSocio
    ) {
        return null;
    }

    const activeUntil =
        formatDate(membership.fimAt);

    return (
        <section
            id="planos-socio"
            className="bp-public-section bp-public-plans-section"
        >
            <div className="bp-public-container">
                <div className="bp-public-section-head">
                    <div>
                        <span className="bp-public-kicker">
                            Associação
                        </span>

                        <h2>
                            Seja sócio da Computaria
                        </h2>

                        <p>
                            Fortaleça a atlética e tenha acesso às condições e benefícios vinculados à sua associação.
                        </p>
                    </div>
                </div>

                {membership.isSocio ? (
                    <div className="bp-public-active-membership">
                        <div className="bp-public-active-membership-icon">
                            <CheckCircle2 size={21} />
                        </div>

                        <div>
                            <span>
                                Sua associação está ativa
                            </span>

                            <strong>
                                {membership.planoNome ??
                                    "Sócio AAACCU"}
                            </strong>

                            {activeUntil ? (
                                <small>
                                    Válida até{" "}
                                    {activeUntil}
                                </small>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {planos.length > 0 ? (
                    <div className="bp-public-plan-grid">
                        {planos.map((plano) => {
                            const isCurrent =
                                membership.isSocio &&
                                membership.planoId ===
                                    plano.id;

                            return (
                                <button
                                    key={plano.id}
                                    type="button"
                                    className="bp-public-plan-card"
                                    onClick={() =>
                                        setSelected(plano)
                                    }
                                >
                                    <div className="bp-public-plan-media">
                                        {plano.imagem_publica_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={
                                                    plano.imagem_publica_url
                                                }
                                                alt=""
                                            />
                                        ) : (
                                            <WalletCards
                                                size={38}
                                            />
                                        )}

                                        {isCurrent ? (
                                            <span className="bp-public-plan-current">
                                                Seu plano
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="bp-public-plan-card-body">
                                        <span>
                                            Plano de sócio
                                        </span>

                                        <strong>
                                            {plano.nome}
                                        </strong>

                                        <div className="bp-public-plan-duration">
                                            <Clock3 size={14} />
                                            {formatDuration(
                                                plano.duracao_dias,
                                            )}
                                        </div>

                                        <div className="bp-public-plan-price">
                                            {plano.produto
                                                ? money(
                                                    plano.produto
                                                        .preco_normal,
                                                )
                                                : "Consulte a atlética"}
                                        </div>

                                        <small>
                                            Ver detalhes
                                        </small>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <Modal
                open={Boolean(selected)}
                size="xl"
                title={selected?.nome ?? "Plano de sócio"}
                description="Conheça os detalhes da associação."
                onCloseAction={() =>
                    setSelected(null)
                }
            >
                {selected ? (
                    <div className="bp-public-plan-detail">
                        <div className="bp-public-plan-detail-media">
                            {selected.imagem_publica_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        selected.imagem_publica_url
                                    }
                                    alt=""
                                />
                            ) : (
                                <div className="bp-public-plan-detail-empty">
                                    <ImageOff size={38} />
                                </div>
                            )}
                        </div>

                        <div className="bp-public-plan-detail-content">
                            <span className="bp-public-plan-detail-eyebrow">
                                Seja sócio
                            </span>

                            <h2>
                                {selected.nome}
                            </h2>

                            <div className="bp-public-plan-detail-price">
                                {selected.produto
                                    ? money(
                                        selected.produto
                                            .preco_normal,
                                    )
                                    : "Consulte a atlética"}
                            </div>

                            <div className="bp-public-plan-detail-duration">
                                <WalletCards size={17} />
                                {formatDuration(
                                    selected.duracao_dias,
                                )}{" "}
                                de associação
                            </div>

                            {selected.descricao ? (
                                <MarkdownContent>
                                    {selected.descricao}
                                </MarkdownContent>
                            ) : (
                                <p className="bp-public-plan-muted">
                                    Sem descrição informada.
                                </p>
                            )}

                            {membership.isSocio &&
                            membership.planoId ===
                                selected.id ? (
                                <div className="bp-public-plan-state is-active">
                                    <CheckCircle2 size={17} />
                                    Você já possui este plano ativo
                                    {activeUntil
                                        ? ` até ${activeUntil}.`
                                        : "."}
                                </div>
                            ) : !membership.isAuthenticated ? (
                                <Link
                                    href="/login?callbackUrl=/%23planos-socio"
                                    className="bp-public-primary-link bp-public-plan-login-link"
                                >
                                    <LogIn size={17} />
                                    Entrar para se associar
                                </Link>
                            ) : selected.disponivel_compra ? (
                                <div className="bp-public-plan-state">
                                    <Sparkles size={17} />
                                    Plano disponível para associação.
                                </div>
                            ) : (
                                <div className="bp-public-plan-state is-muted">
                                    Este plano não está disponível para compra online no momento.
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>
        </section>
    );
}
