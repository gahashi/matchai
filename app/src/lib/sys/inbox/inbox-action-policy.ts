export type InboxActionCode =
    | "abrir"
    | "arquivar"
    | "marcar_como_lida"
    | "marcar_como_nao_lida";

export type InboxActionKind =
    | "navigation"
    | "mutation";

export type InboxActionColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

export type InboxAvailableAction = {
    codigo: InboxActionCode;
    label: string;
    kind: InboxActionKind;
    color: InboxActionColor;
    variant: "solid" | "soft" | "ghost";
    href: string | null;
};

type ResolveInboxActionsInput = {
    tipoCodigo: string;
    statusCodigo: string;
    actionUrl: string | null;
    entidadeTipo: string | null;
    metadataText?: string | null;
    readAt: Date | string | null;
    archivedAt: Date | string | null;
};

type InboxMetadata = {
    sys_solicitacao_id?: number;
    tipo_codigo?: string;
};

function parseMetadata(
    value?: string | null
): InboxMetadata {
    if (!value) {
        return {};
    }

    try {
        const parsed: unknown =
            JSON.parse(value);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            return {};
        }

        return parsed as InboxMetadata;
    } catch {
        return {};
    }
}

function resolveInternalUrl(
    value: string | null
) {
    const url = value?.trim();

    if (
        !url ||
        !url.startsWith("/") ||
        url.startsWith("//")
    ) {
        return null;
    }

    return url;
}

function resolveOpenLabel({
                              tipoCodigo,
                              entidadeTipo,
                              metadata,
                          }: {
    tipoCodigo: string;
    entidadeTipo: string | null;
    metadata: InboxMetadata;
}) {
    if (
        entidadeTipo ===
        "sys_solicitacao" &&
        metadata.tipo_codigo ===
        "criar_atletica" &&
        tipoCodigo === "request"
    ) {
        return "Abrir para análise";
    }

    if (
        entidadeTipo ===
        "sys_solicitacao"
    ) {
        return "Abrir solicitação";
    }

    return "Abrir";
}

export function resolveInboxActions({
                                        tipoCodigo,
                                        statusCodigo,
                                        actionUrl,
                                        entidadeTipo,
                                        metadataText,
                                        readAt,
                                        archivedAt,
                                    }: ResolveInboxActionsInput): InboxAvailableAction[] {
    const actions: InboxAvailableAction[] =
        [];

    const metadata =
        parseMetadata(metadataText);

    const safeActionUrl =
        resolveInternalUrl(actionUrl);

    const isArchived =
        Boolean(archivedAt) ||
        statusCodigo === "archived";

    /*
     * Abrir é apenas navegação.
     *
     * Solicitações administrativas, incluindo
     * criar_atletica, nunca recebem aprovação
     * ou recusa direta pela Inbox.
     */
    if (safeActionUrl) {
        actions.push({
            codigo: "abrir",
            label: resolveOpenLabel({
                tipoCodigo,
                entidadeTipo,
                metadata,
            }),
            kind: "navigation",
            color: "primary",
            variant: "solid",
            href: safeActionUrl,
        });
    }

    /*
     * Ações locais da própria Inbox.
     */
    if (!isArchived) {
        if (readAt) {
            actions.push({
                codigo:
                    "marcar_como_nao_lida",
                label:
                    "Marcar como não lida",
                kind: "mutation",
                color: "secondary",
                variant: "soft",
                href: null,
            });
        } else {
            actions.push({
                codigo:
                    "marcar_como_lida",
                label: "Marcar como lida",
                kind: "mutation",
                color: "secondary",
                variant: "soft",
                href: null,
            });
        }

        actions.push({
            codigo: "arquivar",
            label: "Arquivar",
            kind: "mutation",
            color: "secondary",
            variant: "ghost",
            href: null,
        });
    }

    return actions;
}