"use client";

import Image from "next/image";
import Link from "next/link";

import {
    FormEvent,
    useState,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Mail,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";

import { Button } from "@/components/ui/Button";

import {
    Card,
    CardBody,
} from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";


type Step = 1 | 2 | 3;


export default function RecuperarSenhaPage() {
    const [step, setStep] =
        useState<Step>(1);

    const [email, setEmail] =
        useState("");

    const [code, setCode] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        passwordConfirmation,
        setPasswordConfirmation,
    ] = useState("");

    const [erro, setErro] =
        useState("");

    const [mensagem, setMensagem] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);


    async function solicitarCodigo(
        event?: FormEvent<HTMLFormElement>,
    ) {
        event?.preventDefault();

        setErro("");
        setMensagem("");
        setCarregando(true);

        try {
            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const {
                error,
            } =
                await authClient.emailOtp
                    .requestPasswordReset({
                        email:
                        normalizedEmail,
                    });

            if (error) {
                setErro(
                    error.message ??
                    "Não foi possível enviar o código.",
                );

                return;
            }

            /*
             * Mantemos mensagem genérica.
             *
             * Não precisamos informar ao usuário
             * detalhes sobre a existência da conta.
             */
            setMensagem(
                "Se o email estiver cadastrado, enviaremos um código de recuperação.",
            );

            setStep(2);
        } catch (error) {
            console.error(
                "Erro ao solicitar recuperação de senha:",
                error,
            );

            setErro(
                "Não foi possível solicitar a recuperação de senha.",
            );
        } finally {
            setCarregando(false);
        }
    }


    async function redefinirSenha(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErro("");
        setMensagem("");

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

        const normalizedCode =
            code.trim();


        if (
            normalizedCode.length !== 6
        ) {
            setErro(
                "Informe o código de 6 dígitos.",
            );

            return;
        }


        if (
            password.length < 8
        ) {
            setErro(
                "A nova senha deve ter pelo menos 8 caracteres.",
            );

            return;
        }


        if (
            password !==
            passwordConfirmation
        ) {
            setErro(
                "As senhas não coincidem.",
            );

            return;
        }


        setCarregando(true);

        try {
            const {
                error,
            } =
                await authClient.emailOtp
                    .resetPassword({
                        email:
                        normalizedEmail,

                        otp:
                        normalizedCode,

                        password,
                    });


            if (error) {
                setErro(
                    error.message ??
                    "Código inválido ou expirado.",
                );

                return;
            }


            setCode("");
            setPassword("");
            setPasswordConfirmation("");

            setMensagem(
                "Senha alterada com sucesso.",
            );

            setStep(3);
        } catch (error) {
            console.error(
                "Erro ao redefinir senha:",
                error,
            );

            setErro(
                "Não foi possível redefinir a senha.",
            );
        } finally {
            setCarregando(false);
        }
    }


    async function reenviarCodigo() {
        setErro("");
        setMensagem("");

        await solicitarCodigo();
    }


    return (
        <main
            style={{
                minHeight: "100vh",

                display: "grid",
                placeItems: "center",

                padding: 24,

                color:
                    "var(--color-text)",

                background:
                    "radial-gradient(circle at top left, var(--color-primary-soft), transparent 34%), var(--color-background)",
            }}
        >
            <Card
                style={{
                    width: "100%",
                    maxWidth: 480,
                }}
            >
                <CardBody>

                    {/* =====================================================
                     * MARCA
                     * ===================================================== */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",

                            gap: 14,

                            marginBottom: 32,
                        }}
                    >
                        <Image
                            src="/ent/atletica/aaaccu_logo_001.png"
                            alt="AAACCU"
                            width={56}
                            height={56}
                            style={{
                                objectFit:
                                    "contain",
                            }}
                            priority
                        />

                        <div>
                            <strong
                                style={{
                                    display:
                                        "block",

                                    fontSize:
                                        18,

                                    letterSpacing:
                                        "-0.03em",
                                }}
                            >
                                AAACCU
                            </strong>

                            <span
                                style={{
                                    color:
                                        "var(--color-text-muted)",

                                    fontSize:
                                        13,
                                }}
                            >
                                Computaria
                            </span>
                        </div>
                    </div>


                    {/* =====================================================
                     * ETAPA 1
                     * EMAIL
                     * ===================================================== */}

                    {step === 1 ? (
                        <>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,

                                    display:
                                        "grid",

                                    placeItems:
                                        "center",

                                    borderRadius:
                                        18,

                                    background:
                                        "var(--color-primary-soft)",

                                    color:
                                        "var(--color-primary)",

                                    marginBottom:
                                        18,
                                }}
                            >
                                <Mail
                                    size={22}
                                />
                            </div>


                            <h1
                                style={{
                                    margin: 0,

                                    fontSize:
                                        30,

                                    lineHeight:
                                        1.1,

                                    letterSpacing:
                                        "-0.04em",
                                }}
                            >
                                Recuperar senha
                            </h1>


                            <p
                                style={{
                                    margin:
                                        "12px 0 28px",

                                    color:
                                        "var(--color-text-muted)",

                                    fontSize:
                                        14,

                                    lineHeight:
                                        1.65,
                                }}
                            >
                                Informe o email
                                cadastrado na sua
                                conta. Enviaremos um
                                código para confirmar
                                a recuperação.
                            </p>


                            <form
                                onSubmit={
                                    solicitarCodigo
                                }
                                style={{
                                    display:
                                        "grid",

                                    gap: 16,
                                }}
                            >
                                <Input
                                    label="Email"
                                    type="email"

                                    value={
                                        email
                                    }

                                    onChange={(
                                        event,
                                    ) =>
                                        setEmail(
                                            event
                                                .target
                                                .value,
                                        )
                                    }

                                    placeholder="seuemail@email.com"

                                    autoComplete="email"

                                    disabled={
                                        carregando
                                    }

                                    required
                                />


                                {erro ? (
                                    <ErrorBox>
                                        {erro}
                                    </ErrorBox>
                                ) : null}


                                <Button
                                    type="submit"

                                    disabled={
                                        carregando
                                    }

                                    style={{
                                        width:
                                            "100%",

                                        justifyContent:
                                            "center",
                                    }}
                                >
                                    {carregando
                                        ? "Enviando..."
                                        : "Enviar código"}
                                </Button>
                            </form>
                        </>
                    ) : null}


                    {/* =====================================================
                     * ETAPA 2
                     * CÓDIGO + NOVA SENHA
                     * ===================================================== */}

                    {step === 2 ? (
                        <>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,

                                    display:
                                        "grid",

                                    placeItems:
                                        "center",

                                    borderRadius:
                                        18,

                                    background:
                                        "var(--color-primary-soft)",

                                    color:
                                        "var(--color-primary)",

                                    marginBottom:
                                        18,
                                }}
                            >
                                <KeyRound
                                    size={22}
                                />
                            </div>


                            <h1
                                style={{
                                    margin: 0,

                                    fontSize:
                                        30,

                                    lineHeight:
                                        1.1,

                                    letterSpacing:
                                        "-0.04em",
                                }}
                            >
                                Definir nova senha
                            </h1>


                            <p
                                style={{
                                    margin:
                                        "12px 0 20px",

                                    color:
                                        "var(--color-text-muted)",

                                    fontSize:
                                        14,

                                    lineHeight:
                                        1.65,
                                }}
                            >
                                Digite o código enviado
                                para{" "}

                                <strong
                                    style={{
                                        color:
                                            "var(--color-text)",
                                    }}
                                >
                                    {email}
                                </strong>

                                {" "}e escolha sua nova
                                senha.
                            </p>


                            {mensagem ? (
                                <SuccessBox>
                                    {mensagem}
                                </SuccessBox>
                            ) : null}


                            <form
                                onSubmit={
                                    redefinirSenha
                                }
                                style={{
                                    display:
                                        "grid",

                                    gap: 16,

                                    marginTop:
                                        20,
                                }}
                            >
                                <Input
                                    label="Código de verificação"

                                    type="text"

                                    value={
                                        code
                                    }

                                    onChange={(
                                        event,
                                    ) =>
                                        setCode(
                                            event
                                                .target
                                                .value
                                                .replace(
                                                    /\D/g,
                                                    "",
                                                )
                                                .slice(
                                                    0,
                                                    6,
                                                ),
                                        )
                                    }

                                    placeholder="000000"

                                    inputMode="numeric"

                                    autoComplete="one-time-code"

                                    disabled={
                                        carregando
                                    }

                                    required
                                />


                                <Input
                                    label="Nova senha"

                                    type="password"

                                    value={
                                        password
                                    }

                                    onChange={(
                                        event,
                                    ) =>
                                        setPassword(
                                            event
                                                .target
                                                .value,
                                        )
                                    }

                                    autoComplete="new-password"

                                    disabled={
                                        carregando
                                    }

                                    required
                                />


                                <Input
                                    label="Confirmar nova senha"

                                    type="password"

                                    value={
                                        passwordConfirmation
                                    }

                                    onChange={(
                                        event,
                                    ) =>
                                        setPasswordConfirmation(
                                            event
                                                .target
                                                .value,
                                        )
                                    }

                                    autoComplete="new-password"

                                    disabled={
                                        carregando
                                    }

                                    required
                                />


                                {erro ? (
                                    <ErrorBox>
                                        {erro}
                                    </ErrorBox>
                                ) : null}


                                <Button
                                    type="submit"

                                    disabled={
                                        carregando
                                    }

                                    style={{
                                        width:
                                            "100%",

                                        justifyContent:
                                            "center",
                                    }}
                                >
                                    {carregando
                                        ? "Alterando..."
                                        : "Redefinir senha"}
                                </Button>


                                <button
                                    type="button"

                                    disabled={
                                        carregando
                                    }

                                    onClick={
                                        reenviarCodigo
                                    }

                                    style={{
                                        border:
                                            "none",

                                        background:
                                            "transparent",

                                        color:
                                            "var(--color-text-muted)",

                                        cursor:
                                            carregando
                                                ? "default"
                                                : "pointer",

                                        fontSize:
                                            13,

                                        fontWeight:
                                            700,

                                        padding:
                                            "8px 12px",
                                    }}
                                >
                                    Reenviar código
                                </button>
                            </form>
                        </>
                    ) : null}


                    {/* =====================================================
                     * ETAPA 3
                     * SUCESSO
                     * ===================================================== */}

                    {step === 3 ? (
                        <>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,

                                    display:
                                        "grid",

                                    placeItems:
                                        "center",

                                    borderRadius:
                                        18,

                                    background:
                                        "var(--color-success-soft)",

                                    color:
                                        "var(--color-success)",

                                    marginBottom:
                                        18,
                                }}
                            >
                                <CheckCircle2
                                    size={22}
                                />
                            </div>


                            <h1
                                style={{
                                    margin: 0,

                                    fontSize:
                                        30,

                                    lineHeight:
                                        1.1,

                                    letterSpacing:
                                        "-0.04em",
                                }}
                            >
                                Senha alterada
                            </h1>


                            <p
                                style={{
                                    margin:
                                        "12px 0 28px",

                                    color:
                                        "var(--color-text-muted)",

                                    fontSize:
                                        14,

                                    lineHeight:
                                        1.65,
                                }}
                            >
                                Sua senha foi
                                redefinida com sucesso.
                                Agora você já pode
                                entrar novamente.
                            </p>


                            <Link
                                href="/login"
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    width:
                                        "100%",

                                    minHeight:
                                        42,

                                    borderRadius:
                                        "var(--radius-md)",

                                    background:
                                        "var(--color-primary)",

                                    color:
                                        "var(--color-primary-foreground)",

                                    fontSize:
                                        14,

                                    fontWeight:
                                        800,

                                    textDecoration:
                                        "none",
                                }}
                            >
                                Entrar na minha conta
                            </Link>
                        </>
                    ) : null}


                    {/* =====================================================
                     * VOLTAR
                     * ===================================================== */}

                    {step !== 3 ? (
                        <div
                            style={{
                                marginTop:
                                    24,

                                textAlign:
                                    "center",
                            }}
                        >
                            <Link
                                href="/login"
                                style={{
                                    display:
                                        "inline-flex",

                                    alignItems:
                                        "center",

                                    gap: 6,

                                    color:
                                        "var(--color-text-muted)",

                                    fontSize:
                                        13,

                                    fontWeight:
                                        700,

                                    textDecoration:
                                        "none",
                                }}
                            >
                                <ArrowLeft
                                    size={15}
                                />

                                Voltar para o login
                            </Link>
                        </div>
                    ) : null}

                </CardBody>
            </Card>
        </main>
    );
}


function ErrorBox({
                      children,
                  }: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                border:
                    "1px solid var(--color-danger-border)",

                background:
                    "var(--color-danger-soft)",

                color:
                    "var(--color-danger)",

                borderRadius:
                    16,

                padding:
                    "12px 14px",

                fontSize:
                    13,

                lineHeight:
                    1.5,
            }}
        >
            {children}
        </div>
    );
}


function SuccessBox({
                        children,
                    }: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                border:
                    "1px solid var(--color-success-border)",

                background:
                    "var(--color-success-soft)",

                color:
                    "var(--color-success)",

                borderRadius:
                    16,

                padding:
                    "12px 14px",

                fontSize:
                    13,

                lineHeight:
                    1.5,
            }}
        >
            {children}
        </div>
    );
}