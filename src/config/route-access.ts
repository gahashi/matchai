export type RouteAccessType = "public" | "guest" | "auth" | "permission";

export type RouteAccessRule = {
    path: string;
    access: RouteAccessType;
    permissions?: string[];
};

export const routeAccessRules: RouteAccessRule[] = [
    /**
     * PUBLIC
     * Qualquer pessoa pode acessar, logada ou não.
     */
    {
        path: "/",
        access: "auth",
    },
    {
        path: "/atletica",
        access: "public",
    },

    /**
     * GUEST
     * Apenas pessoas sem login.
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
     * Qualquer pessoa logada.
     */
    {
        path: "/perfil",
        access: "auth",
    },
    {
        path: "/teste-select",
        access: "auth",
    },

    /**
     * PERMISSION
     * Precisa estar logado e ter permissão.
     */
    {
        path: "/tema",
        access: "permission",
        permissions: ["tema.visualizar"],
    },
    {
        path: "/tema/editar",
        access: "permission",
        permissions: ["tema.editar"],
    },
    {
        path: "/membros",
        access: "permission",
        permissions: ["membro.visualizar"],
    },
    {
        path: "/membros/novo",
        access: "permission",
        permissions: ["membro.criar"],
    },
    {
        path: "/configuracoes/atletica",
        access: "permission",
        permissions: ["atletica.editar"],
    },
];