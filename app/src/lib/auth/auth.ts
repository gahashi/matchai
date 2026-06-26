import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    appName: "Brava Pass",
    baseURL: process.env.BETTER_AUTH_URL,

    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),

    emailAndPassword: {
        enabled: true,
    },

    user: {
        additionalFields: {
            sysUsuarioId: {
                type: "number",
                required: true,
                input: true,
            },
        },
    },

    plugins: [
        nextCookies(),
    ],
});