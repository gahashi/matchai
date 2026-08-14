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

const schema = z.object({
    attempt_id: z.string().uuid(),
    items: z
        .array(
            z.object({
                produto_id: z.number().int().positive(),
                variacao_id: z.number().int().positive().nullable(),
                quantidade: z.number().int().min(1).max(99),
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

        const validatedItems =
            await produtoPublicService.validateCart(
                parsed.data.items.map((item) => ({
                    produtoId: item.produto_id,
                    variacaoId: item.variacao_id,
                    quantidade: item.quantidade,
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

        const idempotencyKey = `checkout:${parsed.data.attempt_id}`;
        const existingAttempt =
            await pedidoPublicService.getPaymentAttemptByIdempotencyKey(
                idempotencyKey,
            );

        if (
            existingAttempt &&
            existingAttempt.fin_pagamento_metodo.codigo !== method
        ) {
            await pedidoPublicService.applyMercadoPagoPayment({
                finPagamentoId: existingAttempt.id,
                payment: {
                    status: "cancelled",
                    status_detail: "payment_method_changed",
                },
                qrCodeText: null,
                paymentUrl: null,
            });

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

        const attempt = existingAttempt
            ? {
                pedido: existingAttempt.vnd_pedido,
                pagamento: {
                    id: existingAttempt.id,
                },
                total: Number(existingAttempt.vnd_pedido.valor_total),
            }
            : await pedidoPublicService.createPaymentAttempt({
                sysUsuarioId: session?.user.id ?? null,
                customer,
                items: validatedItems,
                method,
                idempotencyKey,
            });

        localPaymentId = attempt.pagamento.id;

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

        const mercadoPagoPayment =
            await createMercadoPagoPayment(
                {
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
                },
                idempotencyKey,
            );

        const pix = getMercadoPagoPixData(
            mercadoPagoPayment,
        );

        await pedidoPublicService.applyMercadoPagoPayment({
            finPagamentoId: attempt.pagamento.id,
            payment: mercadoPagoPayment,
            qrCodeText: pix.qrCodeText,
            paymentUrl: pix.ticketUrl,
        });

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

        const rejectedByMercadoPago =
            error instanceof MercadoPagoApiError &&
            error.status >= 400 &&
            error.status < 500;

        if (localPaymentId && rejectedByMercadoPago) {
            try {
                await pedidoPublicService.applyMercadoPagoPayment({
                    finPagamentoId: localPaymentId,
                    payment: {
                        status: "rejected",
                        status_detail: error.message,
                    },
                    qrCodeText: null,
                    paymentUrl: null,
                });
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
