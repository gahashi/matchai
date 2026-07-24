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
        path: "/ent/atletica",
        access: "auth",
    },
    {
        path: "/ent/atletica/criar",
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
        path: "/ent/atletica/tema",
        access: "permission",
        permissions: ["tema.visualizar"],
    },
    {
        path: "/ent/atletica/tema/editar",
        access: "permission",
        permissions: ["tema.editar"],
    },
    {
        path: "/ent/membro",
        access: "permission",
        permissions: ["membro.visualizar"],
    },
    {
        path: "/ent/membro/novo",
        access: "permission",
        permissions: ["membro.criar"],
    },
    {
        path: "/ent/atletica/configuracao",
        access: "permission",
        permissions: ["atletica.editar"],
    },

];