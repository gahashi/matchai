"use client";

import {
    ArrowLeft,
    ArrowLeftRight,
} from "lucide-react";

import {
    usePathname,
} from "next/navigation";

import {
    AppLink,
} from "@/components/ui/AppLink";


type ParceiroContextNavProps = {
    slug: string;
};


export function ParceiroContextNav({
                                       slug,
                                   }: ParceiroContextNavProps) {
    const pathname =
        usePathname();

    const baseHref =
        `/parceiro/${slug}`;

    const naRaizDoParceiro =
        pathname ===
        baseHref;


    return (
        <div
            className="bp-action-row bp-mb-5"
            style={{
                justifyContent:
                    "space-between",

                alignItems:
                    "center",

                flexWrap:
                    "wrap",
            }}
        >
            <AppLink
                href={
                    naRaizDoParceiro
                        ? "/parceiro"
                        : baseHref
                }
                color="secondary"
                variant="ghost"
            >
                <ArrowLeft
                    size={16}
                />

                {naRaizDoParceiro
                    ? "Meus parceiros"
                    : "Perfil do parceiro"}
            </AppLink>

            {!naRaizDoParceiro ? (
                <AppLink
                    href="/parceiro"
                    color="secondary"
                    variant="ghost"
                >
                    <ArrowLeftRight
                        size={16}
                    />

                    Trocar parceiro
                </AppLink>
            ) : null}
        </div>
    );
}
