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
    /**
     * PUBLIC
     * Qualquer pessoa pode acessar.
     */
    {
        path: "/",
        access: "public",
    },

    /**
     * GUEST
     * Apenas usuário não autenticado.
     */
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

    /**
     * AUTH
     * Qualquer usuário autenticado.
     */
    {
        path: "/perfil",
        access: "auth",
    },

    /**
     * ADMIN
     * Apenas usuário do tipo administrador.
     */
    {
        path: "/admin",
        access: "admin",
    },
];