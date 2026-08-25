import type {
    Metadata,
} from "next";

import {
    AnalyticsTracker,
} from "@/components/analytics/AnalyticsTracker";

import "./globals.css";

export const metadata: Metadata = {
    title:
        "Brava Pass",

    description:
        "SaaS para gestão de atléticas universitárias",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children:
        React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
        <body>
        <AnalyticsTracker />

        {children}
        </body>
        </html>
    );
}