export type MercadoPagoPaymentStatus =
    | "approved"
    | "authorized"
    | "in_process"
    | "pending"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";

export type MercadoPagoPaymentResponse = {
    id?: number | string;
    status?: MercadoPagoPaymentStatus | string;
    status_detail?: string | null;
    payment_method_id?: string | null;
    payment_type_id?: string | null;
    external_reference?: string | null;
    transaction_amount?: number | null;
    transaction_details?: {
        net_received_amount?: number | null;
        total_paid_amount?: number | null;
    } | null;
    point_of_interaction?: {
        transaction_data?: {
            qr_code?: string | null;
            qr_code_base64?: string | null;
            ticket_url?: string | null;
        } | null;
    } | null;
};


export class MercadoPagoApiError extends Error {
    status: number;
    payload: Record<string, unknown>;

    constructor(
        message: string,
        status: number,
        payload: Record<string, unknown>,
    ) {
        super(message);
        this.name = "MercadoPagoApiError";
        this.status = status;
        this.payload = payload;
    }
}

export type MercadoPagoPaymentCreateInput = {
    transaction_amount: number;
    description: string;
    payment_method_id: string;
    external_reference: string;
    token?: string;
    installments?: number;
    issuer_id?: string | number;
    payer: {
        email: string;
        first_name?: string;
        last_name?: string;
        identification?: {
            type: string;
            number: string;
        };
    };
    additional_info?: {
        items?: Array<{
            id?: string;
            title: string;
            description?: string;
            quantity: number;
            unit_price: number;
        }>;
    };
};

function getAccessToken() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();

    if (!accessToken) {
        throw new Error(
            "MERCADO_PAGO_ACCESS_TOKEN não está configurado.",
        );
    }

    return accessToken;
}

async function parseMercadoPagoResponse(response: Response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        return {
            message: text,
        };
    }
}

export async function createMercadoPagoPayment(
    input: MercadoPagoPaymentCreateInput,
    idempotencyKey: string,
): Promise<MercadoPagoPaymentResponse> {
    const response = await fetch(
        "https://api.mercadopago.com/v1/payments",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAccessToken()}`,
                "X-Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(input),
            cache: "no-store",
        },
    );

    const data = await parseMercadoPagoResponse(response);

    if (!response.ok) {
        const message =
            typeof data.message === "string"
                ? data.message
                : "O Mercado Pago recusou a criação do pagamento.";

        throw new MercadoPagoApiError(
            message,
            response.status,
            data,
        );
    }

    return data as MercadoPagoPaymentResponse;
}

export async function getMercadoPagoPayment(
    paymentId: string,
): Promise<MercadoPagoPaymentResponse> {
    const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(
            paymentId,
        )}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getAccessToken()}`,
            },
            cache: "no-store",
        },
    );

    const data = await parseMercadoPagoResponse(response);

    if (!response.ok) {
        const message =
            typeof data.message === "string"
                ? data.message
                : "Não foi possível consultar o pagamento no Mercado Pago.";

        throw new MercadoPagoApiError(
            message,
            response.status,
            data,
        );
    }

    return data as MercadoPagoPaymentResponse;
}

export function getMercadoPagoPixData(
    payment: MercadoPagoPaymentResponse,
) {
    const transactionData =
        payment.point_of_interaction?.transaction_data ?? null;

    return {
        qrCodeText: transactionData?.qr_code ?? null,
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        ticketUrl: transactionData?.ticket_url ?? null,
    };
}
