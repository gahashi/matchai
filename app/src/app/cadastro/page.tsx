"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
    AtSign,
    LockKeyhole,
    MailCheck,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Step = 1 | 2;

type ApiResponse = {
    ok: boolean;
    message?: string;
    expiresAt?: string;
};

export default function CadastroPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const [messageType, setMessageType] =
        useState<
            "error" | "success" | "info"
        >("info");

    function showError(value: string) {
        setMessage(value);
        setMessageType("error");
    }

    function showSuccess(value: string) {
        setMessage(value);
        setMessageType("success");
    }

    async function handleRequestCode(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                "/api/auth/register/request-code",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email,
                        password,
                    }),
                },
            );

            const data =
                (await response.json()) as ApiResponse;

            if (
                !response.ok ||
                !data.ok
            ) {
                showError(
                    data.message ??
                    "Não foi possível enviar o código.",
                );

                return;
            }

            showSuccess(
                "Código enviado para seu email.",
            );

            setStep(2);
        } catch {
            showError(
                "Não foi possível enviar o código.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteRegistration(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                "/api/auth/register/complete",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email,
                        password,
                        code,
                    }),
                },
            );

            const data =
                (await response.json()) as ApiResponse;

            if (
                !response.ok ||
                !data.ok
            ) {
                showError(
                    data.message ??
                    "Não foi possível criar a conta.",
                );

                return;
            }

            showSuccess(
                "Conta criada com sucesso.",
            );

            const { error } =
                await authClient.signIn.email({
                    email,
                    password,
                    callbackURL: "/",
                });

            if (error) {
                router.replace("/login");
                router.refresh();

                return;
            }

            router.replace("/");
            router.refresh();
        } catch {
            showError(
                "Não foi possível criar a conta.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="bp-auth-page">
            <section className="bp-auth-shell">
                <Card
                    variant="elevated"
                    className="bp-auth-brand-card"
                >
                    <div className="bp-auth-brand-glow" />

                    <CardBody className="bp-auth-brand-body">
                        <div className="bp-auth-brand-top">
                            <Image
                                src="/ent/atletica/aaaccu_logo_001.png"
                                alt="AAACCU"
                                width={56}
                                height={56}
                                className="bp-auth-logo"
                                priority
                            />

                            <div>
                                <strong className="bp-auth-brand-name">
                                    AAACCU
                                </strong>

                                <span className="bp-auth-brand-subtitle">
                                    Atlética dos Cursos de
                                    Computação
                                </span>
                            </div>
                        </div>

                        <div className="bp-auth-hero">
                            <Badge color="primary">
                                <MailCheck
                                    size={15}
                                />

                                Conta verificada
                            </Badge>

                            <h1>
                                Faça parte da
                                Computaria.
                            </h1>

                            <p>
                                Crie sua conta para
                                comprar produtos,
                                acompanhar pedidos e
                                aproveitar os benefícios
                                exclusivos da AAACCU.
                            </p>
                        </div>

                        <div className="bp-auth-feature-grid">
                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <MailCheck
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        Email verificado
                                    </strong>

                                    <span>
                                        Confirmação segura
                                        antes da criação da
                                        conta.
                                    </span>
                                </div>
                            </div>

                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <UserRound
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        Sua conta
                                    </strong>

                                    <span>
                                        Acompanhe seus dados,
                                        pedidos e benefícios.
                                    </span>
                                </div>
                            </div>

                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <ShieldCheck
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        Compra segura
                                    </strong>

                                    <span>
                                        Seus pedidos ficam
                                        vinculados à sua
                                        conta.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bp-auth-form-card">
                    <CardBody>
                        <div className="bp-auth-step-row">
                            <span
                                className={`bp-auth-step ${
                                    step >= 1
                                        ? "active"
                                        : ""
                                }`}
                            />

                            <span
                                className={`bp-auth-step ${
                                    step >= 2
                                        ? "active"
                                        : ""
                                }`}
                            />
                        </div>

                        <div className="bp-auth-form-header">
                            <div className="bp-auth-form-icon">
                                {step === 1 && (
                                    <AtSign
                                        size={22}
                                    />
                                )}

                                {step === 2 && (
                                    <MailCheck
                                        size={22}
                                    />
                                )}
                            </div>

                            <p>
                                Cadastro seguro
                            </p>

                            <h2>
                                {step === 1 &&
                                    "Crie sua conta"}

                                {step === 2 &&
                                    "Confirme seu email"}
                            </h2>

                            <span>
                                {step === 1 &&
                                    "Informe seu email e uma senha para começar."}

                                {step === 2 &&
                                    "Digite o código de 6 dígitos enviado para seu email para finalizar seu cadastro."}
                            </span>
                        </div>

                        {message ? (
                            <div
                                className={`bp-auth-message ${messageType}`}
                            >
                                {message}
                            </div>
                        ) : null}

                        {step === 1 && (
                            <form
                                onSubmit={
                                    handleRequestCode
                                }
                                className="bp-auth-form bp-mt-4"
                            >
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(
                                        event,
                                    ) =>
                                        setEmail(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="seuemail@exemplo.com"
                                    autoComplete="email"
                                    disabled={
                                        loading
                                    }
                                    required
                                />

                                <Input
                                    label="Senha"
                                    type="password"
                                    value={password}
                                    onChange={(
                                        event,
                                    ) =>
                                        setPassword(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    disabled={
                                        loading
                                    }
                                    minLength={8}
                                    required
                                />

                                <Button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
                                    className="bp-auth-submit"
                                >
                                    <LockKeyhole
                                        size={16}
                                    />

                                    {loading
                                        ? "Enviando código..."
                                        : "Continuar"}
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form
                                onSubmit={
                                    handleCompleteRegistration
                                }
                                className="bp-auth-form bp-mt-4"
                            >
                                <Input
                                    label="Código de verificação"
                                    value={code}
                                    onChange={(
                                        event,
                                    ) =>
                                        setCode(
                                            event
                                                .target
                                                .value.replace(
                                                /\D/g,
                                                "",
                                            ),
                                        )
                                    }
                                    placeholder="000000"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    disabled={
                                        loading
                                    }
                                    required
                                />

                                <Button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
                                    className="bp-auth-submit"
                                >
                                    <MailCheck
                                        size={16}
                                    />

                                    {loading
                                        ? "Criando conta..."
                                        : "Confirmar e criar conta"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={
                                        loading
                                    }
                                    onClick={() => {
                                        setStep(1);
                                        setCode("");
                                        setMessage("");
                                    }}
                                >
                                    Alterar email
                                </Button>
                            </form>
                        )}

                        <div className="bp-auth-message bp-mt-5">
                            Já tem conta?{" "}

                            <Link
                                href="/login"
                                style={{
                                    color:
                                        "var(--color-primary)",
                                    fontWeight:
                                        800,
                                }}
                            >
                                Entrar
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </section>
        </main>
    );
}