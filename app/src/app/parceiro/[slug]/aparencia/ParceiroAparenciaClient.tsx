"use client";

import {
    ChangeEvent,
    FormEvent,
    useState,
} from "react";

import {
    ImagePlus,
    Save,
    Trash2,
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
    ThemePreviewCard,
} from "@/components/ui/ThemePreviewCard";


type Arquivo = {
    public_url: string | null;
    original_name: string;
};


type Props = {
    parceiro: {
        id: number;
        nome: string;

        tema: {
            cor_primaria: string;
            cor_secundaria: string;
            cor_fundo: string;
            cor_texto: string;

            logo: Arquivo | null;
            banner: Arquivo | null;
        };
    };
};


export default function ParceiroAparenciaClient({
                                                    parceiro,
                                                }: Props) {
    const router =
        useRouter();

    const [
        corPrimaria,
        setCorPrimaria,
    ] =
        useState(
            parceiro.tema.cor_primaria,
        );

    const [
        corSecundaria,
        setCorSecundaria,
    ] =
        useState(
            parceiro.tema.cor_secundaria,
        );

    const [
        corFundo,
        setCorFundo,
    ] =
        useState(
            parceiro.tema.cor_fundo,
        );

    const [
        corTexto,
        setCorTexto,
    ] =
        useState(
            parceiro.tema.cor_texto,
        );


    const [
        logoFile,
        setLogoFile,
    ] =
        useState<File | null>(
            null,
        );

    const [
        bannerFile,
        setBannerFile,
    ] =
        useState<File | null>(
            null,
        );


    const [
        logoPreview,
        setLogoPreview,
    ] =
        useState<string | null>(
            parceiro.tema.logo
                ?.public_url ??
            null,
        );

    const [
        bannerPreview,
        setBannerPreview,
    ] =
        useState<string | null>(
            parceiro.tema.banner
                ?.public_url ??
            null,
        );


    const [
        removerLogo,
        setRemoverLogo,
    ] =
        useState(false);

    const [
        removerBanner,
        setRemoverBanner,
    ] =
        useState(false);


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


    function selecionarImagem(
        event: ChangeEvent<HTMLInputElement>,
        tipo: "logo" | "banner",
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const preview =
            URL.createObjectURL(
                file,
            );

        if (tipo === "logo") {
            setLogoFile(
                file,
            );

            setLogoPreview(
                preview,
            );

            setRemoverLogo(
                false,
            );
        } else {
            setBannerFile(
                file,
            );

            setBannerPreview(
                preview,
            );

            setRemoverBanner(
                false,
            );
        }
    }


    function removerImagem(
        tipo: "logo" | "banner",
    ) {
        if (tipo === "logo") {
            setLogoFile(
                null,
            );

            setLogoPreview(
                null,
            );

            setRemoverLogo(
                true,
            );
        } else {
            setBannerFile(
                null,
            );

            setBannerPreview(
                null,
            );

            setRemoverBanner(
                true,
            );
        }
    }


    async function salvar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setSalvando(
                true,
            );

            setSnackbar(
                null,
            );

            const formData =
                new FormData();

            formData.set(
                "cor_primaria",
                corPrimaria,
            );

            formData.set(
                "cor_secundaria",
                corSecundaria,
            );

            formData.set(
                "cor_fundo",
                corFundo,
            );

            formData.set(
                "cor_texto",
                corTexto,
            );

            formData.set(
                "remover_logo",
                removerLogo
                    ? "1"
                    : "0",
            );

            formData.set(
                "remover_banner",
                removerBanner
                    ? "1"
                    : "0",
            );


            if (logoFile) {
                formData.set(
                    "logo",
                    logoFile,
                );
            }

            if (bannerFile) {
                formData.set(
                    "banner",
                    bannerFile,
                );
            }


            const response =
                await fetch(
                    `/api/parceiro/${parceiro.id}/configuracao/aparencia`,
                    {
                        method:
                            "PATCH",

                        body:
                        formData,
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
                    "Não foi possível salvar a aparência.",
                );
            }


            setLogoFile(
                null,
            );

            setBannerFile(
                null,
            );

            setRemoverLogo(
                false,
            );

            setRemoverBanner(
                false,
            );


            const tema =
                result
                    .data
                    .parceiro
                    ?.par_parceiro_tema;

            setLogoPreview(
                tema
                    ?.logo_sys_arquivo
                    ?.public_url ??
                null,
            );

            setBannerPreview(
                tema
                    ?.banner_sys_arquivo
                    ?.public_url ??
                null,
            );


            setSnackbar({
                color:
                    "success",

                title:
                    "Aparência atualizada",

                message:
                result.message,
            });

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
                        : "Não foi possível salvar a aparência.",

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
                title="Aparência"
                subtitle="Personalize as cores, logo e banner deste estabelecimento."
            />

            <form
                onSubmit={
                    salvar
                }
                className="bp-card-stack"
            >
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Cores
                        </h2>

                        <p className="bp-section-subtitle">
                            Essas cores serão utilizadas no ambiente e no cardápio público do parceiro.
                        </p>

                        <div className="bp-theme-color-grid">
                            <Input
                                label="Cor primária"
                                type="color"
                                value={
                                    corPrimaria
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setCorPrimaria(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                            />

                            <Input
                                label="Cor secundária"
                                type="color"
                                value={
                                    corSecundaria
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setCorSecundaria(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                            />

                            <Input
                                label="Cor de fundo"
                                type="color"
                                value={
                                    corFundo
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setCorFundo(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                            />

                            <Input
                                label="Cor do texto"
                                type="color"
                                value={
                                    corTexto
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setCorTexto(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                            />
                        </div>
                    </CardBody>
                </Card>


                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Identidade visual
                        </h2>

                        <div className="bp-form-grid">
                            <div>
                                <strong>
                                    Logo
                                </strong>

                                {logoPreview ? (
                                    <div
                                        style={{
                                            marginTop:
                                                12,
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={
                                                logoPreview
                                            }
                                            alt="Logo do parceiro"
                                            style={{
                                                width:
                                                    160,

                                                height:
                                                    160,

                                                objectFit:
                                                    "contain",

                                                borderRadius:
                                                    16,

                                                border:
                                                    "1px solid var(--color-border)",
                                            }}
                                        />
                                    </div>
                                ) : null}

                                <div
                                    className="bp-action-row"
                                    style={{
                                        marginTop:
                                            12,

                                    }}
                                >
                                    <label className="bp-file-button">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                            hidden
                                            onChange={(event) =>
                                                selecionarImagem(
                                                    event,
                                                    "logo",
                                                )
                                            }
                                        />

                                        <ImagePlus size={16} />
                                        Escolher logo
                                    </label>

                                    {logoPreview ? (
                                        <Button
                                            type="button"
                                            color="danger"
                                            variant="outline"
                                            onClick={() =>
                                                removerImagem(
                                                    "logo",
                                                )
                                            }
                                        >
                                            <Trash2
                                                size={
                                                    16
                                                }
                                            />

                                            Remover
                                        </Button>
                                    ) : null}
                                </div>
                            </div>


                            <div>
                                <strong>
                                    Banner
                                </strong>

                                {bannerPreview ? (
                                    <div
                                        style={{
                                            marginTop:
                                                12,
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={
                                                bannerPreview
                                            }
                                            alt="Banner do parceiro"
                                            style={{
                                                width:
                                                    "100%",

                                                maxWidth:
                                                    440,

                                                height:
                                                    160,

                                                objectFit:
                                                    "cover",

                                                borderRadius:
                                                    16,

                                                border:
                                                    "1px solid var(--color-border)",
                                            }}
                                        />
                                    </div>
                                ) : null}

                                <div
                                    className="bp-action-row"
                                    style={{
                                        marginTop:
                                            12,


                                    }}
                                >
                                    <label className="bp-file-button">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                            hidden
                                            onChange={(event) =>
                                                selecionarImagem(
                                                    event,
                                                    "banner",
                                                )
                                            }
                                        />

                                        <ImagePlus size={16} />
                                        Escolher banner
                                    </label>

                                    {bannerPreview ? (
                                        <Button
                                            type="button"
                                            color="danger"
                                            variant="outline"
                                            onClick={() =>
                                                removerImagem(
                                                    "banner",
                                                )
                                            }
                                        >
                                            <Trash2
                                                size={
                                                    16
                                                }
                                            />

                                            Remover
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>


                <ThemePreviewCard
                    title={
                        parceiro.nome
                    }
                    description="Pré-visualização das cores selecionadas."
                    primaryColor={
                        corPrimaria
                    }
                    secondaryColor={
                        corSecundaria
                    }
                    backgroundColor={
                        corFundo
                    }
                    textColor={
                        corTexto
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
                            : "Salvar aparência"}
                    </Button>
                </div>
            </form>


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