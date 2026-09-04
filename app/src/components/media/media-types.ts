export type ManagedImageSource = "existing" | "new";

export type ManagedImage = {
    key: string;
    source: ManagedImageSource;
    previewUrl: string;
    file?: File;
    existingId?: number;
    sysArquivoId?: number;
    originalName?: string;
};

export type ImageCropResult = {
    file: File;
    previewUrl: string;
};

export type ImageManagerProps = {
    images: ManagedImage[];
    onChange: (images: ManagedImage[]) => void;
    onRemoveExisting?: (image: ManagedImage) => void;
    aspect?: number;
    maxImages?: number;
    maxSizeBytes?: number;
    accept?: string;
    disabled?: boolean;
    showGrid?: boolean;
    firstIsPrimary?: boolean;
    label?: string;
    helperText?: string;
};
