import {
    routeAccessRules,
    RouteAccessRule,
} from "@/config/route-access";

export function isRouteMatch(pathname: string, rulePath: string) {
    if (rulePath === "/") {
        return pathname === "/";
    }

    return pathname === rulePath || pathname.startsWith(`${rulePath}/`);
}

export function getRouteAccessRule(pathname: string): RouteAccessRule {
    const orderedRules = [...routeAccessRules].sort(
        (a, b) => b.path.length - a.path.length
    );

    const matchedRule = orderedRules.find((rule) =>
        isRouteMatch(pathname, rule.path)
    );

    return (
        matchedRule ?? {
            path: pathname,
            access: "auth",
        }
    );
}