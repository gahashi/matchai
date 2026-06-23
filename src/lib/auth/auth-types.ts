export type AuthUser = {
    id: number;
    nome: string;
    nickname: string;
    email: string;
    avatar_url?: string | null;
};

export type AuthSession = {
    user: AuthUser;
    atl_atletica_id?: number | null;
};

export type PermissionCheckResult = {
    allowed: boolean;
    reason?: "not_authenticated" | "missing_permission";
};