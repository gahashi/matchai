import { Building2 } from "lucide-react";

import {
    Avatar,
} from "@/components/ui/Avatar";
import {
    Badge,
} from "@/components/ui/Badge";
import {
    EntidadeAcessivel,
} from "@/lib/ent/contexto-entidade";

type EntidadeContextHeaderProps = {
    entidade: EntidadeAcessivel;
};

function getBadgeColor(
    color?: string | null
) {
    if (
        color === "primary" ||
        color === "secondary" ||
        color === "success" ||
        color === "warning" ||
        color === "danger" ||
        color === "info"
    ) {
        return color;
    }

    return "secondary";
}

export function EntidadeContextHeader({
                                          entidade,
                                      }: EntidadeContextHeaderProps) {
    const nomeExibicao =
        entidade.apelido ||
        entidade.nome;

    return (
        <section
            className="bp-row-between bp-mb-5"
            aria-label="Entidade atual"
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    minWidth: 0,
                }}
            >
                <Avatar
                    name={nomeExibicao}
                    src={entidade.logoUrl}
                    size="lg"
                />

                <div style={{ minWidth: 0 }}>
                    <div className="bp-badge-row bp-mb-4">
                        <Badge
                            color="primary"
                            variant="soft"
                        >
                            <Building2
                                size={13}
                            />
                            {
                                entidade
                                    .tipo.nome
                            }
                        </Badge>

                        <Badge
                            color={getBadgeColor(
                                entidade
                                    .status
                                    .color
                            )}
                            variant="soft"
                        >
                            {
                                entidade
                                    .status.nome
                            }
                        </Badge>

                        {entidade.vinculo
                            ?.tipoNome ? (
                            <Badge
                                color="secondary"
                                variant="outline"
                            >
                                {
                                    entidade
                                        .vinculo
                                        .tipoNome
                                }
                            </Badge>
                        ) : null}
                    </div>

                    <strong
                        style={{
                            display: "block",
                            color:
                                "var(--color-text)",
                            fontSize: 18,
                            lineHeight: 1.2,
                        }}
                    >
                        {nomeExibicao}
                    </strong>

                    <span
                        style={{
                            display: "block",
                            marginTop: 4,
                            color:
                                "var(--color-text-muted)",
                            fontSize: 13,
                        }}
                    >
                        {entidade.sigla}
                        {" · "}
                        {entidade.instituicao
                                .abreviacao ||
                            entidade
                                .instituicao
                                .nome}
                    </span>
                </div>
            </div>
        </section>
    );
}