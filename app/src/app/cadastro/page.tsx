"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
    AtSign,
    BadgeCheck,
    LockKeyhole,
    MailCheck,
    ShieldCheck,
    Sparkles,
    UserRound,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Step = 1 | 2 | 3;

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
    const [nickname, setNickname] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");

    function showError(value: string) {
        setMessage(value);
        setMessageType("error");
    }

    function showSuccess(value: string) {
        setMessage(value);
        setMessageType("success");
    }

    async function handleRequestCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/register/request-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = (await response.json()) as ApiResponse;

            if (!response.ok || !data.ok) {
                showError(data.message ?? "Não foi possível enviar o código.");
                setLoading(false);
                return;
            }

            showSuccess("Código enviado para seu email.");
            setStep(2);
        } catch {
            showError("Não foi possível enviar o código.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/register/verify-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    code,
                }),
            });

            const data = (await response.json()) as ApiResponse;

            if (!response.ok || !data.ok) {
                showError(data.message ?? "Código inválido.");
                setLoading(false);
                return;
            }

            showSuccess("Email confirmado. Agora escolha seu nickname.");
            setStep(3);
        } catch {
            showError("Não foi possível validar o código.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteRegistration(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/register/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    code,
                    nickname,
                }),
            });

            const data = (await response.json()) as ApiResponse;

            if (!response.ok || !data.ok) {
                showError(data.message ?? "Não foi possível criar a conta.");
                setLoading(false);
                return;
            }

            const { error } = await authClient.signIn.email({
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
            showError("Não foi possível criar a conta.");
            setLoading(false);
        }
    }

    return (
        <main className="bp-auth-page">
            <section className="bp-auth-shell">
                <Card variant="elevated" className="bp-auth-brand-card">
                    <div className="bp-auth-brand-glow" />

                    <CardBody className="bp-auth-brand-body">
                        <div className="bp-auth-brand-top">
                            <Image
                                src="/brand/brava-pass-app-icon.png"
                                alt="Brava Pass"
                                width={48}
                                height={48}
                                className="bp-auth-logo"
                                priority
                            />

                            <div>
                                <strong className="bp-auth-brand-name">
                                    Brava Pass
                                </strong>
                                <span className="bp-auth-brand-subtitle">
                                    SaaS universitário premium
                                </span>
                            </div>
                        </div>

                        <div className="bp-auth-hero">
                            <Badge color="primary">
                                <Sparkles size={15} />
                                Comece com uma conta verificada
                            </Badge>

                            <h1>Entre para o ecossistema universitário do Brava Pass.</h1>

                            <p>
                                Crie sua conta, confirme seu email e depois complete
                                seu perfil com dados acadêmicos, atléticas, cargos e
                                vínculos quando necessário.
                            </p>
                        </div>

                        <div className="bp-auth-feature-grid">
                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <MailCheck size={18} />
                                </div>
                                <div>
                                    <strong>Email verificado</strong>
                                    <span>Código de segurança enviado antes da criação da conta.</span>
                                </div>
                            </div>

                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <UserRound size={18} />
                                </div>
                                <div>
                                    <strong>Perfil progressivo</strong>
                                    <span>Cadastro inicial simples e dados completos depois.</span>
                                </div>
                            </div>

                            <div className="bp-auth-feature">
                                <div className="bp-auth-feature-icon">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <strong>Pronto para permissões</strong>
                                    <span>Depois a conta pode virar membro, diretor ou parceiro.</span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bp-auth-form-card">
                    <CardBody>
                        <div className="bp-auth-step-row">
                            <span className={`bp-auth-step ${step >= 1 ? "active" : ""}`} />
                            <span className={`bp-auth-step ${step >= 2 ? "active" : ""}`} />
                            <span className={`bp-auth-step ${step >= 3 ? "active" : ""}`} />
                        </div>

                        <div className="bp-auth-form-header">
                            <div className="bp-auth-form-icon">
                                {step === 1 && <AtSign size={22} />}
                                {step === 2 && <MailCheck size={22} />}
                                {step === 3 && <BadgeCheck size={22} />}
                            </div>

                            <p>Cadastro seguro</p>

                            <h2>
                                {step === 1 && "Crie sua conta"}
                                {step === 2 && "Confirme seu email"}
                                {step === 3 && "Escolha seu nickname"}
                            </h2>

                            <span>
                                {step === 1 &&
                                    "Informe seu email e uma senha para começar."}
                                {step === 2 &&
                                    "Digite o código de 6 dígitos enviado para seu email."}
                                {step === 3 &&
                                    "Seu nickname será usado para login e identificação no sistema."}
                            </span>
                        </div>

                        {message ? (
                            <div className={`bp-auth-message ${messageType}`}>
                                {message}
                            </div>
                        ) : null}

                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className="bp-auth-form bp-mt-4">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="seuemail@exemplo.com"
                                    autoComplete="email"
                                    disabled={loading}
                                    required
                                />

                                <Input
                                    label="Senha"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />

                                <Button type="submit" disabled={loading} className="bp-auth-submit">
                                    <LockKeyhole size={16} />
                                    {loading ? "Enviando código..." : "Continuar"}
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} className="bp-auth-form bp-mt-4">
                                <Input
                                    label="Código de verificação"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value)}
                                    placeholder="000000"
                                    inputMode="numeric"
                                    maxLength={6}
                                    disabled={loading}
                                    required
                                />

                                <Button type="submit" disabled={loading} className="bp-auth-submit">
                                    <MailCheck size={16} />
                                    {loading ? "Validando..." : "Validar código"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={loading}
                                    onClick={() => setStep(1)}
                                >
                                    Alterar email
                                </Button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleCompleteRegistration} className="bp-auth-form bp-mt-4">
                                <Input
                                    label="Nickname"
                                    value={nickname}
                                    onChange={(event) => setNickname(event.target.value)}
                                    placeholder="exemplo: gabriel_dev"
                                    autoComplete="username"
                                    disabled={loading}
                                    required
                                />

                                <Button type="submit" disabled={loading} className="bp-auth-submit">
                                    <BadgeCheck size={16} />
                                    {loading ? "Criando conta..." : "Criar conta"}
                                </Button>
                            </form>
                        )}

                        <div className="bp-auth-message bp-mt-5">
                            Já tem conta?{" "}
                            <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 800 }}>
                                Entrar no Brava Pass
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </section>
        </main>
    );
}