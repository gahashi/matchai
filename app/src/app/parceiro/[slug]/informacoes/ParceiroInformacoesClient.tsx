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

        email_contato:
            string | null;

        telefone:
            string | null;

        whatsapp:
            string | null;

        endereco:
            string | null;

        google_maps_url:
            string | null;

        instagram_url:
            string | null;

        site_url:
            string | null;

        horario_funcionamento:
            string | null;
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
        emailContato,
        setEmailContato,
    ] =
        useState(
            parceiro.email_contato ??
            "",
        );

    const [
        telefone,
        setTelefone,
    ] =
        useState(
            parceiro.telefone ??
            "",
        );

    const [
        whatsapp,
        setWhatsapp,
    ] =
        useState(
            parceiro.whatsapp ??
            "",
        );


    const [
        endereco,
        setEndereco,
    ] =
        useState(
            parceiro.endereco ??
            "",
        );

    const [
        googleMapsUrl,
        setGoogleMapsUrl,
    ] =
        useState(
            parceiro.google_maps_url ??
            "",
        );


    const [
        instagramUrl,
        setInstagramUrl,
    ] =
        useState(
            parceiro.instagram_url ??
            "",
        );

    const [
        siteUrl,
        setSiteUrl,
    ] =
        useState(
            parceiro.site_url ??
            "",
        );


    const [
        horarioFuncionamento,
        setHorarioFuncionamento,
    ] =
        useState(
            parceiro.horario_funcionamento ??
            "",
        );


    const [
        salvando,
        setSalvando,
    ] =
        useState(
            false,
        );

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<
            SnackbarState |
            null
        >(
            null,
        );


    async function salvar(
        event:
        FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();


        try {
            setSalvando(
                true,
            );

            setSnackbar(
                null,
            );


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

                                email_contato:
                                emailContato,

                                telefone,

                                whatsapp,

                                endereco,

                                google_maps_url:
                                googleMapsUrl,

                                instagram_url:
                                instagramUrl,

                                site_url:
                                siteUrl,

                                horario_funcionamento:
                                horarioFuncionamento,
                            }),
                    },
                );


            const result =
                await response
                    .json();


            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar as informações.",
                );
            }


            const atualizado =
                result
                    .data
                    .parceiro;


            const novoSlug =
                String(
                    atualizado.slug,
                );


            setNome(
                atualizado.nome ??
                "",
            );

            setDescricao(
                atualizado.descricao ??
                "",
            );

            setSlug(
                novoSlug,
            );

            setEmailContato(
                atualizado.email_contato ??
                "",
            );

            setTelefone(
                atualizado.telefone ??
                "",
            );

            setWhatsapp(
                atualizado.whatsapp ??
                "",
            );

            setEndereco(
                atualizado.endereco ??
                "",
            );

            setGoogleMapsUrl(
                atualizado.google_maps_url ??
                "",
            );

            setInstagramUrl(
                atualizado.instagram_url ??
                "",
            );

            setSiteUrl(
                atualizado.site_url ??
                "",
            );

            setHorarioFuncionamento(
                atualizado.horario_funcionamento ??
                "",
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
        } catch (
            error
            ) {
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
            setSalvando(
                false,
            );
        }
    }


    return (
        <>
            <PageHeader
                title="Informações"
                subtitle="Dados básicos e informações públicas deste estabelecimento."
            />


            <form
                onSubmit={
                    salvar
                }
                className="bp-form-stack"
            >
                <Card>
                    <CardBody>
                        <div className="bp-form-stack">
                            <div>
                                <h2>
                                    Dados básicos
                                </h2>

                                <p className="bp-text-soft">
                                    Identificação e endereço da página pública.
                                </p>
                            </div>


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
                                label="URL pública"
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
                                maxLength={
                                    150
                                }
                                helperText={
                                    `/cardapio/${slug || "seu-estabelecimento"}`
                                }
                            />
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
                        <div className="bp-form-stack">
                            <div>
                                <h2>
                                    Contato
                                </h2>

                                <p className="bp-text-soft">
                                    Formas pelas quais clientes podem entrar em contato.
                                </p>
                            </div>


                            <Input
                                type="email"
                                label="E-mail"
                                value={
                                    emailContato
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setEmailContato(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    190
                                }
                                placeholder="contato@estabelecimento.com"
                            />


                            <Input
                                type="tel"
                                label="Telefone"
                                value={
                                    telefone
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setTelefone(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    30
                                }
                                placeholder="(47) 3333-3333"
                            />


                            <Input
                                type="tel"
                                label="WhatsApp"
                                value={
                                    whatsapp
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setWhatsapp(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    30
                                }
                                placeholder="(47) 99999-9999"
                            />
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
                        <div className="bp-form-stack">
                            <div>
                                <h2>
                                    Localização
                                </h2>

                                <p className="bp-text-soft">
                                    Endereço físico e localização no mapa.
                                </p>
                            </div>


                            <Textarea
                                label="Endereço"
                                value={
                                    endereco
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setEndereco(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    500
                                }
                                placeholder="Rua, número, bairro, cidade..."
                            />


                            <Input
                                type="url"
                                label="Link do Google Maps"
                                value={
                                    googleMapsUrl
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setGoogleMapsUrl(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    1000
                                }
                                placeholder="https://maps.app.goo.gl/..."
                            />
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
                        <div className="bp-form-stack">
                            <div>
                                <h2>
                                    Redes e site
                                </h2>

                                <p className="bp-text-soft">
                                    Links públicos do estabelecimento.
                                </p>
                            </div>


                            <Input
                                type="url"
                                label="Instagram"
                                value={
                                    instagramUrl
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setInstagramUrl(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    1000
                                }
                                placeholder="https://instagram.com/seuperfil"
                            />


                            <Input
                                type="url"
                                label="Site"
                                value={
                                    siteUrl
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setSiteUrl(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    1000
                                }
                                placeholder="https://seusite.com.br"
                            />
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
                        <div className="bp-form-stack">
                            <div>
                                <h2>
                                    Funcionamento
                                </h2>

                                <p className="bp-text-soft">
                                    Informe os horários de forma simples para exibição pública.
                                </p>
                            </div>


                            <Textarea
                                label="Horário de funcionamento"
                                value={
                                    horarioFuncionamento
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setHorarioFuncionamento(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                maxLength={
                                    4000
                                }
                                placeholder={
                                    "Segunda a sexta: 18h às 00h\nSábado: 16h às 02h"
                                }
                            />
                        </div>
                    </CardBody>
                </Card>


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


            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={
                        () =>
                            setSnackbar(
                                null,
                            )
                    }
                />
            ) : null}
        </>
    );
}