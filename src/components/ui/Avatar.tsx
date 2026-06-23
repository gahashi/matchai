import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
    name: string;
    imageUrl?: string | null;
    size?: AvatarSize;
};

const avatarSizes: Record<AvatarSize, number> = {
    sm: 32,
    md: 38,
    lg: 48,
};

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((item) => item[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function Avatar({
                           name,
                           imageUrl,
                           size = "md",
                           className,
                           ...props
                       }: AvatarProps) {
    const dimension = avatarSizes[size];
    const initials = getInitials(name) || "BP";

    return (
        <div
            className={cn("bp-avatar", className)}
            title={name}
            style={{
                width: dimension,
                height: dimension,
                borderRadius: size === "lg" ? 18 : 14,
                background: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-border)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: size === "sm" ? 11 : size === "lg" ? 15 : 13,
                overflow: "hidden",
                textTransform: "uppercase",
            }}
            {...props}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt={name}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : (
                initials
            )}
        </div>
    );
}