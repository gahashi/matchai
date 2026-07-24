export type AuthUser = {
    id: number;
    nome: string;
    nickname: string;
    email: string;
    avatar_url?: string | null;
};

export type AuthSession = {
    user: AuthUser;
    ent_entidade_id?: number | null;
};

export type PermissionCheckResult = {
    allowed: boolean;
    reason?: "not_authenticated" | "missing_permission";
};