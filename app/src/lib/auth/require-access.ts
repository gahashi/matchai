import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getRouteAccessRule } from "@/lib/auth/route-access";
import { userHasAnyPermission } from "@/lib/auth/permissions";
import { AuthSession } from "@/lib/auth/auth-types";
function buildLoginRedirect(pathname: string) {
    return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export async function requirePageAccess(pathname: string) {
    const rule = getRouteAccessRule(pathname);
    const session = await getAuthSession();

    if (rule.access === "public") {
        return {
            session,
            rule,
        };
    }

    if (rule.access === "guest") {
        if (session) {
            redirect("/");
        }

        return {
            session,
            rule,
        };
    }

    if (!session) {
        redirect(buildLoginRedirect(pathname));
    }

    if (rule.access === "permission") {
        const permissions = rule.permissions ?? [];

        if (permissions.length === 0) {
            redirect("/sem-permissao");
        }

        const allowed = await userHasAnyPermission(session, permissions);

        if (!allowed) {
            redirect("/sem-permissao");
        }
    }

    return {
        session,
        rule,
    };
}
export async function requireAuthPageAccess(pathname: string): Promise<{
    session: AuthSession;
    rule: ReturnType<typeof getRouteAccessRule>;
}> {
    const access = await requirePageAccess(pathname);

    if (!access.session) {
        redirect(buildLoginRedirect(pathname));
    }

    return {
        session: access.session,
        rule: access.rule,
    };
}