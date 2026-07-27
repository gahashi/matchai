import type { ComponentType } from "react";

import {
    CriarAtleticaSolicitacaoForm,
    type CriarAtleticaSolicitacaoFormProps,
} from "@/components/pages/sys/solicitacao/tipos/criar-atletica/CriarAtleticaSolicitacaoForm";
import { Card, CardBody } from "@/components/ui/Card";
import type {
    SolicitacaoStatusCodigo,
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

export type SolicitacaoFormMode =
    | "create"
    | "edit";

type SolicitacaoTipoFormProps = {
    tipoCodigo: SolicitacaoTipoCodigo;
    mode: SolicitacaoFormMode;
    solicitacaoId?: number;
    initialData?: unknown;
    solicitacaoStatusCodigo?: SolicitacaoStatusCodigo;

    criarAtleticaProps?: Omit<
        CriarAtleticaSolicitacaoFormProps,
        | "mode"
        | "solicitacaoId"
        | "initialData"
        | "solicitacaoStatusCodigo"
    >;
};

type FormularioRegistradoProps = {
    mode: SolicitacaoFormMode;
    solicitacaoId?: number;
    initialData?: unknown;
    solicitacaoStatusCodigo?: SolicitacaoStatusCodigo;
    propsEspecificas?: Record<string, unknown>;
};

function CriarAtleticaFormAdapter({
                                      mode,
                                      solicitacaoId,
                                      initialData,
                                      solicitacaoStatusCodigo,
                                      propsEspecificas = {},
                                  }: FormularioRegistradoProps) {
    return (
        <CriarAtleticaSolicitacaoForm
            mode={mode}
            solicitacaoId={solicitacaoId}
            initialData={initialData}
            solicitacaoStatusCodigo={
                solicitacaoStatusCodigo
            }
            {...(propsEspecificas as Omit<
                CriarAtleticaSolicitacaoFormProps,
                | "mode"
                | "solicitacaoId"
                | "initialData"
                | "solicitacaoStatusCodigo"
            >)}
        />
    );
}

const formularioPorTipo: Partial<
    Record<
        SolicitacaoTipoCodigo,
        ComponentType<FormularioRegistradoProps>
    >
> = {
    criar_atletica:
    CriarAtleticaFormAdapter,
};

export function SolicitacaoTipoForm({
                                        tipoCodigo,
                                        mode,
                                        solicitacaoId,
                                        initialData,
                                        solicitacaoStatusCodigo,
                                        criarAtleticaProps,
                                    }: SolicitacaoTipoFormProps) {
    const Formulario =
        formularioPorTipo[tipoCodigo];

    if (!Formulario) {
        return (
            <Card variant="elevated">
                <CardBody>
                    <h2 className="bp-section-title">
                        Formulário indisponível
                    </h2>

                    <p className="bp-section-subtitle">
                        Este tipo de solicitação ainda não possui
                        um formulário específico disponível.
                    </p>
                </CardBody>
            </Card>
        );
    }

    const propsEspecificas =
        tipoCodigo === "criar_atletica"
            ? criarAtleticaProps
            : undefined;

    return (
        <Formulario
            mode={mode}
            solicitacaoId={solicitacaoId}
            initialData={initialData}
            solicitacaoStatusCodigo={
                solicitacaoStatusCodigo
            }
            propsEspecificas={
                propsEspecificas as
                    | Record<string, unknown>
                    | undefined
            }
        />
    );
}