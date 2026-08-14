"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Clipboard,
    CreditCard,
    Loader2,
    QrCode,
    RotateCcw,
    ShoppingBag,
} from "lucide-react";
import {
    initMercadoPago,
    Payment,
} from "@mercadopago/sdk-react";

import {
    usePublicCart,
} from "@/components/public/PublicCartProvider";
import {
    Button,
} from "@/components/ui/Button";

export type CheckoutInitialCustomer = {
    isAuthenticated: boolean;
    nome: string;
    email: string;
    telefone: string;
    documento: string;
};

type ValidatedItem = {
    produto_id: number;
    variacao_id: number | null;
    quantidade: number;
    disponivel: boolean;
    motivo: string | null;
    produto: {
        nome: string;
        codigo: string;
        preco_normal: number;
        preco_socio: number | null;
        preco_aplicado: number;
        socio_aplicado: boolean;
    } | null;
    variacao?: {
        id: number;
        nome: string;
    } | null;
    preco_unitario?: number;
    subtotal?: number;
    socio_aplicado?: boolean;
};

type CheckoutPaymentResult = {
    pedido_codigo: string;
    pagamento_id: string | null;
    metodo: "pix" | "cartao";
    status: string;
    status_detail: string | null;
    qr_code_text: string | null;
    qr_code_base64: string | null;
    payment_url: string | null;
};

type CheckoutSubmitError = Error & {
    resetAttempt?: boolean;
};

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
}

function customerIsValid(input: {
    nome: string;
    email: string;
    telefone: string;
}) {
    const phoneDigits = onlyDigits(input.telefone);

    return (
        input.nome.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            input.email.trim(),
        ) &&
        phoneDigits.length >= 8
    );
}

export function CheckoutClient({
    publicKey,
    initialCustomer,
}: {
    publicKey: string;
    initialCustomer: CheckoutInitialCustomer;
}) {
    const {
        hydrated,
        items,
        clearCart,
    } = usePublicCart();

    const [validated, setValidated] = useState<ValidatedItem[]>([]);
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [brickError, setBrickError] = useState<string | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [brickReady, setBrickReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] =
        useState<CheckoutPaymentResult | null>(null);
    const [paymentRenderKey, setPaymentRenderKey] = useState(0);
    const attemptIdRef = useRef<string | null>(null);

    const [customer, setCustomer] = useState({
        nome: initialCustomer.nome,
        email: initialCustomer.email,
        telefone: initialCustomer.telefone,
    });

    const [customerReady, setCustomerReady] = useState(
        initialCustomer.isAuthenticated &&
            customerIsValid({
                nome: initialCustomer.nome,
                email: initialCustomer.email,
                telefone: initialCustomer.telefone,
            }),
    );

    useEffect(() => {
        if (!publicKey) {
            setSdkReady(false);
            return;
        }

        initMercadoPago(publicKey);
        setSdkReady(true);
    }, [publicKey]);

    useEffect(() => {
        if (!hydrated || paymentResult) return;

        if (items.length === 0) {
            setValidated([]);
            setValidationError(null);
            setValidating(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                setValidating(true);
                setValidationError(null);

                const response = await fetch(
                    "/api/public/carrinho/validar",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            items: items.map((item) => ({
                                produto_id: item.produtoId,
                                variacao_id: item.variacaoId,
                                quantidade: item.quantidade,
                            })),
                        }),
                        signal: controller.signal,
                    },
                );

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(
                        result.message ||
                            "Não foi possível validar o carrinho.",
                    );
                }

                setValidated(result.data.items);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setValidationError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível validar o carrinho.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setValidating(false);
                }
            }
        }, 180);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [hydrated, items, paymentResult]);

    useEffect(() => {
        if (!paymentResult?.pagamento_id) return;

        const pendingStatuses = new Set([
            "pending",
            "in_process",
            "authorized",
        ]);

        if (!pendingStatuses.has(paymentResult.status)) return;

        let stopped = false;
        let pollCount = 0;
        let timer: number | null = null;

        const poll = async () => {
            if (stopped) return;

            pollCount += 1;

            try {
                const response = await fetch(
                    "/api/public/checkout/status",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            pedido_codigo:
                                paymentResult.pedido_codigo,
                            pagamento_id:
                                paymentResult.pagamento_id,
                        }),
                    },
                );

                const result = await response.json();

                if (response.ok && result.ok && result.data) {
                    setPaymentResult((current) =>
                        current
                            ? {
                                ...current,
                                status:
                                    result.data.status ??
                                    current.status,
                                status_detail:
                                    result.data.status_detail ??
                                    current.status_detail,
                                qr_code_text:
                                    result.data.qr_code_text ??
                                    current.qr_code_text,
                                qr_code_base64:
                                    result.data.qr_code_base64 ??
                                    current.qr_code_base64,
                                payment_url:
                                    result.data.payment_url ??
                                    current.payment_url,
                            }
                            : current,
                    );

                    if (
                        !pendingStatuses.has(
                            result.data.status,
                        )
                    ) {
                        return;
                    }
                }
            } catch (error) {
                console.error(
                    "[public.checkout.poll]",
                    error,
                );
            }

            if (!stopped && pollCount < 60) {
                timer = window.setTimeout(
                    poll,
                    5000,
                );
            }
        };

        timer = window.setTimeout(poll, 5000);

        return () => {
            stopped = true;

            if (timer !== null) {
                window.clearTimeout(timer);
            }
        };
    }, [paymentResult?.pagamento_id, paymentResult?.pedido_codigo, paymentResult?.status]);

    const total = useMemo(
        () =>
            validated.reduce(
                (sum, item) =>
                    item.disponivel
                        ? sum + (item.subtotal ?? 0)
                        : sum,
                0,
            ),
        [validated],
    );

    const hasUnavailable = validated.some(
        (item) => !item.disponivel,
    );

    const identification = useMemo(() => {
        const digits = onlyDigits(initialCustomer.documento);

        if (digits.length === 11) {
            return {
                type: "CPF",
                number: digits,
            };
        }

        if (digits.length === 14) {
            return {
                type: "CNPJ",
                number: digits,
            };
        }

        return null;
    }, [initialCustomer.documento]);

    const initialization = useMemo(
        () => ({
            amount: total,
            payer: {
                email: customer.email.trim(),
                ...(identification
                    ? { identification }
                    : {}),
            },
        }),
        [customer.email, identification, total],
    );

    const customization = useMemo(
        () => ({
            paymentMethods: {
                creditCard: "all" as const,
                bankTransfer: ["pix"],
                maxInstallments: 12,
            },
            visual: {
                style: {
                    theme: "dark" as const,
                },
            },
        }),
        [],
    );

    const onSubmit = useCallback(
        async (mercadoPagoData: unknown) => {
            if (!customerIsValid(customer)) {
                setBrickError(
                    "Confira nome, e-mail e telefone antes de pagar.",
                );
                return;
            }

            try {
                setProcessing(true);
                setBrickError(null);

                if (!attemptIdRef.current) {
                    attemptIdRef.current =
                        window.crypto.randomUUID();
                }

                const response = await fetch(
                    "/api/public/checkout/pagar",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            attempt_id: attemptIdRef.current,
                            cliente: {
                                nome: customer.nome.trim(),
                                email: customer.email.trim(),
                                telefone: customer.telefone.trim(),
                            },
                            items: items.map((item) => ({
                                produto_id: item.produtoId,
                                variacao_id: item.variacaoId,
                                quantidade: item.quantidade,
                            })),
                            mercado_pago: mercadoPagoData,
                        }),
                    },
                );

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    const submitError = new Error(
                        result.message ||
                            "Não foi possível processar o pagamento.",
                    ) as CheckoutSubmitError;

                    submitError.resetAttempt = Boolean(
                        result.data?.reset_attempt,
                    );

                    throw submitError;
                }

                const payment =
                    result.data as CheckoutPaymentResult;

                setPaymentResult(payment);

                if (
                    payment.status === "approved" ||
                    payment.status === "pending" ||
                    payment.status === "in_process" ||
                    payment.status === "authorized"
                ) {
                    clearCart();
                }
            } catch (error) {
                if (
                    error instanceof Error &&
                    (error as CheckoutSubmitError).resetAttempt
                ) {
                    attemptIdRef.current = null;
                }

                setBrickError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível processar o pagamento.",
                );
                throw error;
            } finally {
                setProcessing(false);
            }
        },
        [clearCart, customer, items],
    );

    function confirmCustomer() {
        if (!customerIsValid(customer)) {
            setBrickError(
                "Preencha nome, e-mail e telefone corretamente.",
            );
            return;
        }

        setBrickError(null);
        setCustomerReady(true);
    }

    function retryPayment() {
        attemptIdRef.current = null;
        setPaymentResult(null);
        setBrickError(null);
        setBrickReady(false);
        setPaymentRenderKey((current) => current + 1);
    }

    async function copyPix() {
        if (!paymentResult?.qr_code_text) return;

        await navigator.clipboard.writeText(
            paymentResult.qr_code_text,
        );
    }

    if (paymentResult) {
        const approved =
            paymentResult.status === "approved";
        const pending =
            paymentResult.status === "pending" ||
            paymentResult.status === "in_process" ||
            paymentResult.status === "authorized";
        const rejected =
            paymentResult.status === "rejected" ||
            paymentResult.status === "cancelled" ||
            paymentResult.status === "expired";

        return (
            <section className="bp-public-checkout-result">
                <div
                    className={`bp-public-checkout-result-icon ${
                        approved
                            ? "is-success"
                            : rejected
                                ? "is-danger"
                                : "is-pending"
                    }`}
                >
                    {paymentResult.metodo === "pix" ? (
                        <QrCode size={30} />
                    ) : (
                        <CreditCard size={30} />
                    )}
                </div>

                <span className="bp-public-kicker">
                    Pedido #{paymentResult.pedido_codigo}
                </span>

                <h1>
                    {approved
                        ? "Pagamento aprovado"
                        : rejected
                            ? "Pagamento não aprovado"
                            : "Pagamento aguardando confirmação"}
                </h1>

                {pending ? (
                    <div className="bp-public-checkout-status-refresh">
                        <Loader2 size={15} />
                        Aguardando confirmação do Mercado Pago. Esta tela se atualiza automaticamente.
                    </div>
                ) : null}

                {paymentResult.metodo === "pix" && pending ? (
                    <>
                        <p>
                            Seu pedido já foi registrado. Faça o PIX abaixo e
                            a confirmação será atualizada automaticamente.
                        </p>

                        {paymentResult.qr_code_base64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                className="bp-public-pix-qr"
                                src={`data:image/png;base64,${paymentResult.qr_code_base64}`}
                                alt="QR Code PIX"
                            />
                        ) : null}

                        {paymentResult.qr_code_text ? (
                            <div className="bp-public-pix-copy">
                                <code>
                                    {paymentResult.qr_code_text}
                                </code>
                                <Button
                                    type="button"
                                    color="secondary"
                                    variant="outline"
                                    onClick={copyPix}
                                >
                                    <Clipboard size={16} />
                                    Copiar PIX
                                </Button>
                            </div>
                        ) : null}

                        {paymentResult.payment_url ? (
                            <a
                                className="bp-public-primary-link"
                                href={paymentResult.payment_url}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                Abrir pagamento PIX
                            </a>
                        ) : null}
                    </>
                ) : approved ? (
                    <p>
                        Seu pedido foi registrado e pago. Quando os produtos
                        estiverem disponíveis, a atlética informará o dia e o
                        local da retirada.
                    </p>
                ) : rejected ? (
                    <p>
                        A cobrança não foi concluída.
                        {items.length > 0
                            ? " Seu carrinho continua disponível para tentar novamente."
                            : " Você pode voltar à loja e iniciar uma nova compra."}
                    </p>
                ) : (
                    <p>
                        O pagamento está sendo processado. O pedido já foi
                        registrado e será atualizado automaticamente.
                    </p>
                )}

                <div className="bp-public-checkout-result-actions">
                    {rejected && items.length > 0 ? (
                        <Button
                            type="button"
                            onClick={retryPayment}
                        >
                            <RotateCcw size={16} />
                            Tentar novamente
                        </Button>
                    ) : null}

                    <Link
                        href="/"
                        className="bp-public-secondary-link"
                    >
                        Voltar para a loja
                    </Link>
                </div>
            </section>
        );
    }

    if (!hydrated) {
        return (
            <div className="bp-public-cart-loading">
                <Loader2 size={24} />
                Carregando checkout...
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <section className="bp-public-cart-empty">
                <div>
                    <ShoppingBag size={30} />
                </div>
                <h1>Seu carrinho está vazio</h1>
                <p>
                    Adicione um produto antes de abrir o checkout.
                </p>
                <Link
                    href="/#produtos"
                    className="bp-public-primary-link"
                >
                    Ver produtos
                </Link>
            </section>
        );
    }

    return (
        <div className="bp-public-checkout-page">
            <header className="bp-public-checkout-head">
                <span className="bp-public-kicker">
                    Checkout
                </span>
                <h1>Finalizar compra</h1>
                <p>
                    Pagamento por PIX ou cartão de crédito. A retirada será
                    combinada pela atlética quando os produtos estiverem
                    disponíveis.
                </p>
            </header>

            {validationError ? (
                <div className="bp-public-cart-alert">
                    {validationError}
                </div>
            ) : null}

            {brickError ? (
                <div className="bp-public-cart-alert">
                    {brickError}
                </div>
            ) : null}

            <div className="bp-public-checkout-layout">
                <div className="bp-public-checkout-main">
                    <section className="bp-public-checkout-card">
                        <div className="bp-public-checkout-card-head">
                            <div>
                                <span>1</span>
                                <div>
                                    <strong>Seus dados</strong>
                                    <small>
                                        Usaremos o telefone apenas para contato
                                        sobre o pedido e retirada.
                                    </small>
                                </div>
                            </div>

                            {customerReady ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCustomerReady(false)
                                    }
                                >
                                    Alterar
                                </button>
                            ) : null}
                        </div>

                        {customerReady ? (
                            <div className="bp-public-checkout-customer-summary">
                                <strong>{customer.nome}</strong>
                                <span>{customer.email}</span>
                                <span>{customer.telefone}</span>
                            </div>
                        ) : (
                            <div className="bp-public-checkout-fields">
                                <label>
                                    <span>Nome</span>
                                    <input
                                        className="bp-input"
                                        value={customer.nome}
                                        disabled={
                                            initialCustomer.isAuthenticated
                                        }
                                        onChange={(event) =>
                                            setCustomer((current) => ({
                                                ...current,
                                                nome: event.target.value,
                                            }))
                                        }
                                        autoComplete="name"
                                    />
                                </label>

                                <label>
                                    <span>E-mail</span>
                                    <input
                                        className="bp-input"
                                        type="email"
                                        value={customer.email}
                                        disabled={
                                            initialCustomer.isAuthenticated
                                        }
                                        onChange={(event) =>
                                            setCustomer((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        autoComplete="email"
                                    />
                                </label>

                                <label>
                                    <span>Telefone</span>
                                    <input
                                        className="bp-input"
                                        value={customer.telefone}
                                        onChange={(event) =>
                                            setCustomer((current) => ({
                                                ...current,
                                                telefone: event.target.value,
                                            }))
                                        }
                                        placeholder="(47) 99999-9999"
                                        autoComplete="tel"
                                    />
                                </label>

                                <div className="bp-public-checkout-field-actions">
                                    <Button
                                        type="button"
                                        onClick={confirmCustomer}
                                    >
                                        <CheckCircle2 size={16} />
                                        Continuar para pagamento
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="bp-public-checkout-card">
                        <div className="bp-public-checkout-card-head">
                            <div>
                                <span>2</span>
                                <div>
                                    <strong>Pagamento</strong>
                                    <small>
                                        Escolha PIX ou cartão de crédito.
                                    </small>
                                </div>
                            </div>
                        </div>

                        {!customerReady ? (
                            <div className="bp-public-checkout-locked">
                                Confirme seus dados para liberar o pagamento.
                            </div>
                        ) : validating ? (
                            <div className="bp-public-checkout-locked">
                                <Loader2 size={18} />
                                Conferindo seu carrinho...
                            </div>
                        ) : hasUnavailable ? (
                            <div className="bp-public-checkout-locked is-danger">
                                Existe um item indisponível. Volte ao carrinho
                                e ajuste antes de pagar.
                            </div>
                        ) : !publicKey ? (
                            <div className="bp-public-checkout-locked is-danger">
                                A chave pública do Mercado Pago ainda não está
                                configurada.
                            </div>
                        ) : sdkReady && total > 0 ? (
                            <div className="bp-public-payment-brick">
                                {!brickReady ? (
                                    <div className="bp-public-checkout-brick-loading">
                                        <Loader2 size={18} />
                                        Carregando formas de pagamento...
                                    </div>
                                ) : null}

                                <Payment
                                    key={paymentRenderKey}
                                    initialization={initialization}
                                    customization={customization}
                                    locale="pt-BR"
                                    onReady={() => {
                                        setBrickReady(true);
                                        setBrickError(null);
                                    }}
                                    onError={(error) => {
                                        console.error(
                                            "[mercado-pago.brick]",
                                            error,
                                        );
                                        setBrickError(
                                            "Não foi possível carregar o formulário de pagamento.",
                                        );
                                    }}
                                    onSubmit={onSubmit}
                                />

                                {processing ? (
                                    <div className="bp-public-checkout-processing">
                                        <Loader2 size={18} />
                                        Processando pagamento...
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="bp-public-checkout-locked">
                                Carregando pagamento...
                            </div>
                        )}
                    </section>
                </div>

                <aside className="bp-public-checkout-summary">
                    <span>Seu pedido</span>

                    <div className="bp-public-checkout-summary-items">
                        {validated.map((item) => (
                            <div
                                key={`${item.produto_id}:${
                                    item.variacao_id ?? "none"
                                }`}
                            >
                                <div>
                                    <strong>
                                        {item.produto?.nome ?? "Produto"}
                                    </strong>
                                    <small>
                                        {item.variacao?.nome
                                            ? `${item.variacao.nome} · `
                                            : ""}
                                        {item.quantidade}x
                                    </small>
                                </div>
                                <strong>
                                    {money(item.subtotal ?? 0)}
                                </strong>
                            </div>
                        ))}
                    </div>

                    <div className="bp-public-cart-summary-total">
                        <span>Total</span>
                        <strong>{money(total)}</strong>
                    </div>

                    <div className="bp-public-checkout-withdrawal">
                        <strong>Retirada com a AAACCU</strong>
                        <span>
                            Quando os produtos estiverem prontos, a atlética
                            informará dia e local para retirada.
                        </span>
                    </div>

                    <Link
                        href="/carrinho"
                        className="bp-public-secondary-link"
                    >
                        Voltar ao carrinho
                    </Link>
                </aside>
            </div>
        </div>
    );
}
