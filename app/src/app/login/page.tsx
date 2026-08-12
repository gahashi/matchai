"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FormEvent,
    Suspense,
    useMemo,
    useState,
} from "react";
import {
    LockKeyhole,
    ShoppingBag,
    TicketCheck,
    Users,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type ResolveLoginResponse = {
    ok: boolean;
    email?: string;
    message?: string;
};

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [identificador, setIdentificador] =
        useState("");

    const [senha, setSenha] =
        useState("");

    const [erro, setErro] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    const redirectTo = useMemo(() => {
        const callbackUrl =
            searchParams.get("callbackUrl");

        if (!callbackUrl) {
            return "/";
        }

        if (
            !callbackUrl.startsWith("/") ||
            callbackUrl.startsWith("//")
        ) {
            return "/";
        }

        return callbackUrl;
    }, [searchParams]);

    async function resolverEmailLogin() {
        const response = await fetch(
            "/api/auth/resolve-login",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    identificador,
                }),
            },
        );

        const data =
            (await response.json()) as ResolveLoginResponse;

        if (
            !response.ok ||
            !data.ok ||
            !data.email
        ) {
            throw new Error(
                data.message ||
                "Email ou senha inválidos.",
            );
        }

        return data.email;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErro("");
        setCarregando(true);

        try {
            const email =
                await resolverEmailLogin();

            const { error } =
                await authClient.signIn.email({
                    email,
                    password: senha,
                    callbackURL: redirectTo,
                });

            if (error) {
                setErro(
                    "Email ou senha inválidos.",
                );

                setCarregando(false);

                return;
            }

            router.replace(redirectTo);
            router.refresh();
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Email ou senha inválidos.",
            );

            setCarregando(false);
        }
    }

    return (
        <main
            style={{
                minHeight: "100vh",

                background:
                    "radial-gradient(circle at top left, rgba(156, 217, 26, 0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(41, 115, 7, 0.10), transparent 38%), var(--color-background)",

                color: "var(--color-text)",

                display: "grid",
                placeItems: "center",

                padding: 24,
            }}
        >
            <section
                className="bp-login-shell"
                style={{
                    width: "100%",
                    maxWidth: 1120,

                    display: "grid",

                    gridTemplateColumns:
                        "minmax(0, 1.05fr) minmax(380px, 0.95fr)",

                    gap: 24,

                    alignItems: "stretch",
                }}
            >
                {/* LADO INSTITUCIONAL */}

                <Card
                    className="bp-login-brand-card"
                    style={{
                        overflow: "hidden",

                        minHeight: 620,

                        display: "flex",
                        flexDirection: "column",

                        justifyContent:
                            "space-between",

                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,

                            background:
                                "linear-gradient(135deg, rgba(156, 217, 26, 0.08), transparent 38%, rgba(215, 242, 7, 0.025))",

                            pointerEvents: "none",
                        }}
                    />

                    <CardBody
                        style={{
                            position: "relative",

                            minHeight: "100%",

                            display: "flex",
                            flexDirection: "column",

                            justifyContent:
                                "space-between",

                            gap: 40,
                        }}
                    >
                        {/* LOGO */}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <Image
                                src="/ent/atletica/aaaccu_logo_001.png"
                                alt="AAACCU"
                                width={68}
                                height={68}
                                style={{
                                    objectFit: "contain",
                                }}
                                priority
                            />

                            <div>
                                <strong
                                    style={{
                                        display: "block",

                                        fontSize: 20,

                                        letterSpacing:
                                            "-0.03em",
                                    }}
                                >
                                    AAACCU
                                </strong>

                                <span
                                    style={{
                                        display: "block",

                                        marginTop: 3,

                                        color:
                                            "var(--color-text-muted)",

                                        fontSize: 13,
                                    }}
                                >
                                    Atlética dos Cursos de
                                    Computação
                                </span>
                            </div>
                        </div>

                        {/* APRESENTAÇÃO */}

                        <div
                            style={{
                                maxWidth: 560,
                            }}
                        >
                            <Badge
                                color="primary"
                                style={{
                                    display:
                                        "inline-flex",

                                    alignItems:
                                        "center",

                                    gap: 8,

                                    marginBottom: 22,
                                }}
                            >
                                <ShoppingBag
                                    size={15}
                                />

                                Computaria
                            </Badge>

                            <h1
                                style={{
                                    margin: 0,

                                    fontSize:
                                        "clamp(34px, 4vw, 56px)",

                                    lineHeight: 1,

                                    letterSpacing:
                                        "-0.06em",
                                }}
                            >
                                Tudo da Computaria em um só
                                lugar.
                            </h1>

                            <p
                                style={{
                                    margin:
                                        "18px 0 0",

                                    color:
                                        "var(--color-text-muted)",

                                    fontSize: 16,

                                    lineHeight: 1.7,

                                    maxWidth: 520,
                                }}
                            >
                                Entre na sua conta para
                                acompanhar pedidos,
                                consultar sua associação e
                                aproveitar os benefícios
                                exclusivos da AAACCU.
                            </p>
                        </div>

                        {/* RECURSOS */}

                        <div
                            className="bp-login-feature-grid"
                            style={{
                                display: "grid",

                                gridTemplateColumns:
                                    "repeat(3, minmax(0, 1fr))",

                                gap: 12,
                            }}
                        >
                            <div className="bp-login-feature">
                                <ShoppingBag size={19} />

                                <strong>
                                    Produtos
                                </strong>

                                <span>
                                    Vendas e pré-vendas da
                                    Atlética.
                                </span>
                            </div>

                            <div className="bp-login-feature">
                                <Users size={19} />

                                <strong>
                                    Sócios
                                </strong>

                                <span>
                                    Benefícios e condições
                                    exclusivas.
                                </span>
                            </div>

                            <div className="bp-login-feature">
                                <TicketCheck size={19} />

                                <strong>
                                    Pedidos
                                </strong>

                                <span>
                                    Acompanhe suas compras.
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* FORMULÁRIO */}

                <Card
                    style={{
                        minHeight: 620,

                        display: "flex",

                        alignItems: "center",
                    }}
                >
                    <CardBody
                        style={{
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 28,
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,

                                    borderRadius: 18,

                                    background:
                                        "var(--color-primary-soft)",

                                    color:
                                        "var(--color-primary)",

                                    display: "grid",
                                    placeItems:
                                        "center",

                                    marginBottom: 18,
                                }}
                            >
                                <LockKeyhole
                                    size={22}
                                />
                            </div>

                            <p
                                style={{
                                    margin: 0,

                                    color:
                                        "var(--color-primary)",

                                    fontSize: 13,

                                    fontWeight: 700,
                                }}
                            >
                                Sua conta
                            </p>

                            <h2
                                style={{
                                    margin:
                                        "8px 0 0",

                                    fontSize: 32,

                                    lineHeight: 1.1,

                                    letterSpacing:
                                        "-0.04em",
                                }}
                            >
                                Entrar
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "10px 0 0",

                                    color:
                                        "var(--color-text-muted)",

                                    lineHeight: 1.6,

                                    fontSize: 14,
                                }}
                            >
                                Use seu email e senha para
                                acessar sua conta.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            style={{
                                display: "grid",
                                gap: 16,
                            }}
                        >
                            <Input
                                label="Email"
                                value={identificador}
                                onChange={(event) =>
                                    setIdentificador(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="seuemail@email.com"
                                autoComplete="username"
                                disabled={carregando}
                                required
                            />

                            <div>
                                <Input
                                    label="Senha"
                                    value={senha}
                                    onChange={(event) =>
                                        setSenha(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Sua senha"
                                    type="password"
                                    autoComplete="current-password"
                                    disabled={carregando}
                                    required
                                />

                                <div
                                    style={{
                                        display: "flex",

                                        justifyContent:
                                            "flex-end",

                                        marginTop: 8,
                                    }}
                                >
                                    <Link
                                        href="/recuperar-senha"
                                        style={{
                                            color:
                                                "var(--color-primary)",

                                            fontSize: 13,

                                            fontWeight: 700,

                                            textDecoration:
                                                "none",
                                        }}
                                    >
                                        Esqueceu sua senha?
                                    </Link>
                                </div>
                            </div>

                            {erro ? (
                                <div
                                    style={{
                                        border:
                                            "1px solid var(--color-danger-border)",

                                        background:
                                            "var(--color-danger-soft)",

                                        color:
                                            "var(--color-danger)",

                                        borderRadius: 18,

                                        padding:
                                            "12px 14px",

                                        fontSize: 13,

                                        lineHeight: 1.5,
                                    }}
                                >
                                    {erro}
                                </div>
                            ) : null}

                            <Button
                                type="submit"
                                disabled={
                                    carregando
                                }
                                style={{
                                    width: "100%",

                                    justifyContent:
                                        "center",

                                    marginTop: 4,
                                }}
                            >
                                {carregando
                                    ? "Entrando..."
                                    : "Entrar"}
                            </Button>
                        </form>

                        <div className="bp-auth-message bp-mt-5">
                            Ainda não tem uma conta?{" "}

                            <Link
                                href="/cadastro"
                                style={{
                                    color:
                                        "var(--color-primary)",

                                    fontWeight: 800,
                                }}
                            >
                                Criar conta
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </section>

            <style jsx>{`
                .bp-login-feature {
                    border: 1px solid
                    var(--color-border);

                    background: rgba(
                            156,
                            217,
                            26,
                            0.035
                    );

                    border-radius: 20px;

                    padding: 16px;

                    display: grid;

                    gap: 7px;

                    color: var(
                            --color-text-soft
                    );

                    font-size: 13px;
                }

                .bp-login-feature svg {
                    color: var(
                            --color-primary
                    );
                }

                .bp-login-feature strong {
                    color: var(
                            --color-text
                    );

                    font-size: 14px;
                }

                @media (max-width: 920px) {
                    .bp-login-shell {
                        grid-template-columns:
                            1fr !important;

                        max-width:
                                520px !important;
                    }

                    .bp-login-brand-card {
                        display:
                                none !important;
                    }
                }

                @media (max-width: 520px) {
                    main {
                        padding:
                                14px !important;
                    }
                }
            `}</style>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}