type SkeletonProps = {
    width?: number | string;
    height?: number | string;
};

export function Skeleton({ width = "100%", height = 16 }: SkeletonProps) {
    return <div className="bp-skeleton" style={{ width, height }} />;
}