import { NextRequest, NextResponse } from "next/server";

import { storageService } from "@/lib/storage/storage-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Nenhum arquivo enviado. Use o campo 'file'.",
                },
                { status: 400 },
            );
        }

        const uploadedFile = await storageService.uploadPublicImage({
            file,
            folder: "dev/storage-test",
            filenamePrefix: "teste",
        });

        return NextResponse.json({
            success: true,
            file: uploadedFile,
        });
    } catch (error) {
        console.error("[storage-test]", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Erro ao salvar arquivo.",
            },
            { status: 500 },
        );
    }
}