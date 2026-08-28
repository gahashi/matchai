import type {
    Metadata,
} from "next";

import {
    notFound,
} from "next/navigation";

import {
    CardapioView,
} from "@/components/public/CardapioView";

import {
    cardapioPublicService,
} from "@/lib/crd/cardapio-public-service";
import {
    eventoPublicService,
} from "@/lib/cad/evento-public-service";
import {
    getAuthSession,
} from "@/lib/auth/session";

export const dynamic =
    "force-dynamic";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    const {
        slug,
    } =
        await params;

    const parceiro =
        await cardapioPublicService
            .getByParceiroSlug(
                slug,
            );

    if (!parceiro) {
        return {
            title:
                "Cardápio não encontrado",
        };
    }

    return {
        title:
            `${parceiro.nome} | Cardápio`,

        description:
            parceiro.descricao ??
            `Confira o cardápio de ${parceiro.nome}.`,
    };
}


export default async function CardapioPublicPage({
                                                     params,
                                                 }: PageProps) {
    const {
        slug,
    } =
        await params;

    const session =
        await getAuthSession();

    const parceiro =
        await cardapioPublicService
            .getByParceiroSlug(
                slug,
            );

    if (!parceiro) {
        notFound();
    }
    const eventos =
        await eventoPublicService
            .listPartnerEvents({
                parceiroId:
                parceiro.id,

                limit:
                    8,
            });

    return (
        <CardapioView
            parceiro={
                parceiro
            }
            eventos={
                eventos
            }
            navigationUser={{
                isAuthenticated:
                    Boolean(
                        session,
                    ),

                isAdmin:
                    session
                        ?.user
                        .sys_usuario_tipo
                        .codigo ===
                    "admin",
            }}
        />
    );
}
