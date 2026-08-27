import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth/session";
import {
    createMercadoPagoPayment,
    getMercadoPagoPixData,
    MercadoPagoApiError,
} from "@/lib/fin/mercado-pago";
import { produtoPublicService } from "@/lib/prd/produto-public-service";
import { socioPublicService } from "@/lib/soc/socio-public-service";
import {
    pedidoPublicService,
    type CheckoutPaymentMethod,
    type CheckoutValidatedItem,
} from "@/lib/vnd/pedido-public-service";

const campoSchema = z.object({
    campo_id: z.number().int().positive(),
    valor: z.string().max(255),
});

const componenteSchema = z.object({
    componente_id: z.number().int().positive(),
    variacao_id: z.number().int().positive().nullable(),
    campos: z.array(campoSchema).max(20).default([]),
});

const schema = z.object({
    attempt_id: z.string().uuid(),
    items: z
        .array(
            z.object({
                line_key: z.string().min(1).max(2000),
                produto_id: z.number().int().positive(),
                variacao_id: z.number().int().positive().nullable(),
                quantidade: z.number().int().min(1).max(99),
                campos: z.array(campoSchema).max(20).default([]),
                componentes: z
                    .array(componenteSchema)
                    .max(30)
                    .default([]),
            }),
        )
        .min(1)
        .max(50),
    cliente: z.object({
        nome: z.string().trim().min(2).max(150),
        email: z.string().trim().email().max(180),
        telefone: z.string().trim().min(8).max(30),
    }),
    mercado_pago: z.unknown(),
});

type MercadoPagoBrickPayload = {
    selectedPaymentMethod?: unknown;
    formData?: {
        payment_method_id?: unknown;
        token?: unknown;
        installments?: unknown;
        issuer_id?: unknown;
        payer?: {
            email?: unknown;
            identification?: {
                type?: unknown;
                number?: unknown;
            } | null;
        } | null;
    } | null;
};

function nonEmptyString(value: unknown) {
    return typeof value === "string" && value.trim()
        ? value.trim()
        : null;
}

function optionalPositiveInteger(value: unknown) {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : null;
}

function optionalStringOrNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    return nonEmptyString(value);
}

function splitName(fullName: string) {
    const parts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return {
        firstName: parts[0] ?? fullName,
        lastName: parts.slice(1).join(" ") || undefined,
    };
}

function localStatusToClient(status: string) {
    switch (status) {
        case "aprovado":
            return "approved";
        case "recusado":
            return "rejected";
        case "cancelado":
            return "cancelled";
        case "expirado":
            return "expired";
        case "estornado":
            return "refunded";
        default:
            return "pending";
    }
}

function isPrismaUniqueConstraintError(
    error: unknown,
) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code ===
        "P2002"
    );
}

function isDatabaseDeadlockError(
    error: unknown,
) {
    const message =
        error instanceof Error
            ? error.message
            : "";

    if (
        message.includes(
            "Deadlock found when trying to get lock",
        ) ||
        message.includes("1213")
    ) {
        return true;
    }

    if (
        typeof error !== "object" ||
        error === null ||
        !("meta" in error)
    ) {
        return false;
    }

    const meta =
        (error as { meta?: unknown }).meta;

    if (
        typeof meta !== "object" ||
        meta === null ||
        !("code" in meta)
    ) {
        return false;
    }

    return String(
        (meta as { code?: unknown }).code,
    ) === "1213";
}

function isMercadoPagoIdempotencyConflict(
    error: unknown,
) {
    if (!(error instanceof MercadoPagoApiError)) {
        return false;
    }

    const message = error.message.toLowerCase();

    return (
        error.status === 423 ||
        message.includes(
            "already posted the same request in the last minute",
        ) ||
        message.includes("resource is locked")
    );
}

function waitForRetry(
    milliseconds: number,
) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function withDeadlockRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
) {
    let lastError: unknown = null;

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
    ) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (
                !isDatabaseDeadlockError(error) ||
                attempt === maxAttempts
            ) {
                throw error;
            }

            await waitForRetry(attempt * 75);
        }
    }

    throw lastError;
}

export async function POST(request: NextRequest) {
    let localPaymentId: number | null = null;

    try {
        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        parsed.error.issues[0]?.message ??
                        "Dados de checkout inválidos.",
                },
                { status: 400 },
            );
        }

        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Mercado Pago ainda não está configurado no servidor.",
                },
                { status: 503 },
            );
        }

        const mercadoPagoPayload =
            parsed.data.mercado_pago as MercadoPagoBrickPayload;
        const formData = mercadoPagoPayload?.formData;
        const selectedPaymentMethod = nonEmptyString(
            mercadoPagoPayload?.selectedPaymentMethod,
        );
        const paymentMethodId = nonEmptyString(
            formData?.payment_method_id,
        );

        if (!paymentMethodId) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Selecione uma forma de pagamento válida.",
                },
                { status: 400 },
            );
        }

        if (
            !selectedPaymentMethod ||
            (selectedPaymentMethod !== "credit_card" &&
                selectedPaymentMethod !== "bank_transfer")
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Use PIX ou cartão de crédito para concluir a compra.",
                },
                { status: 400 },
            );
        }

        const method: CheckoutPaymentMethod =
            paymentMethodId === "pix" ||
            selectedPaymentMethod === "bank_transfer"
                ? "pix"
                : "cartao";

        if (method === "pix" && paymentMethodId !== "pix") {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Forma de pagamento PIX inválida.",
                },
                { status: 400 },
            );
        }

        const token = nonEmptyString(formData?.token);
        const installments = optionalPositiveInteger(
            formData?.installments,
        );
        const issuerId = optionalStringOrNumber(
            formData?.issuer_id,
        );

        if (method === "cartao" && !token) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Os dados do cartão não foram tokenizados corretamente.",
                },
                { status: 400 },
            );
        }

        const session = await getAuthSession({
            headers: request.headers,
        });

        const [socio, authenticatedCustomer] = await Promise.all([
            session
                ? socioPublicService.getSocioAtual(session.user.id)
                : Promise.resolve({
                    isSocio: false as const,
                    socio: null,
                }),
            session
                ? pedidoPublicService.getCheckoutCustomer(
                    session.user.id,
                )
                : Promise.resolve(null),
        ]);

        if (session && !authenticatedCustomer) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Não foi possível localizar sua conta.",
                },
                { status: 401 },
            );
        }

        const customer = authenticatedCustomer
            ? {
                nome: authenticatedCustomer.nome,
                email: authenticatedCustomer.email,
                telefone:
                    authenticatedCustomer.telefone?.trim() ||
                    parsed.data.cliente.telefone,
            }
            : parsed.data.cliente;

        if (!customer.telefone.trim()) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Informe um telefone para contato sobre a retirada.",
                },
                { status: 400 },
            );
        }

        const idempotencyKey = `checkout:${parsed.data.attempt_id}`;
        let existingAttempt =
            await pedidoPublicService.getPaymentAttemptByIdempotencyKey(
                idempotencyKey,
            );

        if (
            existingAttempt &&
            existingAttempt.fin_pagamento_metodo.codigo !== method
        ) {
            await withDeadlockRetry(() =>
                pedidoPublicService.applyMercadoPagoPayment({
                    finPagamentoId: existingAttempt!.id,
                    payment: {
                        status: "cancelled",
                        status_detail: "payment_method_changed",
                    },
                    qrCodeText: null,
                    paymentUrl: null,
                }),
            );

            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "A forma de pagamento mudou. Envie novamente para iniciar uma nova tentativa.",
                    data: {
                        reset_attempt: true,
                    },
                },
                { status: 409 },
            );
        }

        if (existingAttempt?.external_id) {
            return NextResponse.json({
                ok: true,
                data: {
                    pedido_codigo:
                    existingAttempt.vnd_pedido.codigo,
                    pagamento_id:
                    existingAttempt.external_id,
                    metodo:
                    existingAttempt.fin_pagamento_metodo.codigo,
                    status: localStatusToClient(
                        existingAttempt.fin_pagamento_status.codigo,
                    ),
                    status_detail: null,
                    qr_code_text:
                    existingAttempt.qr_code_text,
                    qr_code_base64: null,
                    payment_url:
                    existingAttempt.payment_url,
                },
            });
        }

        let validatedItems: CheckoutValidatedItem[] = [];

        /*
         * Uma tentativa já criada possui a própria reserva de estoque.
         * Revalidar o carrinho aqui faria a repetição idempotente
         * enxergar a própria reserva como estoque indisponível.
         *
         * Por isso a validação de estoque só acontece quando ainda
         * precisamos criar uma nova tentativa local.
         */
        if (!existingAttempt) {
            validatedItems =
                await produtoPublicService.validateCart(
                    parsed.data.items.map((item) => ({
                        lineKey: item.line_key,
                        produtoId: item.produto_id,
                        variacaoId: item.variacao_id,
                        quantidade: item.quantidade,
                        campos: item.campos.map((campo) => ({
                            campoId: campo.campo_id,
                            valor: campo.valor,
                        })),
                        componentes: item.componentes.map(
                            (componente) => ({
                                componenteId:
                                componente.componente_id,
                                variacaoId:
                                componente.variacao_id,
                                campos: componente.campos.map(
                                    (campo) => ({
                                        campoId:
                                        campo.campo_id,
                                        valor: campo.valor,
                                    }),
                                ),
                            }),
                        ),
                    })),
                    {
                        isSocio: socio.isSocio,
                    },
                ) as CheckoutValidatedItem[];

            const unavailable = validatedItems.find(
                (item) => !item.disponivel,
            );

            if (unavailable) {
                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            unavailable.motivo ??
                            "Um item do carrinho não está mais disponível.",
                    },
                    { status: 409 },
                );
            }
        }

        let attempt;

        if (existingAttempt) {
            attempt = {
                pedido:
                existingAttempt.vnd_pedido,

                pagamento: {
                    id:
                    existingAttempt.id,
                },

                total:
                    Number(
                        existingAttempt
                            .vnd_pedido
                            .valor_total,
                    ),
            };
        } else {
            let createError: unknown = null;

            for (
                let createAttempt = 1;
                createAttempt <= 3;
                createAttempt += 1
            ) {
                try {
                    attempt =
                        await pedidoPublicService.createPaymentAttempt({
                            sysUsuarioId:
                                session?.user.id ??
                                null,

                            customer,

                            items:
                            validatedItems,

                            method,

                            idempotencyKey,
                        });

                    break;
                } catch (error) {
                    createError = error;

                    const uniqueConstraint =
                        isPrismaUniqueConstraintError(error);

                    const deadlock =
                        isDatabaseDeadlockError(error);

                    if (
                        !uniqueConstraint &&
                        !deadlock
                    ) {
                        throw error;
                    }

                    /*
                     * Em concorrência, a outra requisição pode ter
                     * vencido a criação da tentativa. Damos tempo
                     * para o COMMIT e buscamos pela chave idempotente.
                     */
                    await waitForRetry(
                        createAttempt * 100,
                    );

                    existingAttempt =
                        await pedidoPublicService
                            .getPaymentAttemptByIdempotencyKey(
                                idempotencyKey,
                            );

                    if (existingAttempt) {
                        break;
                    }

                    /*
                     * P2002 sem uma tentativa com esta chave pode vir
                     * de outra constraint unique, como código do pedido.
                     */
                    if (uniqueConstraint) {
                        throw error;
                    }

                    if (createAttempt === 3) {
                        throw error;
                    }
                }
            }

            if (!attempt && !existingAttempt) {
                throw createError ??
                new Error(
                    "Não foi possível criar a tentativa de pagamento.",
                );
            }

            if (!attempt && existingAttempt) {
                if (
                    existingAttempt
                        .fin_pagamento_metodo
                        .codigo !== method
                ) {
                    await withDeadlockRetry(() =>
                        pedidoPublicService
                            .applyMercadoPagoPayment({
                                finPagamentoId:
                                existingAttempt!.id,

                                payment: {
                                    status: "cancelled",
                                    status_detail:
                                        "payment_method_changed",
                                },

                                qrCodeText: null,
                                paymentUrl: null,
                            }),
                    );

                    return NextResponse.json(
                        {
                            ok: false,
                            message:
                                "A forma de pagamento mudou. Envie novamente para iniciar uma nova tentativa.",
                            data: {
                                reset_attempt: true,
                            },
                        },
                        { status: 409 },
                    );
                }

                if (existingAttempt.external_id) {
                    return NextResponse.json({
                        ok: true,
                        data: {
                            pedido_codigo:
                            existingAttempt
                                .vnd_pedido
                                .codigo,
                            pagamento_id:
                            existingAttempt
                                .external_id,
                            metodo:
                            existingAttempt
                                .fin_pagamento_metodo
                                .codigo,
                            status:
                                localStatusToClient(
                                    existingAttempt
                                        .fin_pagamento_status
                                        .codigo,
                                ),
                            status_detail: null,
                            qr_code_text:
                            existingAttempt
                                .qr_code_text,
                            qr_code_base64: null,
                            payment_url:
                            existingAttempt
                                .payment_url,
                        },
                    });
                }

                attempt = {
                    pedido:
                    existingAttempt.vnd_pedido,
                    pagamento: {
                        id: existingAttempt.id,
                    },
                    total: Number(
                        existingAttempt
                            .vnd_pedido
                            .valor_total,
                    ),
                };
            }
        }

        if (!attempt) {
            throw new Error(
                "Não foi possível recuperar a tentativa de pagamento.",
            );
        }

        localPaymentId =
            attempt.pagamento.id;

        const payerIdentification =
            formData?.payer?.identification;
        const identificationType = nonEmptyString(
            payerIdentification?.type,
        );
        const identificationNumber = nonEmptyString(
            payerIdentification?.number,
        );
        const { firstName, lastName } = splitName(
            customer.nome,
        );

        const mercadoPagoRequest = {
            transaction_amount: attempt.total,
            description: `Pedido ${attempt.pedido.codigo} - AAACCU`,
            payment_method_id: paymentMethodId,
            external_reference: attempt.pedido.codigo,
            ...(token ? { token } : {}),
            ...(installments
                ? { installments }
                : {}),
            ...(issuerId
                ? { issuer_id: issuerId }
                : {}),
            payer: {
                email: customer.email,
                first_name: firstName,
                ...(lastName
                    ? { last_name: lastName }
                    : {}),
                ...(identificationType && identificationNumber
                    ? {
                        identification: {
                            type: identificationType,
                            number: identificationNumber,
                        },
                    }
                    : {}),
            },
            ...(validatedItems.length > 0
                ? {
                    additional_info: {
                        items: validatedItems.map((item) => ({
                            id: String(item.produto_id),
                            title:
                                item.produto?.nome ??
                                "Produto AAACCU",
                            description:
                                item.variacao?.nome ??
                                undefined,
                            quantity: item.quantidade,
                            unit_price:
                                item.preco_unitario ??
                                item.produto?.preco_aplicado ??
                                0,
                        })),
                    },
                }
                : {}),
        };

        let mercadoPagoPayment;

        for (let mpAttempt = 1; mpAttempt <= 4; mpAttempt += 1) {
            try {
                mercadoPagoPayment =
                    await createMercadoPagoPayment(
                        mercadoPagoRequest,
                        idempotencyKey,
                    );

                break;
            } catch (error) {
                if (!isMercadoPagoIdempotencyConflict(error)) {
                    throw error;
                }

                /*
                 * Outra requisição com a mesma chave pode estar criando
                 * exatamente este pagamento no Mercado Pago. Esperamos
                 * a vencedora salvar o external_id antes de tentar de novo.
                 */
                for (let recoveryAttempt = 1; recoveryAttempt <= 5; recoveryAttempt += 1) {
                    await waitForRetry(recoveryAttempt * 100);

                    const recoveredAttempt =
                        await pedidoPublicService
                            .getPaymentAttemptByIdempotencyKey(
                                idempotencyKey,
                            );

                    if (recoveredAttempt?.external_id) {
                        return NextResponse.json({
                            ok: true,
                            data: {
                                pedido_codigo:
                                recoveredAttempt.vnd_pedido.codigo,
                                pagamento_id:
                                recoveredAttempt.external_id,
                                metodo:
                                recoveredAttempt.fin_pagamento_metodo.codigo,
                                status:
                                    localStatusToClient(
                                        recoveredAttempt
                                            .fin_pagamento_status
                                            .codigo,
                                    ),
                                status_detail: null,
                                qr_code_text:
                                recoveredAttempt.qr_code_text,
                                qr_code_base64: null,
                                payment_url:
                                recoveredAttempt.payment_url,
                            },
                        });
                    }
                }

                if (mpAttempt === 4) {
                    return NextResponse.json(
                        {
                            ok: false,
                            message:
                                "O pagamento ainda está sendo processado. Tente novamente em instantes.",
                            data: {
                                reset_attempt: false,
                            },
                        },
                        { status: 503 },
                    );
                }

                await waitForRetry(mpAttempt * 250);
            }
        }

        if (!mercadoPagoPayment) {
            throw new Error(
                "Não foi possível recuperar o pagamento do Mercado Pago.",
            );
        }

        const pix = getMercadoPagoPixData(
            mercadoPagoPayment,
        );

        await withDeadlockRetry(() =>
            pedidoPublicService.applyMercadoPagoPayment({
                finPagamentoId: attempt.pagamento.id,
                payment: mercadoPagoPayment,
                qrCodeText: pix.qrCodeText,
                paymentUrl: pix.ticketUrl,
            }),
        );

        return NextResponse.json({
            ok: true,
            data: {
                pedido_codigo: attempt.pedido.codigo,
                pagamento_id:
                    mercadoPagoPayment.id !== undefined
                        ? String(mercadoPagoPayment.id)
                        : null,
                metodo: method,
                status:
                    mercadoPagoPayment.status ??
                    "pending",
                status_detail:
                    mercadoPagoPayment.status_detail ??
                    null,
                qr_code_text: pix.qrCodeText,
                qr_code_base64: pix.qrCodeBase64,
                payment_url: pix.ticketUrl,
            },
        });
    } catch (error) {
        console.error("[public.checkout.pay]", error);

        const idempotencyConflict =
            isMercadoPagoIdempotencyConflict(error);

        const rejectedByMercadoPago =
            error instanceof MercadoPagoApiError &&
            error.status >= 400 &&
            error.status < 500 &&
            !idempotencyConflict;

        if (localPaymentId && rejectedByMercadoPago) {
            try {
                await withDeadlockRetry(() =>
                    pedidoPublicService.applyMercadoPagoPayment({
                        finPagamentoId: localPaymentId!,
                        payment: {
                            status: "rejected",
                            status_detail: error.message,
                        },
                        qrCodeText: null,
                        paymentUrl: null,
                    }),
                );
            } catch (statusError) {
                console.error(
                    "[public.checkout.pay.status]",
                    statusError,
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível processar o pagamento.",
                data: {
                    reset_attempt: rejectedByMercadoPago,
                },
            },
            {
                status: rejectedByMercadoPago
                    ? 400
                    : 502,
            },
        );
    }
}
