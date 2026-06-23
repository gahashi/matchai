type AvatarProps = {
    name: string;
    imageUrl?: string | null;
};

export function Avatar({ name, imageUrl }: AvatarProps) {
    const initials = name
        .split(" ")
        .map((item) => item[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div
            style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                background: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                overflow: "hidden",
            }}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : (
                initials
            )}
        </div>
    );
}