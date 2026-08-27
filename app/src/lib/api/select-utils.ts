import { NextResponse } from "next/server";

export const SELECT_DEFAULT_LIMIT = 15;
export const SELECT_MIN_LIMIT = 5;
export const SELECT_MAX_LIMIT = 30;

export function normalizarSelectLimit(value: string | null) {
    const limit = Number(value);

    if (!Number.isInteger(limit)) {
        return SELECT_DEFAULT_LIMIT;
    }

    if (limit < SELECT_MIN_LIMIT) {
        return SELECT_MIN_LIMIT;
    }

    if (limit > SELECT_MAX_LIMIT) {
        return SELECT_MAX_LIMIT;
    }

    return limit;
}

export function normalizarIdFiltro(value: string | null) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

export function selectSuccess<T>(items: T[]) {
    return NextResponse.json({
        ok: true,
        items,
    });
}

export function selectError(message: string, status = 500) {
    return NextResponse.json(
        {
            ok: false,
            items: [],
            message,
        },
        {
            status,
        },
    );
}
