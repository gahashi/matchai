import { EntityThemeInput, EntityThemeStyle } from "@/lib/theme/theme-types";

const DEFAULT_THEME = {
    primary: "#f4f4f5",
    secondary: "#242938",
    background: "#0b0c12",
    text: "#f7f7f8",
};

function isHexColor(value?: string | null) {
    return /^#([0-9a-fA-F]{6})$/.test(value ?? "");
}

function safeColor(value: string | null | undefined, fallback: string) {
    return isHexColor(value) ? value! : fallback;
}

function hexToRgb(hex: string) {
    const clean = hex.replace("#", "");

    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number) {
    return `#${[r, g, b]
        .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
        .join("")}`;
}

function alpha(hex: string, opacity: number) {
    const { r, g, b } = hexToRgb(hex);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function mix(hex: string, target: string, amount: number) {
    const baseRgb = hexToRgb(hex);
    const targetRgb = hexToRgb(target);

    const r = Math.round(baseRgb.r + (targetRgb.r - baseRgb.r) * amount);
    const g = Math.round(baseRgb.g + (targetRgb.g - baseRgb.g) * amount);
    const b = Math.round(baseRgb.b + (targetRgb.b - baseRgb.b) * amount);

    return rgbToHex(r, g, b);
}

function getContrastColor(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 160 ? "#0b0c12" : "#ffffff";
}

export function buildEntityThemeStyle(
    tema: EntityThemeInput | null | undefined
): EntityThemeStyle {
    const primary = safeColor(tema?.cor_primaria, DEFAULT_THEME.primary);
    const secondary = safeColor(tema?.cor_secundaria, DEFAULT_THEME.secondary);
    const background = safeColor(tema?.cor_fundo, DEFAULT_THEME.background);
    const text = safeColor(tema?.cor_texto, DEFAULT_THEME.text);

    const surface = mix(background, "#ffffff", 0.04);
    const surface2 = mix(background, "#ffffff", 0.08);
    const surface3 = mix(background, "#ffffff", 0.12);
    const card = mix(background, "#ffffff", 0.10);
    const cardStrong = mix(background, "#ffffff", 0.16);

    return {
        "--color-background": background,
        "--color-background-2": mix(background, "#000000", 0.10),
        "--color-background-glow": alpha(primary, 0.14),

        "--color-surface": surface,
        "--color-surface-2": surface2,
        "--color-surface-3": surface3,

        "--color-card": card,
        "--color-card-strong": cardStrong,

        "--color-border": alpha(text, 0.18),
        "--color-border-soft": alpha(text, 0.10),
        "--color-border-strong": alpha(text, 0.32),

        "--color-primary": primary,
        "--color-primary-hover": mix(primary, "#ffffff", 0.12),
        "--color-primary-soft": alpha(primary, 0.14),
        "--color-primary-border": alpha(primary, 0.32),
        "--color-primary-foreground": getContrastColor(primary),

        "--color-secondary": secondary,
        "--color-secondary-hover": mix(secondary, "#ffffff", 0.10),
        "--color-secondary-foreground": getContrastColor(secondary),

        "--color-text": text,
        "--color-text-muted": alpha(text, 0.72),
        "--color-text-soft": alpha(text, 0.48),
        "--color-text-disabled": alpha(text, 0.30),
    };
}