import "dotenv/config";

import {
    cancelMercadoPagoPayment,
    findMercadoPagoPaymentByExternalReference,
    getMercadoPagoPayment,
    getMercadoPagoPixData,
    MercadoPagoApiError,
    type MercadoPagoPaymentResponse,
} from "@/lib/fin/mercado-pago";

import { prisma } from "@/lib/prisma";

import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";


const CANCELLABLE_STATUSES =
    new Set([
        "pending",
        "in_process",
        "authorized",
    ]);


async function applyPayment(
    finPagamentoId: number,
    payment: MercadoPagoPaymentResponse,
) {
    const pix =
        getMercadoPagoPixData(
            payment,
        );

    await pedidoPublicService
        .applyMercadoPagoPayment({
            finPagamentoId,

            payment,

            qrCodeText:
            pix.qrCodeText,

            paymentUrl:
            pix.ticketUrl,
        });
}


async function findRemotePayment(
    input: {
        externalId:
            string | null;

        externalReference:
            string;

        pedidoCodigo:
            string;
    },
) {
    /*
     * Caminho normal:
     * já conhecemos o ID do pagamento no Mercado Pago.
     */
    if (input.externalId) {
        return getMercadoPagoPayment(
            input.externalId,
        );
    }

    /*
     * Caminho de recuperação:
     *
     * o pedido local foi criado, mas podemos ter perdido
     * a resposta da criação do pagamento antes de salvar
     * o external_id.
     */
    return findMercadoPagoPaymentByExternalReference(
        input.externalReference ||
        input.pedidoCodigo,
    );
}


async function processPayment(
    input: {
        id:
            number;

        external_id:
            string | null;

        external_reference:
            string | null;

        fin_pagamento_metodo: {
            codigo:
                string;
        };

        vnd_pedido: {
            codigo:
                string;
        };
    },
) {
    const externalReference =
        input.external_reference ??
        input.vnd_pedido.codigo;

    const current =
        await findRemotePayment({
            externalId:
            input.external_id,

            externalReference,

            pedidoCodigo:
            input.vnd_pedido
                .codigo,
        });

    /*
     * A busca no Mercado Pago terminou corretamente,
     * mas nenhum pagamento foi encontrado.
     *
     * Nesse ponto a reserva já venceu e não existe
     * pagamento remoto conhecido para sustentá-la.
     */
    if (!current) {
        await pedidoPublicService
            .applyMercadoPagoPayment({
                finPagamentoId:
                input.id,

                payment: {
                    status:
                        "expired",

                    status_detail:
                        "payment_not_found_after_reservation_expiration",

                    external_reference:
                    externalReference,
                },

                qrCodeText:
                    null,

                paymentUrl:
                    null,
            });

        console.log(
            `[pagamento-expirado] ${input.vnd_pedido.codigo}: pagamento não encontrado no Mercado Pago; tentativa local expirada e reserva liberada.`,
        );

        return;
    }

    /*
     * Se recuperamos um pagamento que antes estava sem
     * external_id, applyMercadoPagoPayment também passa
     * a persistir esse ID localmente.
     */
    const remotePaymentId =
        current.id !== undefined
            ? String(
                current.id,
            )
            : input.external_id;

    /*
     * Já mudou para approved, rejected, cancelled,
     * expired, refunded etc.
     *
     * Não tentamos cancelar: simplesmente sincronizamos
     * o estado verdadeiro.
     */
    if (
        !CANCELLABLE_STATUSES.has(
            current.status ?? "",
        )
    ) {
        await applyPayment(
            input.id,
            current,
        );

        console.log(
            `[pagamento-expirado] ${input.vnd_pedido.codigo}: estado ${current.status ?? "desconhecido"} encontrado no Mercado Pago e sincronizado.`,
        );

        return;
    }

    if (!remotePaymentId) {
        throw new Error(
            `Pagamento ${input.vnd_pedido.codigo} foi localizado sem ID externo.`,
        );
    }

    /*
     * A reserva venceu, mas o pagamento continua em
     * estado não definitivo.
     *
     * Primeiro confirmamos o cancelamento no MP.
     * Só depois a aplicação libera a reserva.
     */
    try {
        const cancelled =
            await cancelMercadoPagoPayment(
                remotePaymentId,
            );

        await applyPayment(
            input.id,
            cancelled,
        );

        console.log(
            `[pagamento-expirado] ${input.vnd_pedido.codigo}: pagamento ${input.fin_pagamento_metodo.codigo} cancelado no Mercado Pago e reserva liberada.`,
        );
    } catch (error) {
        if (
            !(
                error instanceof
                MercadoPagoApiError
            )
        ) {
            throw error;
        }

        /*
         * Entre GET e PUT o pagamento pode ter mudado.
         *
         * Nunca liberamos estoque apenas porque o
         * cancelamento falhou.
         */
        const latest =
            await getMercadoPagoPayment(
                remotePaymentId,
            );

        await applyPayment(
            input.id,
            latest,
        );

        if (
            CANCELLABLE_STATUSES.has(
                latest.status ?? "",
            )
        ) {
            /*
             * Ainda continua pendente e não conseguimos
             * confirmar o cancelamento.
             *
             * Mantemos a reserva bloqueada por segurança.
             */
            throw error;
        }

        console.log(
            `[pagamento-expirado] ${input.vnd_pedido.codigo}: estado mudou durante o cancelamento; ${latest.status ?? "desconhecido"} foi sincronizado.`,
        );
    }
}


async function main() {
    const pagamentos =
        await pedidoPublicService
            .findExpiredPaymentReservations(
                100,
            );

    if (
        pagamentos.length === 0
    ) {
        console.log(
            "[pagamento-expirado] Nenhuma reserva de pagamento vencida para processar.",
        );

        return;
    }

    console.log(
        `[pagamento-expirado] Processando ${pagamentos.length} pagamento(s).`,
    );

    let processados = 0;
    let erros = 0;

    for (
        const pagamento
        of pagamentos
        ) {
        try {
            await processPayment(
                pagamento,
            );

            processados += 1;
        } catch (error) {
            erros += 1;

            console.error(
                `[pagamento-expirado] Falha no pedido ${pagamento.vnd_pedido.codigo}.`,
                error,
            );
        }
    }

    console.log(
        `[pagamento-expirado] Finalizado. Processados: ${processados}. Erros: ${erros}.`,
    );

    if (erros > 0) {
        process.exitCode = 1;
    }
}


main()
    .catch((error) => {
        console.error(
            "[pagamento-expirado] Falha geral.",
            error,
        );

        process.exitCode = 1;
    })
    .finally(
        async () => {
            await prisma.$disconnect();
        },
    );