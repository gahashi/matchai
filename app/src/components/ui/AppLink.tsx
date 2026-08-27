import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { UiColor, UiSize, UiVariant } from "@/components/ui/ui-types";

type AppLinkVariant = UiVariant | "text";

type AppLinkProps = LinkProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    color?: UiColor;
    variant?: AppLinkVariant;
    size?: UiSize;
    fullWidth?: boolean;
};

export function AppLink({
                            children,
                            className,
                            color = "primary",
                            variant = "text",
                            size = "md",
                            fullWidth = false,
                            ...props
                        }: AppLinkProps) {
    return (
        <Link
            className={cn(
                "bp-link",
                `bp-link-${variant}`,
                `bp-link-${size}`,
                `bp-ui-${color}`,
                fullWidth && "bp-link-full",
                className
            )}
            {...props}
        >
            {children}
        </Link>
    );
}