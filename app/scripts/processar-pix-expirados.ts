import "dotenv/config";

import {
    cancelMercadoPagoPayment,
    getMercadoPagoPayment,
    getMercadoPagoPixData,
    MercadoPagoApiError,
} from "@/lib/fin/mercado-pago";
import { prisma } from "@/lib/prisma";
import { pedidoPublicService } from "@/lib/vnd/pedido-public-service";

const CANCELLABLE_STATUSES = new Set([
    "pending",
    "in_process",
    "authorized",
]);

async function applyPayment(
    finPagamentoId: number,
    payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>,
) {
    const pix = getMercadoPagoPixData(payment);

    await pedidoPublicService.applyMercadoPagoPayment({
        finPagamentoId,
        payment,
        qrCodeText: pix.qrCodeText,
        paymentUrl: pix.ticketUrl,
    });
}

async function processPayment(input: {
    id: number;
    external_id: string | null;
    vnd_pedido: { codigo: string };
}) {
    if (!input.external_id) return;

    const paymentId = input.external_id;
    const current = await getMercadoPagoPayment(paymentId);

    if (!CANCELLABLE_STATUSES.has(current.status ?? "")) {
        await applyPayment(input.id, current);
        console.log(
            `[pix-expirado] ${input.vnd_pedido.codigo}: status ${current.status ?? "desconhecido"} aplicado.`,
        );
        return;
    }

    try {
        const cancelled = await cancelMercadoPagoPayment(paymentId);
        await applyPayment(input.id, cancelled);

        console.log(
            `[pix-expirado] ${input.vnd_pedido.codigo}: pagamento cancelado no Mercado Pago e reserva liberada.`,
        );
    } catch (error) {
        if (!(error instanceof MercadoPagoApiError)) {
            throw error;
        }

        // O status pode ter mudado entre a consulta e o cancelamento.
        // Reconsulta e só aplica o estado efetivamente confirmado pelo Mercado Pago.
        const latest = await getMercadoPagoPayment(paymentId);
        await applyPayment(input.id, latest);

        if (CANCELLABLE_STATUSES.has(latest.status ?? "")) {
            throw error;
        }

        console.log(
            `[pix-expirado] ${input.vnd_pedido.codigo}: status mudou durante o cancelamento; estado ${latest.status ?? "desconhecido"} aplicado.`,
        );
    }
}

async function main() {
    const pagamentos =
        await pedidoPublicService.findExpiredPixPayments(100);

    if (pagamentos.length === 0) {
        console.log("[pix-expirado] Nenhuma reserva PIX vencida para processar.");
        return;
    }

    console.log(
        `[pix-expirado] Processando ${pagamentos.length} pagamento(s).`,
    );

    let processados = 0;
    let erros = 0;

    for (const pagamento of pagamentos) {
        try {
            await processPayment(pagamento);
            processados += 1;
        } catch (error) {
            erros += 1;
            console.error(
                `[pix-expirado] Falha no pedido ${pagamento.vnd_pedido.codigo}.`,
                error,
            );
        }
    }

    console.log(
        `[pix-expirado] Finalizado. Processados: ${processados}. Erros: ${erros}.`,
    );

    if (erros > 0) {
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error("[pix-expirado] Falha geral.", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
