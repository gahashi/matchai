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
        path: "/sys/inbox",
        access: "auth",
    },
    {
        path: "/atl/atletica",
        access: "auth",
    },
    {
        path: "/atl/atletica/criar",
        access: "auth",
    },

    /**
     * PERMISSION
     * Precisa estar logado e ter permissão.
     */
    {
        path: "/sys/solicitacao",
        access: "permission",
        permissions: ["solicitacao.visualizar"],
    },
    {
        path: "/atl/tema",
        access: "permission",
        permissions: ["tema.visualizar"],
    },
    {
        path: "/atl/tema/editar",
        access: "permission",
        permissions: ["tema.editar"],
    },
    {
        path: "/atl/membro",
        access: "permission",
        permissions: ["membro.visualizar"],
    },
    {
        path: "/atl/membro/novo",
        access: "permission",
        permissions: ["membro.criar"],
    },
    {
        path: "/atl/atletica/configuracao",
        access: "permission",
        permissions: ["atletica.editar"],
    },

];