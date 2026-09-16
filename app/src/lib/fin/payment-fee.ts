export type PaymentFeeMethod = "pix" | "cartao";

export const PAYMENT_FEE_RATES: Record<
    PaymentFeeMethod,
    number
> = {
    pix: 0.0099,
    cartao: 0.0498,
};

function roundMoney(value: number) {
    return Math.round(
        (value + Number.EPSILON) * 100,
    ) / 100;
}

export function calculatePaymentFee(
    subtotal: number,
    method: PaymentFeeMethod,
) {
    const normalizedSubtotal =
        roundMoney(subtotal);

    if (normalizedSubtotal <= 0) {
        return {
            subtotal: normalizedSubtotal,
            feeRate: 0,
            feePercent: 0,
            feeAmount: 0,
            total: normalizedSubtotal,
        };
    }

    const feeRate =
        PAYMENT_FEE_RATES[method];

    /*
     * Gross-up.
     *
     * O valor final precisa cobrir também a taxa
     * que o Mercado Pago descontará.
     *
     * Exemplo:
     * produtos = 100
     * taxa = 4,98%
     *
     * 100 / (1 - 0,0498) = 105,24
     */
    const total =
        roundMoney(
            normalizedSubtotal /
            (1 - feeRate),
        );

    const feeAmount =
        roundMoney(
            total -
            normalizedSubtotal,
        );

    return {
        subtotal: normalizedSubtotal,
        feeRate,
        feePercent:
            roundMoney(feeRate * 100),
        feeAmount,
        total,
    };
}