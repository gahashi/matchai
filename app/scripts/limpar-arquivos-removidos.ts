import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { arquivoService } from "@/lib/storage/arquivo-service";

function getNumberArg(name: string, defaultValue: number): number {
    const arg = process.argv.find((item) => item.startsWith(`--${name}=`));

    if (!arg) {
        return defaultValue;
    }

    const value = Number(arg.split("=")[1]);

    if (!Number.isFinite(value)) {
        throw new Error(`Argumento inválido: --${name}`);
    }

    return value;
}

function hasFlag(name: string): boolean {
    return process.argv.includes(`--${name}`);
}

async function main() {
    const diasRetencao = getNumberArg("dias", 7);
    const limit = getNumberArg("limit", 100);
    const dryRun = hasFlag("dry-run");

    console.log("[arquivos:limpar] Iniciando limpeza de arquivos removidos...");
    console.log("[arquivos:limpar] Configuração:", {
        diasRetencao,
        limit,
        dryRun,
    });

    const resultado = await arquivoService.limparArquivosRemovidos({
        diasRetencao,
        limit,
        dryRun,
    });

    console.log("[arquivos:limpar] Resultado:", resultado);

    if (resultado.falhas > 0) {
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error("[arquivos:limpar] Erro fatal:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });