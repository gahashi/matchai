export type EntityThemeInput = {
    cor_primaria?: string | null;
    cor_secundaria?: string | null;
    cor_fundo?: string | null;
    cor_texto?: string | null;
};

export type EntityThemeStyle = React.CSSProperties & Record<`--${string}`, string>;