import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Brava Pass",
    description: "SaaS para gestão de atléticas universitárias",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
        <body>{children}</body>
        </html>
    );
}