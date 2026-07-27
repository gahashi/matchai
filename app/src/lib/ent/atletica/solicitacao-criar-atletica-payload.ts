export type CriarAtleticaPoloPayload = {
    id: number;
    principal: boolean;
};

export type CriarAtleticaPayload = {
    atletica: {
        nome: string;
        apelido: string;
        sigla: string;
        slug: string;
        mascote: string;
        descricao: string | null;
        instituicaoId: number;
        polos: CriarAtleticaPoloPayload[];
        cursoIds: number[];
    };
    gestao: {
        nome: string;
        inicioAt: string | Date;
        fimAt: string | Date | null;
        observacao: string | null;
    };
};

export type MontarCriarAtleticaPayloadInput = {
    nome: string;
    apelido: string;
    sigla: string;
    slug: string;
    mascote?: string;
    descricao?: string;
    instituicaoId: number;
    poloIds: number[];
    cursoIds: number[];
    gestaoNome?: string;
    gestaoInicioAt?: string | Date;
    gestaoFimAt?: string | Date | null;
    gestaoObservacao?: string | null;
};

export function slugifyCriarAtletica(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function normalizarCriarAtleticaIds(
    values: unknown
): number[] {
    if (!Array.isArray(values)) {
        return [];
    }

    return Array.from(
        new Set(
            values
                .map(Number)
                .filter(
                    (id) =>
                        Number.isInteger(id) &&
                        id > 0
                )
        )
    );
}

export function normalizarCriarAtleticaDate(
    value?: string | Date | null
) {
    if (!value) {
        return null;
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function normalizarCriarAtleticaPolos(
    polos: unknown
) {
    if (!Array.isArray(polos) || polos.length === 0) {
        throw new Error(
            "Informe pelo menos um polo vinculado à atlética."
        );
    }

    const polosNormalizados =
        polos.map((value) => {
            const polo =
                value &&
                typeof value === "object"
                    ? (value as {
                        id?: unknown;
                        principal?: unknown;
                    })
                    : null;

            return {
                id: Number(polo?.id),
                principal:
                    polo?.principal === true,
            };
        });

    if (
        polosNormalizados.some(
            (polo) =>
                !Number.isInteger(polo.id) ||
                polo.id <= 0
        )
    ) {
        throw new Error(
            "A lista de polos contém um identificador inválido."
        );
    }

    const ids = polosNormalizados.map(
        (polo) => polo.id
    );

    if (new Set(ids).size !== ids.length) {
        throw new Error(
            "A lista de polos possui registros duplicados."
        );
    }

    const polosPrincipais =
        polosNormalizados.filter(
            (polo) => polo.principal
        );

    if (polosPrincipais.length !== 1) {
        throw new Error(
            "A atlética deve possuir exatamente um polo principal."
        );
    }

    return {
        polos: polosNormalizados,
        poloIds: ids,
        poloPrincipalId: polosPrincipais[0].id,
    };
}

export function parseCriarAtleticaPayload(
    value: unknown
): CriarAtleticaPayload | null {
    let parsed = value;

    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        } catch {
            return null;
        }
    }

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    const payload =
        parsed as Partial<CriarAtleticaPayload>;

    if (
        !payload.atletica ||
        typeof payload.atletica !== "object" ||
        !payload.gestao ||
        typeof payload.gestao !== "object"
    ) {
        return null;
    }

    return payload as CriarAtleticaPayload;
}

export function validarCriarAtleticaPayload(
    value: unknown
) {
    const payload =
        parseCriarAtleticaPayload(value);

    if (!payload) {
        throw new Error(
            "Payload da solicitação de criação da atlética inválido."
        );
    }

    const nome = payload.atletica.nome?.trim();
    const apelido =
        payload.atletica.apelido?.trim();
    const sigla = payload.atletica.sigla
        ?.trim()
        .toUpperCase();

    const slug = slugifyCriarAtletica(
        payload.atletica.slug ||
        apelido ||
        sigla ||
        nome ||
        ""
    );

    const instituicaoId = Number(
        payload.atletica.instituicaoId
    );

    const cursoIds =
        normalizarCriarAtleticaIds(
            payload.atletica.cursoIds
        );

    const polosNormalizados =
        normalizarCriarAtleticaPolos(
            payload.atletica.polos
        );

    if (!nome) {
        throw new Error(
            "Nome da atlética não informado no payload da solicitação."
        );
    }

    if (!apelido) {
        throw new Error(
            "Apelido da atlética não informado no payload da solicitação."
        );
    }

    if (!sigla) {
        throw new Error(
            "Sigla da atlética não informada no payload da solicitação."
        );
    }

    if (!slug) {
        throw new Error(
            "Não foi possível gerar o slug da atlética."
        );
    }

    if (
        !Number.isInteger(instituicaoId) ||
        instituicaoId <= 0
    ) {
        throw new Error(
            "Instituição da atlética não informada no payload da solicitação."
        );
    }

    if (cursoIds.length === 0) {
        throw new Error(
            "Informe pelo menos um curso vinculado à atlética."
        );
    }

    return {
        payload,
        nome,
        apelido,
        sigla,
        slug,
        mascote:
            payload.atletica.mascote?.trim() ||
            "Mascote não informado",
        descricao:
            payload.atletica.descricao ?? null,
        instituicaoId,
        cursoIds,
        ...polosNormalizados,
    };
}

export function montarCriarAtleticaPayload({
                                               nome,
                                               apelido,
                                               sigla,
                                               slug,
                                               mascote = "",
                                               descricao = "",
                                               instituicaoId,
                                               poloIds,
                                               cursoIds,
                                               gestaoNome = "",
                                               gestaoInicioAt = new Date().toISOString(),
                                               gestaoFimAt = null,
                                               gestaoObservacao = null,
                                           }: MontarCriarAtleticaPayloadInput): CriarAtleticaPayload {
    const nomeNormalizado = nome.trim();
    const apelidoNormalizado = apelido.trim();
    const siglaNormalizada =
        sigla.trim().toUpperCase();

    const slugNormalizado =
        slugifyCriarAtletica(slug);

    const polosNormalizados =
        normalizarCriarAtleticaIds(poloIds);

    const cursosNormalizados =
        normalizarCriarAtleticaIds(cursoIds);

    return {
        atletica: {
            nome: nomeNormalizado,
            apelido: apelidoNormalizado,
            sigla: siglaNormalizada,
            slug: slugNormalizado,
            mascote:
                mascote.trim() ||
                "Mascote não informado",
            descricao:
                descricao.trim() || null,
            instituicaoId: Number(
                instituicaoId
            ),
            polos: polosNormalizados.map(
                (id, index) => ({
                    id,
                    principal: index === 0,
                })
            ),
            cursoIds: cursosNormalizados,
        },
        gestao: {
            nome:
                gestaoNome.trim() ||
                `Gestão ${new Date().getFullYear()}`,
            inicioAt: gestaoInicioAt,
            fimAt: gestaoFimAt,
            observacao:
                gestaoObservacao ??
                "Gestão inicial informada na solicitação de criação da atlética.",
        },
    };
}