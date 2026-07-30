"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {Badge} from "@/components/ui/Badge";
import Link from "next/link";

type ResolveLoginResponse = {
    ok: boolean;
    email?: string;
    message?: string;
};

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [identificador, setIdentificador] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const redirectTo = useMemo(() => {
        const callbackUrl = searchParams.get("callbackUrl");

        if (!callbackUrl) {
            return "/";
        }

        if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
            return "/";
        }

        return callbackUrl;
    }, [searchParams]);

    async function resolverEmailLogin() {
        const response = await fetch("/api/auth/resolve-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identificador,
            }),
        });

        const data = (await response.json()) as ResolveLoginResponse;

        if (!response.ok || !data.ok || !data.email) {
            throw new Error(data.message || "Usuário ou senha inválidos.");
        }

        return data.email;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErro("");
        setCarregando(true);

        try {
            const email = await resolverEmailLogin();

            const { error } = await authClient.signIn.email({
                email,
                password: senha,
                callbackURL: redirectTo,
            });

            if (error) {
                setErro("Usuário ou senha inválidos.");
                setCarregando(false);
                return;
            }

            router.replace(redirectTo);
            router.refresh();
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Usuário ou senha inválidos.");
            setCarregando(false);
        }
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                background:
                    "radial-gradient(circle at top left, rgba(245, 190, 60, 0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(87, 111, 255, 0.12), transparent 36%), var(--color-bg)",
                color: "var(--color-text)",
                display: "grid",
                placeItems: "center",
                padding: 24,
            }}
        >
            <section
                style={{
                    width: "100%",
                    maxWidth: 1120,
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.05fr) minmax(380px, 0.95fr)",
                    gap: 24,
                    alignItems: "stretch",
                }}
                className="bp-login-shell"
            >
                <Card
                    style={{
                        overflow: "hidden",
                        minHeight: 620,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",

                    }}
                    className="bp-login-brand-card"
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 38%, rgba(255,255,255,0.03))",
                            pointerEvents: "none",
                        }}
                    />

                    <CardBody
                        style={{
                            position: "relative",
                            minHeight: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: 40,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <Image
                                src="/brand/brava-pass-app-icon.png"
                                alt="Brava Pass"
                                width={48}
                                height={48}
                                style={{
                                    borderRadius: 18,
                                    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
                                }}
                                priority
                            />

                            <div>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: 18,
                                        letterSpacing: "-0.03em",
                                    }}
                                >
                                    Brava Pass
                                </strong>
                                <span
                                    style={{
                                        display: "block",
                                        marginTop: 3,
                                        color: "var(--color-text-muted)",
                                        fontSize: 13,
                                    }}
                                >
                                    SaaS universitário premium
                                </span>
                            </div>
                        </div>

                        <div style={{ maxWidth: 560 }}>
                            <Badge
                                color="primary"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 22,
                                }}
                            >
                                <Sparkles size={15} />
                                Gestão moderna para atléticas e parceiros
                            </Badge>

                            <h1
                                style={{
                                    margin: 0,
                                    fontSize: "clamp(34px, 4vw, 56px)",
                                    lineHeight: 1,
                                    letterSpacing: "-0.06em",
                                }}
                            >
                                Controle sua operação universitária com segurança.
                            </h1>

                            <p
                                style={{
                                    margin: "18px 0 0",
                                    color: "var(--color-text-muted)",
                                    fontSize: 16,
                                    lineHeight: 1.7,
                                    maxWidth: 520,
                                }}
                            >
                                Acesse sua conta para gerenciar atléticas, membros,
                                permissões, temas, parceiros, eventos e assinaturas
                                em uma plataforma SaaS moderna.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                gap: 12,
                            }}
                            className="bp-login-feature-grid"
                        >
                            <div className="bp-login-feature">
                                <ShieldCheck size={19} />
                                <strong>Permissões</strong>
                                <span>Roles, allow e deny.</span>
                            </div>

                            <div className="bp-login-feature">
                                <LockKeyhole size={19} />
                                <strong>Sessão segura</strong>
                                <span>Login real em produção.</span>
                            </div>

                            <div className="bp-login-feature">
                                <Sparkles size={19} />
                                <strong>Planos</strong>
                                <span>Atléticas e parceiros.</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card
                    style={{
                        minHeight: 620,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <CardBody style={{ width: "100%" }}>
                        <div style={{ marginBottom: 28 }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 18,
                                    background: "var(--color-primary-soft)",
                                    color: "var(--color-primary)",
                                    display: "grid",
                                    placeItems: "center",
                                    marginBottom: 18,
                                }}
                            >
                                <LockKeyhole size={22} />
                            </div>

                            <p
                                style={{
                                    margin: 0,
                                    color: "var(--color-primary)",
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            >
                                Login seguro
                            </p>

                            <h2
                                style={{
                                    margin: "8px 0 0",
                                    fontSize: 32,
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.04em",
                                }}
                            >
                                Entrar no Brava Pass
                            </h2>

                            <p
                                style={{
                                    margin: "10px 0 0",
                                    color: "var(--color-text-muted)",
                                    lineHeight: 1.6,
                                    fontSize: 14,
                                }}
                            >
                                Use seu email ou nickname para acessar sua conta.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                            <Input
                                label="Email ou nickname"
                                value={identificador}
                                onChange={(event) => setIdentificador(event.target.value)}
                                placeholder="admin@bravapass.dev ou admin_dev"
                                autoComplete="username"
                                disabled={carregando}
                                required
                            />

                            <Input
                                label="Senha"
                                value={senha}
                                onChange={(event) => setSenha(event.target.value)}
                                placeholder="Sua senha"
                                type="password"
                                autoComplete="current-password"
                                disabled={carregando}
                                required
                            />

                            {erro ? (
                                <div
                                    style={{
                                        border: "1px solid rgba(248, 113, 113, 0.25)",
                                        background: "rgba(248, 113, 113, 0.10)",
                                        color: "#fecaca",
                                        borderRadius: 18,
                                        padding: "12px 14px",
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {erro}
                                </div>
                            ) : null}

                            <Button
                                type="submit"
                                disabled={carregando}
                                style={{
                                    width: "100%",
                                    justifyContent: "center",
                                    marginTop: 4,
                                }}
                            >
                                {carregando ? "Entrando..." : "Entrar"}
                            </Button>
                        </form>
                        <div className="bp-auth-message bp-mt-5">
                            Não tem conta?{" "}
                            <Link href="/cadastro" style={{ color: "var(--color-primary)", fontWeight: 800 }}>
                                Criar uma conta
                            </Link>
                        </div>

                        <div
                            style={{
                                marginTop: 22,
                                border: "1px solid var(--color-border)",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: 20,
                                padding: 16,
                                color: "var(--color-text-soft)",
                                fontSize: 13,
                                lineHeight: 1.65,
                            }}
                        >
                            <strong
                                style={{
                                    display: "block",
                                    color: "var(--color-text)",
                                    marginBottom: 4,
                                }}
                            >
                                Acesso dev
                            </strong>
                            <div>Email: admin@bravapass.dev</div>
                            <div>Nickname: admin_dev</div>
                            <div>Senha: admin123</div>
                        </div>
                    </CardBody>
                </Card>
            </section>

            <style jsx>{`
                .bp-login-feature {
                    border: 1px solid var(--color-border);
                    background: rgba(255, 255, 255, 0.035);
                    border-radius: 20px;
                    padding: 16px;
                    display: grid;
                    gap: 7px;
                    color: var(--color-text-soft);
                    font-size: 13px;
                }

                .bp-login-feature svg {
                    color: var(--color-primary);
                }

                .bp-login-feature strong {
                    color: var(--color-text);
                    font-size: 14px;
                }

                @media (max-width: 920px) {
                    .bp-login-shell {
                        grid-template-columns: 1fr !important;
                        max-width: 520px !important;
                    }

                    .bp-login-brand-card {
                        display: none !important;
                    }
                }

                @media (max-width: 520px) {
                    main {
                        padding: 14px !important;
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