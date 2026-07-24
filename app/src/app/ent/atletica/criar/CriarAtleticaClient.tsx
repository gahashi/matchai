"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Send } from "lucide-react";

import {
    AsyncSelect,
    AsyncSelectOption,
} from "@/components/ui/AsyncSelect";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Snackbar } from "@/components/ui/Snackbar";
import { Textarea } from "@/components/ui/Textarea";

type CriarAtleticaClientProps = {
    solicitacaoEmAndamentoId: number | null;
    solicitacaoEmAndamentoTitulo: string | null;
    instituicaoInicial?: AsyncSelectOption | null;
    polosIniciais?: AsyncSelectOption[];
    cursosIniciais?: AsyncSelectOption[];
};

type FeedbackState = {
    color: "success" | "danger" | "warning" | "info";
    title: string;
    message: string;
};

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function CriarAtleticaClient({
                                        solicitacaoEmAndamentoId,
                                        solicitacaoEmAndamentoTitulo,
                                        instituicaoInicial = null,
                                        polosIniciais = [],
                                        cursosIniciais = [],
                                    }: CriarAtleticaClientProps) {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [apelido, setApelido] = useState("");
    const [sigla, setSigla] = useState("");
    const [slug, setSlug] = useState("");
    const [slugError, setSlugError] = useState<string | null>(null);
    const [slugEditadoManualmente, setSlugEditadoManualmente] =
        useState(false);

    const [mascote, setMascote] = useState("");
    const [descricao, setDescricao] = useState("");

    const [instituicao, setInstituicao] =
        useState<AsyncSelectOption | null>(instituicaoInicial);

    const [polos, setPolos] =
        useState<AsyncSelectOption[]>(polosIniciais);

    const [cursos, setCursos] =
        useState<AsyncSelectOption[]>(cursosIniciais);

    const [gestaoNome, setGestaoNome] = useState("");
    const [loading, setLoading] = useState(false);

    const [feedback, setFeedback] =
        useState<FeedbackState | null>(null);

    const slugSugerido = useMemo(
        () => slugify(apelido || sigla || nome),
        [apelido, nome, sigla]
    );

    useEffect(() => {
        if (slugEditadoManualmente) {
            return;
        }

        setSlug(slugSugerido);
    }, [slugEditadoManualmente, slugSugerido]);

    const cursoEndpoint = instituicao
        ? `/api/edu/curso/select?instituicaoId=${instituicao.id}`
        : "/api/edu/curso/select";

    const poloEndpoint = instituicao
        ? `/api/edu/polo/select?instituicaoId=${instituicao.id}`
        : "/api/edu/polo/select";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (solicitacaoEmAndamentoId) {
            setFeedback({
                color: "warning",
                title: "Solicitação já existente",
                message:
                    "Você já possui uma solicitação de criação de atlética em andamento.",
            });

            return;
        }

        if (!nome.trim()) {
            setFeedback({
                color: "danger",
                title: "Nome obrigatório",
                message: "Informe o nome oficial da atlética.",
            });

            return;
        }

        if (!apelido.trim()) {
            setFeedback({
                color: "danger",
                title: "Apelido obrigatório",
                message: "Informe o nome popular da atlética.",
            });

            return;
        }

        if (!sigla.trim()) {
            setFeedback({
                color: "danger",
                title: "Sigla obrigatória",
                message: "Informe a sigla da atlética.",
            });

            return;
        }

        const slugFinal = slugify(slug);

        if (!slugFinal) {
            setFeedback({
                color: "danger",
                title: "Endereço público obrigatório",
                message:
                    "Informe um endereço público válido para a atlética.",
            });

            return;
        }

        if (!instituicao) {
            setFeedback({
                color: "danger",
                title: "Instituição obrigatória",
                message: "Selecione a instituição da atlética.",
            });

            return;
        }

        if (polos.length === 0) {
            setFeedback({
                color: "danger",
                title: "Polo obrigatório",
                message:
                    "Selecione pelo menos um polo vinculado à atlética.",
            });

            return;
        }

        if (cursos.length === 0) {
            setFeedback({
                color: "danger",
                title: "Curso obrigatório",
                message:
                    "Selecione pelo menos um curso vinculado à atlética.",
            });

            return;
        }

        const polosPayload = polos.map((polo, index) => ({
            id: Number(polo.id),
            principal: index === 0,
        }));

        setSlugError(null);
        setLoading(true);
        setFeedback(null);

        try {
            const criarResponse = await fetch(
                "/api/sys/solicitacao",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tipoCodigo: "criar_atletica",
                        titulo: `Criação da atlética ${apelido.trim()}`,
                        descricao:
                            descricao.trim() ||
                            `Solicitação para criação da atlética ${apelido.trim()} (${sigla
                                .trim()
                                .toUpperCase()}).`,
                        entidadeTipo: "ent_entidade",
                        entidadeId: null,
                        payload: {
                            atletica: {
                                nome: nome.trim(),
                                apelido: apelido.trim(),
                                sigla: sigla
                                    .trim()
                                    .toUpperCase(),
                                slug: slugFinal,
                                mascote:
                                    mascote.trim() ||
                                    "Mascote não informado",
                                descricao:
                                    descricao.trim() || null,
                                instituicaoId: Number(
                                    instituicao.id
                                ),
                                polos: polosPayload,
                                cursoIds: cursos.map((curso) =>
                                    Number(curso.id)
                                ),
                            },
                            gestao: {
                                nome:
                                    gestaoNome.trim() ||
                                    `Gestão ${new Date().getFullYear()}`,
                                inicioAt:
                                    new Date().toISOString(),
                                fimAt: null,
                                observacao:
                                    "Gestão inicial informada na solicitação de criação da atlética.",
                            },
                        },
                        metadata: {
                            origem: "ent_entidade_criar",
                        },
                    }),
                }
            );

            const criarData = await criarResponse.json();

            if (!criarResponse.ok || !criarData.ok) {
                if (criarData.field === "slug") {
                    setSlugError(
                        criarData.message ??
                        "Este endereço público já está em uso."
                    );
                }

                throw new Error(
                    criarData.message ??
                    "Não foi possível criar a solicitação."
                );
            }

            const solicitacaoId = criarData.solicitacao.id;

            const enviarResponse = await fetch(
                `/api/sys/solicitacao/${solicitacaoId}/enviar`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        descricao:
                            "Solicitação enviada automaticamente após preenchimento inicial.",
                    }),
                }
            );

            const enviarData = await enviarResponse.json();

            if (!enviarResponse.ok || !enviarData.ok) {
                throw new Error(
                    enviarData.message ??
                    "A solicitação foi criada, mas não foi possível enviar para análise."
                );
            }

            setFeedback({
                color: "success",
                title: "Solicitação enviada",
                message:
                    "Sua solicitação de criação de atlética foi enviada para análise.",
            });

            router.push("/ent/atletica");
            router.refresh();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar a solicitação.";

            if (
                message
                    .toLowerCase()
                    .includes("endereço público")
            ) {
                setSlugError(message);
            }

            setFeedback({
                color: "danger",
                title: "Erro ao criar solicitação",
                message,
            });
        } finally {
            setLoading(false);
        }
    }

    if (solicitacaoEmAndamentoId) {
        return (
            <>
                <Card variant="elevated">
                    <CardBody>
                        <h2 className="bp-section-title">
                            Você já possui uma solicitação em andamento
                        </h2>

                        <p className="bp-section-subtitle">
                            {solicitacaoEmAndamentoTitulo ??
                                "Acompanhe a solicitação aberta antes de criar uma nova."}
                        </p>

                        <div className="bp-action-row bp-mt-24">
                            <AppLink
                                href={`/sys/solicitacao/${solicitacaoEmAndamentoId}`}
                                color="primary"
                                variant="solid"
                            >
                                Abrir solicitação
                                <ArrowRight size={16} />
                            </AppLink>

                            <AppLink
                                href="/ent/atletica"
                                color="secondary"
                                variant="soft"
                            >
                                Voltar
                            </AppLink>
                        </div>
                    </CardBody>
                </Card>

                {feedback ? (
                    <Snackbar
                        color={feedback.color}
                        title={feedback.title}
                        message={feedback.message}
                        onClose={() => setFeedback(null)}
                    />
                ) : null}
            </>
        );
    }

    return (
        <>
            <Card variant="elevated">
                <CardBody>
                    <form
                        onSubmit={handleSubmit}
                        className="bp-form-grid"
                    >
                        <Input
                            label="Nome oficial da atlética"
                            value={nome}
                            onChange={(event) =>
                                setNome(event.target.value)
                            }
                            placeholder="Ex.: Associação Atlética Acadêmica dos Cursos de Computação da Universidade do Vale do Itajaí"
                            required
                        />

                        <Input
                            label="Apelido / nome popular"
                            value={apelido}
                            onChange={(event) =>
                                setApelido(event.target.value)
                            }
                            placeholder="Ex.: Computaria"
                            helperText="Usado em cards, página pública, loja, eventos e comunicações."
                            required
                        />

                        <Input
                            label="Sigla"
                            value={sigla}
                            onChange={(event) =>
                                setSigla(
                                    event.target.value.toUpperCase()
                                )
                            }
                            placeholder="Ex.: AAACCU"
                            required
                        />

                        <Input
                            label="Endereço público"
                            value={slug}
                            onChange={(event) => {
                                setSlugEditadoManualmente(true);
                                setSlugError(null);
                                setSlug(
                                    slugify(event.target.value)
                                );
                            }}
                            placeholder="Ex.: computaria"
                            error={slugError}
                            helperText={
                                slug
                                    ? `A página pública ficará em: /a/${slug}`
                                    : "O sistema sugere automaticamente, mas você pode ajustar."
                            }
                            required
                        />

                        <Input
                            label="Mascote"
                            value={mascote}
                            onChange={(event) =>
                                setMascote(event.target.value)
                            }
                            placeholder="Ex.: Alien"
                        />

                        <Input
                            label="Nome da gestão inicial"
                            value={gestaoNome}
                            onChange={(event) =>
                                setGestaoNome(
                                    event.target.value
                                )
                            }
                            placeholder={`Gestão ${new Date().getFullYear()}`}
                        />

                        <div className="bp-form-grid-full">
                            <AsyncSelect
                                label="Instituição"
                                endpoint="/api/edu/instituicao/select"
                                placeholder="Busque pela instituição..."
                                value={instituicao}
                                onChange={(option) => {
                                    setInstituicao(option);
                                    setPolos([]);
                                    setCursos([]);
                                }}
                                minChars={0}
                                required
                                error={
                                    !instituicao &&
                                    feedback?.title === "Instituição obrigatória"
                                        ? feedback.message
                                        : null
                                }
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <AsyncSelect
                                key={`polos-${String(
                                    instituicao?.id ?? "sem-instituicao"
                                )}`}
                                mode="multiple"
                                label="Polos vinculados"
                                endpoint={poloEndpoint}
                                placeholder="Busque e selecione os polos..."
                                value={polos}
                                onChange={setPolos}
                                minChars={0}
                                maxSelected={10}
                                disabled={!instituicao}
                                required
                                firstSelectedLabel="Principal"
                                helperText="O primeiro polo selecionado será considerado o polo principal da atlética."
                                error={
                                    polos.length === 0 &&
                                    feedback?.title === "Polo obrigatório"
                                        ? feedback.message
                                        : null
                                }
                                emptyMessage={
                                    instituicao
                                        ? "Nenhum polo encontrado."
                                        : "Selecione uma instituição primeiro."
                                }
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <AsyncSelect
                                key={`cursos-${String(
                                    instituicao?.id ?? "sem-instituicao"
                                )}`}
                                mode="multiple"
                                label="Cursos vinculados"
                                endpoint={cursoEndpoint}
                                placeholder="Busque e selecione os cursos..."
                                value={cursos}
                                onChange={setCursos}
                                minChars={0}
                                maxSelected={8}
                                disabled={!instituicao}
                                required
                                error={
                                    cursos.length === 0 &&
                                    feedback?.title === "Curso obrigatório"
                                        ? feedback.message
                                        : null
                                }
                                emptyMessage={
                                    instituicao
                                        ? "Nenhum curso encontrado."
                                        : "Selecione uma instituição primeiro."
                                }
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <Textarea
                                label="Descrição"
                                value={descricao}
                                onChange={(event) =>
                                    setDescricao(
                                        event.target.value
                                    )
                                }
                                placeholder="Explique brevemente a criação da atlética, cursos envolvidos, contexto ou observações importantes."
                                rows={5}
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <div
                                className="bp-action-row"
                                style={{
                                    justifyContent: "flex-end",
                                }}
                            >
                                <AppLink
                                    href="/ent/atletica"
                                    color="secondary"
                                    variant="soft"
                                >
                                    Cancelar
                                </AppLink>

                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 size={16} />
                                    ) : (
                                        <Send size={16} />
                                    )}

                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {feedback ? (
                <Snackbar
                    color={feedback.color}
                    title={feedback.title}
                    message={feedback.message}
                    autoClose={
                        feedback.color === "success"
                    }
                    onClose={() => setFeedback(null)}
                />
            ) : null}
        </>
    );
}