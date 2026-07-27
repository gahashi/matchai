"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Pencil,
    PlayCircle,
    Send,
    XCircle,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Snackbar } from "@/components/ui/Snackbar";
import { Textarea } from "@/components/ui/Textarea";

type SolicitacaoDetalheClientProps = {
    solicitacaoId: number;
    titulo: string;
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

export function SolicitacaoDetalheClient({
                                             solicitacaoId,
                                             titulo,
                                             statusCodigo,
                                             tipoCodigo,
                                             permissions,
                                         }: SolicitacaoDetalheClientProps) {
    const router = useRouter();

    const [modalAction, setModalAction] =
        useState<ActionType | null>(null);

    const [descricao, setDescricao] =
        useState("");

    const [
        descricaoError,
        setDescricaoError,
    ] = useState<string | null>(null);

    const [loadingAction, setLoadingAction] =
        useState<ActionType | null>(null);

    const [feedback, setFeedback] =
        useState<{
            type: "success" | "danger";
            title: string;
            message: string;
        } | null>(null);

    const canEdit =
        permissions.isRequester &&
        (
            statusCodigo === "rascunho" ||
            statusCodigo === "ajuste_solicitado"
        );

    const canSend =
        permissions.isRequester &&
        statusCodigo === "rascunho";

    const canAnalyze =
        permissions.canAnalyze &&
        tipoCodigo !== "criar_atletica" &&
        statusCodigo === "enviada";

    const canApprove =
        permissions.canApprove &&
        (
            statusCodigo === "enviada" ||
            statusCodigo === "em_analise"
        );

    const canReject =
        permissions.canReject &&
        (
            statusCodigo === "enviada" ||
            statusCodigo === "em_analise" ||
            statusCodigo === "ajuste_solicitado"
        );

    const canRequestAdjustment =
        permissions.canRequestAdjustment &&
        (
            statusCodigo === "enviada" ||
            statusCodigo === "em_analise"
        );

    const canCancel =
        permissions.isRequester &&
        (
            statusCodigo === "rascunho" ||
            statusCodigo === "enviada" ||
            statusCodigo === "ajuste_solicitado"
        );

    function openModal(action: ActionType) {
        if (loadingAction) {
            return;
        }

        setDescricao("");
        setDescricaoError(null);
        setModalAction(action);
    }

    function closeModal() {
        if (loadingAction) {
            return;
        }

        setModalAction(null);
        setDescricao("");
        setDescricaoError(null);
    }

    async function executeAction() {
        if (!modalAction || loadingAction) {
            return;
        }

        if (
            (
                modalAction === "recusar" ||
                modalAction ===
                "solicitar-ajuste"
            ) &&
            !descricao.trim()
        ) {
            setDescricaoError(
                modalAction === "recusar"
                    ? "Informe o motivo da recusa."
                    : "Informe os ajustes necessários."
            );

            return;
        }

        setLoadingAction(modalAction);
        setFeedback(null);

        try {
            const response = await fetch(
                `/api/sys/solicitacao/${solicitacaoId}/${modalAction}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        descricao:
                            descricao.trim() ||
                            null,
                    }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {
                throw new Error(
                    data.message ??
                    "Não foi possível executar a ação."
                );
            }

            setModalAction(null);
            setDescricao("");

            setFeedback({
                type: "success",
                title:
                    "Solicitação atualizada",
                message:
                    "A movimentação foi registrada com sucesso.",
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

    const modalNeedsDescription =
        modalAction === "recusar" ||
        modalAction ===
        "solicitar-ajuste";

    return (
        <>
            <div className="bp-solicitacao-detail-actions">
                {/*<AppLink*/}
                {/*    href="/sys/solicitacao"*/}
                {/*    color="secondary"*/}
                {/*    variant="soft"*/}
                {/*>*/}
                {/*    Voltar*/}
                {/*</AppLink>*/}

                {canCancel ? (
                    <Button
                        type="button"
                        color="secondary"
                        variant="soft"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal("cancelar")
                        }
                    >
                        <XCircle size={16} />
                        Cancelar solicitação
                    </Button>
                ) : null}

                {canSend ? (
                    <Button
                        type="button"
                        color="primary"
                        variant="soft"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal("enviar")
                        }
                    >
                        <Send size={16} />
                        Enviar
                    </Button>
                ) : null}

                {canEdit ? (
                    <AppLink
                        href={`/sys/solicitacao/${solicitacaoId}/editar`}
                        color="primary"
                        variant="solid"
                    >
                        <Pencil size={16} />
                        Editar solicitação
                    </AppLink>
                ) : null}

                {canAnalyze ? (
                    <Button
                        type="button"
                        color="info"
                        variant="soft"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal(
                                "em-analise"
                            )
                        }
                    >
                        <PlayCircle size={16} />
                        Colocar em análise
                    </Button>
                ) : null}

                {canRequestAdjustment ? (
                    <Button
                        type="button"
                        color="warning"
                        variant="soft"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal(
                                "solicitar-ajuste"
                            )
                        }
                    >
                        <AlertTriangle
                            size={16}
                        />
                        Solicitar ajuste
                    </Button>
                ) : null}

                {canReject ? (
                    <Button
                        type="button"
                        color="danger"
                        variant="soft"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal("recusar")
                        }
                    >
                        <XCircle size={16} />
                        Recusar
                    </Button>
                ) : null}

                {canApprove ? (
                    <Button
                        type="button"
                        color="success"
                        variant="solid"
                        disabled={
                            loadingAction !== null
                        }
                        onClick={() =>
                            openModal("aprovar")
                        }
                    >
                        <CheckCircle2
                            size={16}
                        />
                        Aprovar
                    </Button>
                ) : null}
            </div>

            <Modal
                open={modalAction !== null}
                title={
                    modalAction === "aprovar"
                        ? "Aprovar solicitação"
                        : modalAction ===
                        "recusar"
                            ? "Recusar solicitação"
                            : modalAction ===
                            "solicitar-ajuste"
                                ? "Solicitar ajuste"
                                : modalAction ===
                                "cancelar"
                                    ? "Cancelar solicitação"
                                    : modalAction ===
                                    "em-analise"
                                        ? "Colocar em análise"
                                        : "Enviar solicitação"
                }
                description={titulo}
                onCloseAction={closeModal}
            >
                <div className="bp-grid">
                    {modalAction ===
                    "aprovar" ? (
                        <Alert
                            color="warning"
                            variant="soft"
                            title="Confirme o impacto"
                        >
                            {tipoCodigo ===
                            "criar_atletica"
                                ? "A aprovação criará a atlética, vínculos acadêmicos, gestão inicial, membro, cargo e role da presidência."
                                : "A aprovação poderá aplicar as alterações previstas pelo módulo responsável."}
                        </Alert>
                    ) : null}

                    {modalAction ===
                    "cancelar" ? (
                        <Alert
                            color="warning"
                            variant="soft"
                            title="Cancelar solicitação"
                        >
                            A solicitação deixará de
                            seguir no fluxo de
                            análise.
                        </Alert>
                    ) : null}

                    {modalAction ===
                    "enviar" ? (
                        <Alert
                            color="info"
                            variant="soft"
                            title="Enviar solicitação"
                        >
                            A solicitação será
                            enviada para análise.
                        </Alert>
                    ) : null}

                    {modalAction ===
                    "em-analise" ? (
                        <Alert
                            color="info"
                            variant="soft"
                        >
                            Você ficará definido
                            como responsável pela
                            análise.
                        </Alert>
                    ) : null}

                    {modalNeedsDescription ? (
                        <Textarea
                            label={
                                modalAction ===
                                "recusar"
                                    ? "Justificativa"
                                    : "Ajustes necessários"
                            }
                            value={descricao}
                            onChange={(
                                event
                            ) => {
                                setDescricao(
                                    event.target
                                        .value
                                );
                                setDescricaoError(
                                    null
                                );
                            }}
                            error={
                                descricaoError
                            }
                            rows={5}
                            required
                        />
                    ) : null}

                    <div className="bp-inline-edit-actions">
                        <Button
                            type="button"
                            color="secondary"
                            variant="soft"
                            disabled={
                                loadingAction !==
                                null
                            }
                            onClick={closeModal}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            color={
                                modalAction ===
                                "aprovar"
                                    ? "success"
                                    : modalAction ===
                                    "recusar"
                                        ? "danger"
                                        : "primary"
                            }
                            variant="solid"
                            disabled={
                                loadingAction !==
                                null
                            }
                            onClick={
                                executeAction
                            }
                        >
                            {loadingAction ? (
                                <Loader2
                                    size={16}
                                />
                            ) : null}

                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>

            {feedback ? (
                <Snackbar
                    color={feedback.type}
                    title={feedback.title}
                    message={
                        feedback.message
                    }
                    autoClose={
                        feedback.type ===
                        "success"
                    }
                    onClose={() =>
                        setFeedback(null)
                    }
                />
            ) : null}
        </>
    );
}