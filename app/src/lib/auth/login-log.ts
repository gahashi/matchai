import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type LoginLogParams = {
    request: NextRequest;
    evento: "register_success" | "login_success" | "login_failed" | "logout";
    status: "success" | "failed";
    sysUsuarioId?: number | null;
    email?: string | null;
    errorMessage?: string | null;
    metadataText?: string | null;
};

function getRequestIp(request: NextRequest) {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null
    );
}

function getDeviceText(userAgent: string | null) {
    if (!userAgent) {
        return null;
    }

    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
        return "Dispositivo móvel";
    }

    if (/windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/macintosh|mac os/i.test(userAgent)) {
        return "macOS";
    }

    if (/linux/i.test(userAgent)) {
        return "Linux";
    }

    return "Dispositivo desconhecido";
}

export async function createAuthLoginLog({
                                             request,
                                             evento,
                                             status,
                                             sysUsuarioId,
                                             email,
                                             errorMessage,
                                             metadataText,
                                         }: LoginLogParams) {
    const userAgent = request.headers.get("user-agent");

    await prisma.sysAuthLoginLog.create({
        data: {
            sys_usuario_id: sysUsuarioId ?? null,
            email: email ?? null,
            evento,
            status,
            ip_address: getRequestIp(request),
            user_agent: userAgent,
            device_text: getDeviceText(userAgent),
            location_text: null,
            error_message: errorMessage ?? null,
            metadata_text: metadataText ?? null,
            created_at: new Date(),
        },
    });
}