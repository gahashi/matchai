"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Loader2,
    Save,
    Send,
} from "lucide-react";

import {
    AsyncSelect,
    AsyncSelectOption,
} from "@/components/ui/AsyncSelect";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import {
    Card,
    CardBody,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Snackbar } from "@/components/ui/Snackbar";
import { Textarea } from "@/components/ui/Textarea";
import {
    CriarAtleticaPayload,
    montarCriarAtleticaPayload,
    parseCriarAtleticaPayload,
    slugifyCriarAtletica,
} from "@/lib/ent/atletica/solicitacao-criar-atletica-payload";
import type {
    SolicitacaoStatusCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

export type CriarAtleticaSolicitacaoInitialData = {
    payload: CriarAtleticaPayload;
    instituicaoInicial: AsyncSelectOption | null;
    polosIniciais: AsyncSelectOption[];
    cursosIniciais: AsyncSelectOption[];
};

export type CriarAtleticaSolicitacaoFormProps = {
    mode: "create" | "edit";
    solicitacaoId?: number;
    initialData?: unknown;
    solicitacaoStatusCodigo?: SolicitacaoStatusCodigo;
    solicitacaoEmAndamentoId?: number | null;
    solicitacaoEmAndamentoTitulo?: string | null;
    instituicaoInicial?: AsyncSelectOption | null;
    polosIniciais?: AsyncSelectOption[];
    cursosIniciais?: AsyncSelectOption[];
};

type FeedbackState = {
    color:
        | "success"
        | "danger"
        | "warning"
        | "info";
    title: string;
    message: string;
};

type SubmitAction =
    | "create"
    | "save"
    | "save-and-send";

function resolverInitialData(
    initialData: unknown
): CriarAtleticaSolicitacaoInitialData | null {
    if (
        !initialData ||
        typeof initialData !== "object"
    ) {
        return null;
    }

    const data =
        initialData as Partial<CriarAtleticaSolicitacaoInitialData>;

    const payload =
        parseCriarAtleticaPayload(data.payload);

    if (!payload) {
        return null;
    }

    return {
        payload,
        instituicaoInicial:
            data.instituicaoInicial ?? null,
        polosIniciais:
            Array.isArray(data.polosIniciais)
                ? data.polosIniciais
                : [],
        cursosIniciais:
            Array.isArray(data.cursosIniciais)
                ? data.cursosIniciais
                : [],
    };
}

async function lerJsonResponse(
    response: Response
) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export function CriarAtleticaSolicitacaoForm({
                                                 mode,
                                                 solicitacaoId,
                                                 initialData,
                                                 solicitacaoStatusCodigo,
                                                 solicitacaoEmAndamentoId = null,
                                                 solicitacaoEmAndamentoTitulo = null,
                                                 instituicaoInicial = null,
                                                 polosIniciais = [],
                                                 cursosIniciais = [],
                                             }: CriarAtleticaSolicitacaoFormProps) {
    const router = useRouter();

    const dadosEdicao = useMemo(
        () => resolverInitialData(initialData),
        [initialData]
    );

    const payloadInicial =
        mode === "edit"
            ? dadosEdicao?.payload ?? null
            : null;

    const [nome, setNome] = useState(
        payloadInicial?.atletica.nome ?? ""
    );

    const [apelido, setApelido] = useState(
        payloadInicial?.atletica.apelido ?? ""
    );

    const [sigla, setSigla] = useState(
        payloadInicial?.atletica.sigla ?? ""
    );

    const [slug, setSlug] = useState(
        payloadInicial?.atletica.slug ?? ""
    );

    const [
        slugError,
        setSlugError,
    ] = useState<string | null>(null);

    const [
        slugEditadoManualmente,
        setSlugEditadoManualmente,
    ] = useState(mode === "edit");

    const [mascote, setMascote] = useState(
        payloadInicial?.atletica.mascote ?? ""
    );

    const [descricao, setDescricao] = useState(
        payloadInicial?.atletica.descricao ?? ""
    );

    const [instituicao, setInstituicao] =
        useState<AsyncSelectOption | null>(
            mode === "edit"
                ? dadosEdicao?.instituicaoInicial ??
                null
                : instituicaoInicial
        );

    const [polos, setPolos] = useState<
        AsyncSelectOption[]
    >(
        mode === "edit"
            ? dadosEdicao?.polosIniciais ?? []
            : polosIniciais
    );

    const [cursos, setCursos] = useState<
        AsyncSelectOption[]
    >(
        mode === "edit"
            ? dadosEdicao?.cursosIniciais ?? []
            : cursosIniciais
    );

    const [gestaoNome, setGestaoNome] =
        useState(
            payloadInicial?.gestao.nome ?? ""
        );

    const [loadingAction, setLoadingAction] =
        useState<SubmitAction | null>(null);

    const loading =
        loadingAction !== null;

    const [feedback, setFeedback] =
        useState<FeedbackState | null>(null);

    const slugSugerido = useMemo(
        () =>
            slugifyCriarAtletica(
                apelido || sigla || nome
            ),
        [apelido, nome, sigla]
    );

    useEffect(() => {
        if (slugEditadoManualmente) {
            return;
        }

        setSlug(slugSugerido);
    }, [
        slugEditadoManualmente,
        slugSugerido,
    ]);

    const cursoEndpoint = instituicao
        ? `/api/edu/curso/select?instituicaoId=${instituicao.id}`
        : "/api/edu/curso/select";

    const poloEndpoint = instituicao
        ? `/api/edu/polo/select?instituicaoId=${instituicao.id}`
        : "/api/edu/polo/select";

    const podeReenviar =
        mode === "edit" &&
        solicitacaoStatusCodigo ===
        "ajuste_solicitado";

    function validarFormulario() {
        if (!nome.trim()) {
            setFeedback({
                color: "danger",
                title: "Nome obrigatório",
                message:
                    "Informe o nome oficial da atlética.",
            });

            return false;
        }

        if (!apelido.trim()) {
            setFeedback({
                color: "danger",
                title: "Apelido obrigatório",
                message:
                    "Informe o nome popular da atlética.",
            });

            return false;
        }

        if (!sigla.trim()) {
            setFeedback({
                color: "danger",
                title: "Sigla obrigatória",
                message:
                    "Informe a sigla da atlética.",
            });

            return false;
        }

        const slugFinal =
            slugifyCriarAtletica(slug);

        if (!slugFinal) {
            setFeedback({
                color: "danger",
                title:
                    "Endereço público obrigatório",
                message:
                    "Informe um endereço público válido para a atlética.",
            });

            return false;
        }

        if (!instituicao) {
            setFeedback({
                color: "danger",
                title:
                    "Instituição obrigatória",
                message:
                    "Selecione a instituição da atlética.",
            });

            return false;
        }

        if (polos.length === 0) {
            setFeedback({
                color: "danger",
                title: "Polo obrigatório",
                message:
                    "Selecione pelo menos um polo vinculado à atlética.",
            });

            return false;
        }

        if (cursos.length === 0) {
            setFeedback({
                color: "danger",
                title: "Curso obrigatório",
                message:
                    "Selecione pelo menos um curso vinculado à atlética.",
            });

            return false;
        }

        return true;
    }

    function montarPayloadAtual() {
        if (!instituicao) {
            throw new Error(
                "Selecione a instituição da atlética."
            );
        }

        return montarCriarAtleticaPayload({
            nome,
            apelido,
            sigla,
            slug: slugifyCriarAtletica(slug),
            mascote,
            descricao,
            instituicaoId: Number(
                instituicao.id
            ),
            poloIds: polos.map((polo) =>
                Number(polo.id)
            ),
            cursoIds: cursos.map((curso) =>
                Number(curso.id)
            ),
            gestaoNome,
            gestaoInicioAt:
                payloadInicial?.gestao
                    .inicioAt ??
                new Date().toISOString(),
            gestaoFimAt:
                payloadInicial?.gestao
                    .fimAt ?? null,
            gestaoObservacao:
                payloadInicial?.gestao
                    .observacao ?? null,
        });
    }

    async function criarSolicitacao(
        payload: CriarAtleticaPayload
    ) {
        const criarResponse = await fetch(
            "/api/sys/solicitacao",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    tipoCodigo:
                        "criar_atletica",
                    titulo: `Criação da atlética ${apelido.trim()}`,
                    descricao:
                        descricao.trim() ||
                        `Solicitação para criação da atlética ${apelido.trim()} (${sigla
                            .trim()
                            .toUpperCase()}).`,
                    entidadeTipo:
                        "ent_entidade",
                    entidadeId: null,
                    payload,
                    metadata: {
                        origem:
                            "ent_entidade_criar",
                    },
                }),
            }
        );

        const criarData =
            await lerJsonResponse(
                criarResponse
            );

        if (
            !criarResponse.ok ||
            !criarData?.ok
        ) {
            if (
                criarData?.field === "slug"
            ) {
                setSlugError(
                    criarData.message ??
                    "Este endereço público já está em uso."
                );
            }

            throw new Error(
                criarData?.message ??
                "Não foi possível criar a solicitação."
            );
        }

        return Number(
            criarData.solicitacao.id
        );
    }

    async function atualizarSolicitacao(
        payload: CriarAtleticaPayload
    ) {
        if (
            !solicitacaoId ||
            !Number.isInteger(solicitacaoId)
        ) {
            throw new Error(
                "Solicitação inválida para edição."
            );
        }

        const response = await fetch(
            `/api/sys/solicitacao/${solicitacaoId}/editar`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    titulo: `Criação da atlética ${apelido.trim()}`,
                    descricao:
                        descricao.trim() ||
                        `Solicitação para criação da atlética ${apelido.trim()} (${sigla
                            .trim()
                            .toUpperCase()}).`,
                    payload,
                }),
            }
        );

        const data =
            await lerJsonResponse(response);

        if (!response.ok || !data?.ok) {
            if (
                data?.field === "slug"
            ) {
                setSlugError(
                    data.message ??
                    "Este endereço público já está em uso."
                );
            }

            throw new Error(
                data?.message ??
                "Não foi possível salvar as alterações."
            );
        }
    }

    async function enviarSolicitacao(
        id: number,
        isReenvio: boolean
    ) {
        const response = await fetch(
            `/api/sys/solicitacao/${id}/enviar`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    descricao: isReenvio
                        ? "Solicitação ajustada e reenviada para análise."
                        : "Solicitação enviada automaticamente após preenchimento inicial.",
                }),
            }
        );

        const data =
            await lerJsonResponse(response);

        if (!response.ok || !data?.ok) {
            throw new Error(
                data?.message ??
                (isReenvio
                    ? "Os dados foram salvos, mas não foi possível reenviar a solicitação."
                    : "A solicitação foi criada, mas não foi possível enviá-la para análise.")
            );
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const nativeEvent =
            event.nativeEvent as SubmitEvent;

        const submitter =
            nativeEvent.submitter as
                | HTMLButtonElement
                | null;

        const action =
            (submitter?.value ??
                (mode === "create"
                    ? "create"
                    : "save")) as SubmitAction;

        if (
            mode === "create" &&
            solicitacaoEmAndamentoId
        ) {
            setFeedback({
                color: "warning",
                title:
                    "Solicitação já existente",
                message:
                    "Você já possui uma solicitação de criação de atlética em andamento.",
            });

            return;
        }

        if (!validarFormulario()) {
            return;
        }

        setSlugError(null);
        setLoadingAction(action);
        setFeedback(null);

        try {
            const payload =
                montarPayloadAtual();

            if (mode === "create") {
                const novaSolicitacaoId =
                    await criarSolicitacao(
                        payload
                    );

                await enviarSolicitacao(
                    novaSolicitacaoId,
                    false
                );

                setFeedback({
                    color: "success",
                    title:
                        "Solicitação enviada",
                    message:
                        "Sua solicitação de criação de atlética foi enviada para análise.",
                });

                router.push("/ent/atletica");
                router.refresh();

                return;
            }

            await atualizarSolicitacao(
                payload
            );

            if (
                action ===
                "save-and-send"
            ) {
                if (!solicitacaoId) {
                    throw new Error(
                        "Solicitação inválida para reenvio."
                    );
                }

                await enviarSolicitacao(
                    solicitacaoId,
                    true
                );

                setFeedback({
                    color: "success",
                    title:
                        "Solicitação reenviada",
                    message:
                        "As alterações foram salvas e a solicitação voltou para análise.",
                });
            } else {
                setFeedback({
                    color: "success",
                    title:
                        "Alterações salvas",
                    message:
                        "Os dados da solicitação foram atualizados.",
                });
            }

            router.push(
                `/sys/solicitacao/${solicitacaoId}`
            );
            router.refresh();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : mode === "edit"
                        ? "Não foi possível atualizar a solicitação."
                        : "Não foi possível criar a solicitação.";

            if (
                message
                    .toLowerCase()
                    .includes(
                        "endereço público"
                    )
            ) {
                setSlugError(message);
            }

            setFeedback({
                color: "danger",
                title:
                    mode === "edit"
                        ? "Erro ao atualizar solicitação"
                        : "Erro ao criar solicitação",
                message,
            });
        } finally {
            setLoadingAction(null);
        }
    }

    if (
        mode === "create" &&
        solicitacaoEmAndamentoId
    ) {
        return (
            <>
                <Card variant="elevated">
                    <CardBody>
                        <h2 className="bp-section-title">
                            Você já possui uma
                            solicitação em andamento
                        </h2>

                        <p className="bp-section-subtitle">
                            {solicitacaoEmAndamentoTitulo ??
                                "Acompanhe a solicitação aberta antes de criar uma nova."}
                        </p>

                        <div className="bp-action-row bp-mt-5">
                            <AppLink
                                href={`/sys/solicitacao/${solicitacaoEmAndamentoId}`}
                                color="primary"
                                variant="solid"
                            >
                                Abrir solicitação
                                <ArrowRight
                                    size={16}
                                />
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
                        message={
                            feedback.message
                        }
                        onClose={() =>
                            setFeedback(null)
                        }
                    />
                ) : null}
            </>
        );
    }

    if (
        mode === "edit" &&
        !dadosEdicao
    ) {
        return (
            <Card variant="elevated">
                <CardBody>
                    <h2 className="bp-section-title">
                        Dados indisponíveis
                    </h2>

                    <p className="bp-section-subtitle">
                        Não foi possível carregar os
                        dados desta solicitação para
                        edição.
                    </p>

                    <div className="bp-action-row bp-mt-5">
                        <AppLink
                            href={
                                solicitacaoId
                                    ? `/sys/solicitacao/${solicitacaoId}`
                                    : "/sys/solicitacao"
                            }
                            color="secondary"
                            variant="soft"
                        >
                            Voltar
                        </AppLink>
                    </div>
                </CardBody>
            </Card>
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
                                setNome(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Ex.: Associação Atlética Acadêmica dos Cursos de Computação da Universidade do Vale do Itajaí"
                            required
                        />

                        <Input
                            label="Apelido / nome popular"
                            value={apelido}
                            onChange={(event) =>
                                setApelido(
                                    event.target
                                        .value
                                )
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
                                setSlugEditadoManualmente(
                                    true
                                );
                                setSlugError(null);
                                setSlug(
                                    slugifyCriarAtletica(
                                        event.target
                                            .value
                                    )
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
                                setMascote(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Ex.: Alien"
                        />

                        <Input
                            label="Nome da gestão inicial"
                            value={gestaoNome}
                            onChange={(event) =>
                                setGestaoNome(
                                    event.target
                                        .value
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
                                onChange={(
                                    option
                                ) => {
                                    setInstituicao(
                                        option
                                    );
                                    setPolos([]);
                                    setCursos([]);
                                }}
                                minChars={0}
                                required
                                error={
                                    !instituicao &&
                                    feedback?.title ===
                                    "Instituição obrigatória"
                                        ? feedback.message
                                        : null
                                }
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <AsyncSelect
                                key={`polos-${String(
                                    instituicao?.id ??
                                    "sem-instituicao"
                                )}`}
                                mode="multiple"
                                label="Polos vinculados"
                                endpoint={
                                    poloEndpoint
                                }
                                placeholder="Busque e selecione os polos..."
                                value={polos}
                                onChange={setPolos}
                                minChars={0}
                                maxSelected={10}
                                disabled={
                                    !instituicao
                                }
                                required
                                firstSelectedLabel="Principal"
                                helperText="O primeiro polo selecionado será considerado o polo principal da atlética."
                                error={
                                    polos.length ===
                                    0 &&
                                    feedback?.title ===
                                    "Polo obrigatório"
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
                                    instituicao?.id ??
                                    "sem-instituicao"
                                )}`}
                                mode="multiple"
                                label="Cursos vinculados"
                                endpoint={
                                    cursoEndpoint
                                }
                                placeholder="Busque e selecione os cursos..."
                                value={cursos}
                                onChange={setCursos}
                                minChars={0}
                                maxSelected={8}
                                disabled={
                                    !instituicao
                                }
                                required
                                error={
                                    cursos.length ===
                                    0 &&
                                    feedback?.title ===
                                    "Curso obrigatório"
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
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Explique brevemente a criação da atlética, cursos envolvidos, contexto ou observações importantes."
                                rows={5}
                            />
                        </div>

                        <div className="bp-form-grid-full">
                            <div className="bp-inline-edit-actions">
                                <AppLink
                                    href={
                                        mode === "edit" &&
                                        solicitacaoId
                                            ? `/sys/solicitacao/${solicitacaoId}`
                                            : "/ent/atletica"
                                    }
                                    color="secondary"
                                    variant="soft"
                                >
                                    Cancelar
                                </AppLink>

                                {mode ===
                                "edit" ? (
                                    <Button
                                        type="submit"
                                        name="action"
                                        value="save"
                                        color="secondary"
                                        variant="soft"
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loadingAction === "save" ? (
                                            <Loader2 size={16} />
                                        ) : (
                                            <Save size={16} />
                                        )}

                                        {loadingAction === "save"
                                            ? "Salvando..."
                                            : "Salvar alterações"}
                                    </Button>
                                ) : null}

                                {podeReenviar ? (
                                    <Button
                                        type="submit"
                                        name="action"
                                        value="save-and-send"
                                        color="primary"
                                        variant="solid"
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loadingAction ===
                                        "save-and-send" ? (
                                            <Loader2 size={16} />
                                        ) : (
                                            <Send size={16} />
                                        )}

                                        {loadingAction ===
                                        "save-and-send"
                                            ? "Salvando e reenviando..."
                                            : "Salvar e reenviar"}
                                    </Button>
                                ) : null}

                                {mode ===
                                "create" ? (
                                    <Button
                                        type="submit"
                                        name="action"
                                        value="create"
                                        color="primary"
                                        variant="solid"
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loading ? (
                                            <Loader2
                                                size={
                                                    16
                                                }
                                            />
                                        ) : (
                                            <Send
                                                size={
                                                    16
                                                }
                                            />
                                        )}

                                        Confirmar
                                    </Button>
                                ) : null}
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
                        feedback.color ===
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