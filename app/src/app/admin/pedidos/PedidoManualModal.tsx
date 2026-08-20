"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Textarea } from "@/components/ui/Textarea";

export type PedidoManualProduto = {
    id: number;
    codigo: string;
    nome: string;
    preco_normal: number;
    modalidade_venda: string;
    controla_estoque: number;
    estoque_atual: number | null;
    ativo: number;
    previsao_entrega: string | Date | null;
    eh_kit: boolean;
    variacoes: Array<{
        id: number;
        nome: string;
        estoque_atual: number | null;
        ativo: number;
    }>;
    campos: Array<{
        id: number;
        nome: string;
        descricao: string | null;
        tipo: "texto" | "numero";
        obrigatorio: number;
        ativo: number;
    }>;
    componentes: Array<{
        id: number;
        prd_produto_componente_id: number;
        quantidade: number;
        ativo: number;
        produto: {
            id: number;
            codigo: string;
            nome: string;
            ativo: number;
            variacoes: Array<{
                id: number;
                nome: string;
                estoque_atual: number | null;
            }>;
        };
    }>;
};

type Props = {
    open: boolean;
    produtos: PedidoManualProduto[];
    onClose: () => void;
    onCreated: (message: string) => Promise<void> | void;
    onError: (message: string) => void;
};

type Origem = "manual" | "legado";
type PagamentoStatus =
    | "pendente"
    | "aprovado"
    | "recusado"
    | "cancelado"
    | "estornado"
    | "expirado";

type ItemForm = {
    key: string;
    produtoId: string;
    variacaoId: string;
    quantidade: string;
    precoUnitario: string;
    campos: Record<number, string>;
    componentes: Record<
        number,
        {
            variacaoId: string;
            campos: Record<number, string>;
        }
    >;
};

function key() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
}

function emptyItem(): ItemForm {
    return {
        key: key(),
        produtoId: "",
        variacaoId: "",
        quantidade: "1",
        precoUnitario: "",
        campos: {},
        componentes: {},
    };
}

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}
function formatTelefone(value: string) {
    const numeros = value
        .replace(/\D/g, "")
        .slice(0, 11);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 6) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function allowedPedidoStatuses(status: PagamentoStatus) {
    if (status === "aprovado") {
        return [
            ["confirmado", "Pedido confirmado"],
            ["em_preparacao", "Em preparação"],
            ["pronto_retirada", "Pronto para retirada"],
            ["enviado", "Enviado"],
            ["entregue", "Entregue"],
        ] as const;
    }

    if (status === "pendente") {
        return [
            ["recebido", "Pedido recebido"],
            ["aguardando_pagamento", "Aguardando pagamento"],
        ] as const;
    }

    return [["cancelado", "Cancelado"]] as const;
}

function defaultPedidoStatus(status: PagamentoStatus) {
    if (status === "aprovado") return "confirmado";
    if (status === "pendente") return "aguardando_pagamento";
    return "cancelado";
}

export function PedidoManualModal({
    open,
    produtos,
    onClose,
    onCreated,
    onError,
}: Props) {
    const [salvando, setSalvando] = useState(false);
    const [origem, setOrigem] = useState<Origem>("manual");
    const [dataOriginal, setDataOriginal] = useState("");
    const [clienteNome, setClienteNome] = useState("");
    const [clienteEmail, setClienteEmail] = useState("");
    const [clienteTelefone, setClienteTelefone] = useState("");
    const [pagamentoMetodo, setPagamentoMetodo] = useState("pix_manual");
    const [pagamentoStatus, setPagamentoStatus] =
        useState<PagamentoStatus>("aprovado");
    const [pedidoStatus, setPedidoStatus] = useState("confirmado");
    const [movimentarEstoque, setMovimentarEstoque] = useState(true);
    const [observacao, setObservacao] = useState("");
    const [itens, setItens] = useState<ItemForm[]>([emptyItem()]);

    const produtosMap = useMemo(
        () => new Map(produtos.map((produto) => [produto.id, produto])),
        [produtos],
    );

    const total = useMemo(
        () =>
            itens.reduce((sum, item) => {
                const produto = produtosMap.get(Number(item.produtoId));
                const quantidade = Number(item.quantidade);
                const preco =
                    item.precoUnitario === ""
                        ? produto?.preco_normal ?? 0
                        : Number(item.precoUnitario);

                return Number.isFinite(quantidade) && Number.isFinite(preco)
                    ? sum + quantidade * preco
                    : sum;
            }, 0),
        [itens, produtosMap],
    );

    function reset() {
        setOrigem("manual");
        setDataOriginal("");
        setClienteNome("");
        setClienteEmail("");
        setClienteTelefone("");
        setPagamentoMetodo("pix_manual");
        setPagamentoStatus("aprovado");
        setPedidoStatus("confirmado");
        setMovimentarEstoque(true);
        setObservacao("");
        setItens([emptyItem()]);
    }

    function close() {
        if (salvando) return;
        reset();
        onClose();
    }

    function updateItem(itemKey: string, patch: Partial<ItemForm>) {
        setItens((current) =>
            current.map((item) =>
                item.key === itemKey ? { ...item, ...patch } : item,
            ),
        );
    }

    function selectProduto(itemKey: string, produtoId: string) {
        const produto = produtosMap.get(Number(produtoId));
        const componentes: ItemForm["componentes"] = {};

        for (const componente of produto?.componentes.filter((c) => c.ativo) ?? []) {
            componentes[componente.id] = {
                variacaoId: "",
                campos: {},
            };
        }

        updateItem(itemKey, {
            produtoId,
            variacaoId: "",
            quantidade: "1",
            precoUnitario: produto ? String(produto.preco_normal) : "",
            campos: {},
            componentes,
        });
    }

    function updateCampo(itemKey: string, campoId: number, value: string) {
        setItens((current) =>
            current.map((item) =>
                item.key === itemKey
                    ? {
                          ...item,
                          campos: {
                              ...item.campos,
                              [campoId]: value,
                          },
                      }
                    : item,
            ),
        );
    }

    function updateComponente(
        itemKey: string,
        componenteId: number,
        variacaoId?: string,
        campo?: { id: number; value: string },
    ) {
        setItens((current) =>
            current.map((item) => {
                if (item.key !== itemKey) return item;

                const atual = item.componentes[componenteId] ?? {
                    variacaoId: "",
                    campos: {},
                };

                return {
                    ...item,
                    componentes: {
                        ...item.componentes,
                        [componenteId]: {
                            ...atual,
                            ...(variacaoId !== undefined ? { variacaoId } : {}),
                            campos: campo
                                ? {
                                      ...atual.campos,
                                      [campo.id]: campo.value,
                                  }
                                : atual.campos,
                        },
                    },
                };
            }),
        );
    }

    function validate() {
        if (origem === "legado" && !dataOriginal) {
            throw new Error("Informe a data original do pedido legado.");
        }

        if (clienteNome.trim().length < 2) {
            throw new Error("Informe o nome do cliente.");
        }

        if (clienteTelefone.trim().length < 3) {
            throw new Error("Informe o telefone do cliente.");
        }

        for (const [index, item] of itens.entries()) {
            const produto = produtosMap.get(Number(item.produtoId));

            if (!produto) {
                throw new Error(`Selecione o produto do item ${index + 1}.`);
            }

            if (
                !Number.isInteger(Number(item.quantidade)) ||
                Number(item.quantidade) <= 0
            ) {
                throw new Error(`Quantidade inválida no item ${index + 1}.`);
            }

            if (
                !Number.isFinite(Number(item.precoUnitario)) ||
                Number(item.precoUnitario) < 0
            ) {
                throw new Error(`Preço inválido para ${produto.nome}.`);
            }

            if (produto.variacoes.length > 0 && !item.variacaoId) {
                throw new Error(`Selecione a variação de ${produto.nome}.`);
            }

            for (const campo of produto.campos.filter(
                (campo) => campo.ativo && campo.obrigatorio,
            )) {
                if (!String(item.campos[campo.id] ?? "").trim()) {
                    throw new Error(`Informe ${campo.nome} em ${produto.nome}.`);
                }
            }

            for (const componente of produto.componentes.filter((c) => c.ativo)) {
                const estado = item.componentes[componente.id];

                if (!estado) {
                    throw new Error(
                        `Configure ${componente.produto.nome} no kit ${produto.nome}.`,
                    );
                }

                if (
                    componente.produto.variacoes.length > 0 &&
                    !estado.variacaoId
                ) {
                    throw new Error(
                        `Selecione a variação de ${componente.produto.nome}.`,
                    );
                }

                const produtoComponente = produtosMap.get(
                    componente.prd_produto_componente_id,
                );

                for (const campo of produtoComponente?.campos.filter(
                    (campo) => campo.ativo && campo.obrigatorio,
                ) ?? []) {
                    if (!String(estado.campos[campo.id] ?? "").trim()) {
                        throw new Error(
                            `Informe ${campo.nome} em ${componente.produto.nome}.`,
                        );
                    }
                }
            }
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            validate();
            setSalvando(true);

            const response = await fetch("/api/admin/pedidos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    origem,
                    data_original: origem === "legado" ? dataOriginal : null,
                    cliente: {
                        nome: clienteNome,
                        email: clienteEmail || null,
                        telefone: clienteTelefone,
                    },
                    status_code: pedidoStatus,
                    pagamento: {
                        metodo_code: pagamentoMetodo,
                        status_code: pagamentoStatus,
                    },
                    movimentar_estoque:
                        origem === "manual" && movimentarEstoque,
                    observacao: observacao || null,
                    itens: itens.map((item) => {
                        const produto = produtosMap.get(Number(item.produtoId));

                        return {
                            produto_id: Number(item.produtoId),
                            variacao_id: item.variacaoId
                                ? Number(item.variacaoId)
                                : null,
                            quantidade: Number(item.quantidade),
                            preco_unitario: Number(item.precoUnitario),
                            campos: (produto?.campos ?? [])
                                .filter((campo) => campo.ativo)
                                .map((campo) => ({
                                    campo_id: campo.id,
                                    valor: item.campos[campo.id] ?? "",
                                }))
                                .filter((campo) => campo.valor.trim()),
                            componentes: (produto?.componentes ?? [])
                                .filter((componente) => componente.ativo)
                                .map((componente) => {
                                    const estado =
                                        item.componentes[componente.id];

                                    const produtoComponente = produtosMap.get(
                                        componente.prd_produto_componente_id,
                                    );

                                    return {
                                        componente_id: componente.id,
                                        variacao_id: estado?.variacaoId
                                            ? Number(estado.variacaoId)
                                            : null,
                                        campos: (produtoComponente?.campos ?? [])
                                            .filter((campo) => campo.ativo)
                                            .map((campo) => ({
                                                campo_id: campo.id,
                                                valor:
                                                    estado?.campos[campo.id] ?? "",
                                            }))
                                            .filter((campo) => campo.valor.trim()),
                                    };
                                }),
                        };
                    }),
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message || "Não foi possível criar o pedido.",
                );
            }

            reset();
            onClose();
            await onCreated(result.message);
        } catch (error) {
            onError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar o pedido.",
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal
            open={open}
            size="xl"
            scrollMode="body"
            title="Criar pedido"
            description="Registre uma venda manual nova ou uma venda antiga."
            onCloseAction={close}
            footer={
                <>
                    <Button
                        color="secondary"
                        variant="ghost"
                        onClick={close}
                        disabled={salvando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="pedido-manual-form"
                        disabled={salvando}
                    >
                        {salvando ? "Criando..." : "Criar pedido"}
                    </Button>
                </>
            }
        >
            <form
                id="pedido-manual-form"
                onSubmit={submit}
                style={{ display: "grid", gap: 22 }}
            >
                <section style={{ display: "grid", gap: 14 }}>
                    <strong>Tipo de registro</strong>

                    <div className="bp-grid-2">
                        <SelectMenu
                            label="Origem"
                            value={origem}
                            onChange={(value) => {
                                const next =
                                    value === "legado" ? "legado" : "manual";
                                setOrigem(next);
                                setMovimentarEstoque(next === "manual");
                                if (next === "manual") setDataOriginal("");
                            }}
                            options={[
                                { value: "manual", label: "Venda manual" },
                                { value: "legado", label: "Pedido legado" },
                            ]}
                            required
                        />

                        {origem === "legado" ? (
                            <Input
                                type="datetime-local"
                                label="Data original"
                                value={dataOriginal}
                                onChange={(event) =>
                                    setDataOriginal(event.target.value)
                                }
                                required
                            />
                        ) : (
                            <div />
                        )}
                    </div>
                </section>

                <section style={{ display: "grid", gap: 14 }}>
                    <strong>Cliente</strong>

                    <div className="bp-grid-2">
                        <Input
                            label="Nome"
                            value={clienteNome}
                            onChange={(event) =>
                                setClienteNome(event.target.value)
                            }
                            required
                        />
                        <Input
                            type="tel"
                            inputMode="numeric"
                            label="Telefone"
                            value={clienteTelefone}
                            onChange={(event) =>
                                setClienteTelefone(
                                    formatTelefone(
                                        event.target.value,
                                    ),
                                )
                            }
                            placeholder="(47) 99999-9999"
                            maxLength={15}
                            required
                        />
                    </div>

                    <Input
                        type="email"
                        label="E-mail"
                        value={clienteEmail}
                        onChange={(event) =>
                            setClienteEmail(event.target.value)
                        }
                    />
                </section>

                <section style={{ display: "grid", gap: 14 }}>
                    <div className="bp-row-between">
                        <strong>Itens</strong>
                        <Button
                            type="button"
                            color="secondary"
                            variant="soft"
                            size="sm"
                            onClick={() =>
                                setItens((current) => [...current, emptyItem()])
                            }
                        >
                            <Plus size={15} />
                            Adicionar item
                        </Button>
                    </div>

                    {itens.map((item, index) => {
                        const produto = produtosMap.get(Number(item.produtoId));
                        const componentes =
                            produto?.componentes.filter((c) => c.ativo) ?? [];

                        return (
                            <div
                                key={item.key}
                                className="bp-card bp-card-outline"
                            >
                                <div
                                    className="bp-card-body"
                                    style={{ display: "grid", gap: 14 }}
                                >
                                    <div className="bp-row-between">
                                        <strong>Item {index + 1}</strong>
                                        <Button
                                            type="button"
                                            color="danger"
                                            variant="ghost"
                                            size="sm"
                                            disabled={itens.length === 1}
                                            onClick={() =>
                                                setItens((current) =>
                                                    current.filter(
                                                        (currentItem) =>
                                                            currentItem.key !==
                                                            item.key,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 size={15} />
                                            Remover
                                        </Button>
                                    </div>

                                    <SelectMenu
                                        label="Produto"
                                        value={item.produtoId}
                                        onChange={(value) =>
                                            selectProduto(item.key, value)
                                        }
                                        options={produtos.map((produto) => ({
                                            value: produto.id,
                                            label: `${produto.nome} · ${produto.codigo}${
                                                produto.ativo ? "" : " · Inativo"
                                            }`,
                                        }))}
                                        required
                                    />

                                    {produto ? (
                                        <>
                                            <div className="bp-badge-row">
                                                <Badge
                                                    color={
                                                        produto.modalidade_venda ===
                                                        "pre_venda"
                                                            ? "warning"
                                                            : "secondary"
                                                    }
                                                >
                                                    {produto.modalidade_venda ===
                                                    "pre_venda"
                                                        ? "Pré-venda"
                                                        : "Estoque"}
                                                </Badge>
                                                {produto.eh_kit ? (
                                                    <Badge color="info">Kit</Badge>
                                                ) : null}
                                            </div>

                                            {produto.modalidade_venda ===
                                            "pre_venda" ? (
                                                <Alert color="info">
                                                    Este item não movimenta
                                                    estoque físico.
                                                </Alert>
                                            ) : null}

                                            <div className="bp-grid-2">
                                                {produto.variacoes.length > 0 ? (
                                                    <SelectMenu
                                                        label="Variação"
                                                        value={item.variacaoId}
                                                        onChange={(value) =>
                                                            updateItem(item.key, {
                                                                variacaoId:
                                                                    value,
                                                            })
                                                        }
                                                        options={produto.variacoes.map(
                                                            (variacao) => ({
                                                                value:
                                                                    variacao.id,
                                                                label: `${
                                                                    variacao.nome
                                                                }${
                                                                    variacao.ativo
                                                                        ? ""
                                                                        : " · Inativa"
                                                                }`,
                                                            }),
                                                        )}
                                                        required
                                                    />
                                                ) : (
                                                    <div />
                                                )}

                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    label="Quantidade"
                                                    value={item.quantidade}
                                                    onChange={(event) =>
                                                        updateItem(item.key, {
                                                            quantidade:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>

                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                label="Preço unitário"
                                                value={item.precoUnitario}
                                                onChange={(event) =>
                                                    updateItem(item.key, {
                                                        precoUnitario:
                                                            event.target.value,
                                                    })
                                                }
                                                helperText={`Preço atual: ${money(
                                                    produto.preco_normal,
                                                )}`}
                                                required
                                            />

                                            {produto.campos.filter(
                                                (campo) => campo.ativo,
                                            ).length > 0 ? (
                                                <div className="bp-grid-2">
                                                    {produto.campos
                                                        .filter(
                                                            (campo) =>
                                                                campo.ativo,
                                                        )
                                                        .map((campo) => (
                                                            <Input
                                                                key={campo.id}
                                                                type={
                                                                    campo.tipo ===
                                                                    "numero"
                                                                        ? "number"
                                                                        : "text"
                                                                }
                                                                label={
                                                                    campo.nome
                                                                }
                                                                value={
                                                                    item.campos[
                                                                        campo.id
                                                                    ] ?? ""
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateCampo(
                                                                        item.key,
                                                                        campo.id,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                helperText={
                                                                    campo.descricao ??
                                                                    undefined
                                                                }
                                                                required={Boolean(
                                                                    campo.obrigatorio,
                                                                )}
                                                            />
                                                        ))}
                                                </div>
                                            ) : null}

                                            {componentes.map((componente) => {
                                                const estado =
                                                    item.componentes[
                                                        componente.id
                                                    ] ?? {
                                                        variacaoId: "",
                                                        campos: {},
                                                    };

                                                const produtoComponente =
                                                    produtosMap.get(
                                                        componente.prd_produto_componente_id,
                                                    );

                                                return (
                                                    <div
                                                        key={componente.id}
                                                        className="bp-card bp-card-outline"
                                                    >
                                                        <div
                                                            className="bp-card-body"
                                                            style={{
                                                                display: "grid",
                                                                gap: 12,
                                                            }}
                                                        >
                                                            <strong>
                                                                {
                                                                    componente
                                                                        .produto
                                                                        .nome
                                                                }{" "}
                                                                ×{" "}
                                                                {
                                                                    componente.quantidade
                                                                }
                                                            </strong>

                                                            {componente.produto
                                                                .variacoes.length >
                                                            0 ? (
                                                                <SelectMenu
                                                                    label="Variação"
                                                                    value={
                                                                        estado.variacaoId
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateComponente(
                                                                            item.key,
                                                                            componente.id,
                                                                            value,
                                                                        )
                                                                    }
                                                                    options={componente.produto.variacoes.map(
                                                                        (
                                                                            variacao,
                                                                        ) => ({
                                                                            value:
                                                                                variacao.id,
                                                                            label:
                                                                                variacao.nome,
                                                                        }),
                                                                    )}
                                                                    required
                                                                />
                                                            ) : null}

                                                            {(produtoComponente
                                                                ?.campos ?? [])
                                                                .filter(
                                                                    (campo) =>
                                                                        campo.ativo,
                                                                )
                                                                .map(
                                                                    (campo) => (
                                                                        <Input
                                                                            key={
                                                                                campo.id
                                                                            }
                                                                            type={
                                                                                campo.tipo ===
                                                                                "numero"
                                                                                    ? "number"
                                                                                    : "text"
                                                                            }
                                                                            label={
                                                                                campo.nome
                                                                            }
                                                                            value={
                                                                                estado
                                                                                    .campos[
                                                                                    campo
                                                                                        .id
                                                                                ] ??
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateComponente(
                                                                                    item.key,
                                                                                    componente.id,
                                                                                    undefined,
                                                                                    {
                                                                                        id: campo.id,
                                                                                        value: event
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            required={Boolean(
                                                                                campo.obrigatorio,
                                                                            )}
                                                                        />
                                                                    ),
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section style={{ display: "grid", gap: 14 }}>
                    <strong>Pagamento e situação</strong>

                    <div className="bp-grid-2">
                        <SelectMenu
                            label="Método de pagamento"
                            value={pagamentoMetodo}
                            onChange={setPagamentoMetodo}
                            options={[
                                { value: "pix_manual", label: "PIX manual" },
                                { value: "cartao", label: "Cartão" },
                                { value: "dinheiro", label: "Dinheiro" },
                            ]}
                            required
                        />

                        <SelectMenu
                            label="Status do pagamento"
                            value={pagamentoStatus}
                            onChange={(value) => {
                                const next = value as PagamentoStatus;
                                setPagamentoStatus(next);
                                setPedidoStatus(defaultPedidoStatus(next));
                            }}
                            options={[
                                { value: "pendente", label: "Pendente" },
                                { value: "aprovado", label: "Aprovado" },
                                { value: "recusado", label: "Recusado" },
                                { value: "cancelado", label: "Cancelado" },
                                { value: "estornado", label: "Estornado" },
                                { value: "expirado", label: "Expirado" },
                            ]}
                            required
                        />
                    </div>

                    <SelectMenu
                        label="Status inicial do pedido"
                        value={pedidoStatus}
                        onChange={setPedidoStatus}
                        options={allowedPedidoStatuses(pagamentoStatus).map(
                            ([value, label]) => ({ value, label }),
                        )}
                        required
                    />
                </section>

                <section style={{ display: "grid", gap: 14 }}>
                    <strong>Estoque e observação</strong>

                    <label className="bp-check">
                        <input
                            type="checkbox"
                            checked={
                                origem === "manual" && movimentarEstoque
                            }
                            disabled={origem === "legado"}
                            onChange={(event) =>
                                setMovimentarEstoque(event.target.checked)
                            }
                        />
                        <span>Movimentar estoque com este pedido</span>
                    </label>

                    {origem === "legado" ? (
                        <Alert color="warning">
                            Pedido legado nunca altera o estoque atual.
                        </Alert>
                    ) : null}

                    <Textarea
                        label="Observação"
                        value={observacao}
                        onChange={(event) =>
                            setObservacao(event.target.value)
                        }
                        rows={3}
                    />
                </section>

                <div className="bp-card bp-card-soft">
                    <div className="bp-card-body">
                        <div className="bp-row-between">
                            <strong>Total do pedido</strong>
                            <strong style={{ fontSize: 22 }}>
                                {money(total)}
                            </strong>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
