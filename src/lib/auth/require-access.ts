import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getRouteAccessRule } from "@/lib/auth/route-access";
import { userHasAnyPermission } from "@/lib/auth/permissions";

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
        redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    if (rule.access === "permission") {
        const permissions = rule.permissions ?? [];

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