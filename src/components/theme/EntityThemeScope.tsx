import { HTMLAttributes, ReactNode } from "react";

import { buildEntityThemeStyle } from "@/lib/theme/build-entity-theme-style";
import { EntityThemeInput } from "@/lib/theme/theme-types";
import { cn } from "@/lib/utils";

type EntityThemeScopeProps = HTMLAttributes<HTMLDivElement> & {
    tema?: EntityThemeInput | null;
    children: ReactNode;
};

export function EntityThemeScope({
                                     tema,
                                     children,
                                     className,
                                     style,
                                     ...props
                                 }: EntityThemeScopeProps) {
    return (
        <div
            data-theme="entity"
            className={cn("bp-entity-theme", className)}
            style={{
                ...buildEntityThemeStyle(tema),
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    );
}