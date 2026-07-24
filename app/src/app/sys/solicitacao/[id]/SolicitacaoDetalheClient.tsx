"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    PlayCircle,
    Send,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Snackbar } from "@/components/ui/Snackbar";

type SolicitacaoDetalheClientProps = {
    solicitacaoId: number;
    statusCodigo: string;
    tipoCodigo: string;
    permissions: {
        isRequester: boolean;
        canAnalyze: boolean;
        canApprove: boolean;
        canReject: boolean;
        canRequestAdjustment: boolean;
    };
};

type ActionType =
    | "enviar"
    | "em-analise"
    | "aprovar"
    | "recusar"
    | "solicitar-ajuste"
    | "cancelar";

function getActionLabel(action: ActionType) {
    const labels: Record<ActionType, string> = {
        enviar: "Enviar",
        "em-analise": "Colocar em análise",
        aprovar: "Aprovar",
        recusar: "Recusar",
        "solicitar-ajuste": "Solicitar ajuste",
        cancelar: "Cancelar",
    };

    return labels[action];
}
export function SolicitacaoDetalheClient({
                                             solicitacaoId,
                                             statusCodigo,
                                             tipoCodigo,
                                             permissions,
                                         }: SolicitacaoDetalheClientProps) {
    const router = useRouter();

    const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
    const [feedback, setFeedback] = useState<{
        type: "success" | "danger";
        title: string;
        message: string;
    } | null>(null);

    async function executeAction(action: ActionType) {
        const descricao =
            action === "recusar" || action === "solicitar-ajuste"
                ? window.prompt(
                    action === "recusar"
                        ? "Informe o motivo da recusa:"
                        : "Informe o ajuste solicitado:"
                )
                : null;

        if (
            (action === "recusar" || action === "solicitar-ajuste") &&
            !descricao
        ) {
            return;
        }

        setLoadingAction(action);
        setFeedback(null);

        try {
            const response = await fetch(
                `/api/sys/solicitacao/${solicitacaoId}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        descricao,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(
                    data.message ?? "Não foi possível executar a ação."
                );
            }

            setFeedback({
                type: "success",
                title: "Solicitação atualizada",
                message: `Ação "${getActionLabel(action)}" executada com sucesso.`,
            });

            router.refresh();
        } catch (error) {
            setFeedback({
                type: "danger",
                title: "Erro ao atualizar",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível executar a ação.",
            });
        } finally {
            setLoadingAction(null);
        }
    }

    const canSend =
        permissions.isRequester &&
        (statusCodigo === "rascunho" ||
            statusCodigo === "ajuste_solicitado");

    const canAnalyze =
        permissions.canAnalyze &&
        tipoCodigo !== "criar_atletica" &&
        statusCodigo === "enviada";

    const canApprove =
        permissions.canApprove &&
        (statusCodigo === "enviada" ||
            statusCodigo === "em_analise");

    const canReject =
        permissions.canReject &&
        (statusCodigo === "enviada" ||
            statusCodigo === "em_analise" ||
            statusCodigo === "ajuste_solicitado");

    const canRequestAdjustment =
        permissions.canRequestAdjustment &&
        (statusCodigo === "enviada" ||
            statusCodigo === "em_analise");

    const canCancel =
        permissions.isRequester &&
        (statusCodigo === "rascunho" ||
            statusCodigo === "enviada" ||
            statusCodigo === "ajuste_solicitado");

    return (
        <>
            <Card>
                <CardBody>
                    <h2 className="bp-section-title">Ações</h2>
                    <p className="bp-section-subtitle">
                        Execute a próxima movimentação da solicitação conforme o
                        status atual.
                    </p>

                    <div className="bp-action-row bp-mt-24">
                        {canSend ? (
                            <Button
                                type="button"
                                color="primary"
                                variant="solid"
                                onClick={() => executeAction("enviar")}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "enviar" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <Send size={16} />
                                )}
                                Enviar
                            </Button>
                        ) : null}

                        {canAnalyze ? (
                            <Button
                                type="button"
                                color="info"
                                variant="soft"
                                onClick={() => executeAction("em-analise")}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "em-analise" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <PlayCircle size={16} />
                                )}
                                Colocar em análise
                            </Button>
                        ) : null}

                        {canApprove ? (
                            <Button
                                type="button"
                                color="success"
                                variant="soft"
                                onClick={() => executeAction("aprovar")}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "aprovar" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                Aprovar
                            </Button>
                        ) : null}

                        {canRequestAdjustment ? (
                            <Button
                                type="button"
                                color="warning"
                                variant="soft"
                                onClick={() =>
                                    executeAction("solicitar-ajuste")
                                }
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "solicitar-ajuste" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <AlertTriangle size={16} />
                                )}
                                Solicitar ajuste
                            </Button>
                        ) : null}

                        {canReject ? (
                            <Button
                                type="button"
                                color="danger"
                                variant="soft"
                                onClick={() => executeAction("recusar")}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "recusar" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                Recusar
                            </Button>
                        ) : null}

                        {canCancel ? (
                            <Button
                                type="button"
                                color="secondary"
                                variant="soft"
                                onClick={() => executeAction("cancelar")}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === "cancelar" ? (
                                    <Loader2 size={16} />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                Cancelar
                            </Button>
                        ) : null}
                    </div>
                </CardBody>
            </Card>

            {feedback ? (
                <Snackbar
                    color={feedback.type}
                    title={feedback.title}
                    message={feedback.message}
                    autoClose={feedback.type === "success"}
                    onClose={() => setFeedback(null)}
                />
            ) : null}
        </>
    );
}