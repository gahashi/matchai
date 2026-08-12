export type AuthUser = {
    id: number;
    nome: string;
    nickname: string;
    email: string;
    avatar_url?: string | null;

    sys_usuario_tipo: {
        codigo: string;
        nome: string;
    };
};

export type AuthSession = {
    user: AuthUser;
};

export type PermissionCheckResult = {
    allowed: boolean;
    reason?: "not_authenticated" | "missing_permission";
};