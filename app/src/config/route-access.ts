export type RouteAccessType =
    | "public"
    | "guest"
    | "auth"
    | "admin"
    | "permission";

export type RouteAccessRule = {
    path: string;
    access: RouteAccessType;
    permissions?: string[];
};

export const routeAccessRules: RouteAccessRule[] = [
    {
        path: "/",
        access: "public",
    },
    {
        path: "/carrinho",
        access: "public",
    },
    {
        path: "/checkout",
        access: "public",
    },
    {
        path: "/acompanhar-pedido",
        access: "public",
    },
    {
        path: "/cardapio",
        access: "public",
    },
    {
        path: "/tv",
        access: "public",
    },
    {
        path: "/login",
        access: "guest",
    },
    {
        path: "/cadastro",
        access: "guest",
    },
    {
        path: "/recuperar-senha",
        access: "guest",
    },
    {
        path: "/perfil",
        access: "auth",
    },
    {
        path: "/admin",
        access: "admin",
    },
];
