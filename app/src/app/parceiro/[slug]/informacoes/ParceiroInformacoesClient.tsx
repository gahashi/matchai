"use client";

import {
    FormEvent,
    useState,
} from "react";

import {
    Save,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import {
    Button,
} from "@/components/ui/Button";

import {
    Card,
    CardBody,
} from "@/components/ui/Card";

import {
    Input,
} from "@/components/ui/Input";

import {
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";

import {
    Textarea,
} from "@/components/ui/Textarea";


type Props = {
    parceiro: {
        id: number;

        codigo: string;
        slug: string;

        nome: string;
        descricao: string | null;
    };
};


export default function ParceiroInformacoesClient({
                                                      parceiro,
                                                  }: Props) {
    const router =
        useRouter();

    const [
        nome,
        setNome,
    ] =
        useState(
            parceiro.nome,
        );

    const [
        descricao,
        setDescricao,
    ] =
        useState(
            parceiro.descricao ??
            "",
        );

    const [
        slug,
        setSlug,
    ] =
        useState(
            parceiro.slug,
        );

    const [
        salvando,
        setSalvando,
    ] =
        useState(false);

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<SnackbarState | null>(
            null,
        );


    async function salvar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSalvando(true);
            setSnackbar(null);

            const response =
                await fetch(
                    `/api/parceiro/${parceiro.id}/configuracao/informacoes`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                nome,
                                descricao,
                                slug,
                            }),
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar as informações.",
                );
            }


            const novoSlug =
                String(
                    result
                        .data
                        .parceiro
                        .slug,
                );

            setSlug(
                novoSlug,
            );

            setSnackbar({
                color:
                    "success",

                title:
                    "Informações atualizadas",

                message:
                result.message,
            });


            if (
                novoSlug !==
                parceiro.slug
            ) {
                router.replace(
                    `/parceiro/${novoSlug}/informacoes`,
                );

                router.refresh();

                return;
            }

            router.refresh();
        } catch (error) {
            setSnackbar({
                color:
                    "danger",

                title:
                    "Erro ao salvar",

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar as informações.",

                autoClose:
                    false,
            });
        } finally {
            setSalvando(false);
        }
    }


    return (
        <>
            <PageHeader
                title="Informações"
                subtitle="Dados básicos e endereço público deste estabelecimento."
            />

            <Card>
                <CardBody>
                    <form
                        onSubmit={
                            salvar
                        }
                        className="bp-form-stack"
                    >
                        <Input
                            label="Código"
                            value={
                                parceiro.codigo
                            }
                            disabled
                            helperText="Identificador interno definido pela administração."
                        />

                        <Input
                            label="Nome"
                            value={
                                nome
                            }
                            onChange={
                                (
                                    event,
                                ) =>
                                    setNome(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            required
                            maxLength={
                                150
                            }
                        />

                        <Textarea
                            label="Descrição"
                            value={
                                descricao
                            }
                            onChange={
                                (
                                    event,
                                ) =>
                                    setDescricao(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            placeholder="Descreva brevemente o estabelecimento."
                        />

                        <Input
                            label="Endereço público"
                            value={
                                slug
                            }
                            onChange={
                                (
                                    event,
                                ) =>
                                    setSlug(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            required
                            helperText={
                                `/cardapio/${slug || "seu-estabelecimento"}`
                            }
                        />

                        <div
                            className="bp-action-row"
                            style={{
                                justifyContent:
                                    "flex-end",
                            }}
                        >
                            <Button
                                type="submit"
                                color="primary"
                                variant="solid"
                                disabled={
                                    salvando
                                }
                            >
                                <Save
                                    size={
                                        16
                                    }
                                />

                                {salvando
                                    ? "Salvando..."
                                    : "Salvar alterações"}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>


            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(
                            null,
                        )
                    }
                />
            ) : null}
        </>
    );
}