"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

type PerfilUsuario = {
    id: number;
    nome: string;
    nickname: string;
    email: string;
    telefone: string | null;
    codigo_aluno: string | null;
    documento: string | null;
    avatar_url: string | null;
    ativo: number;
    perfil_completo: number;
    email_verificado_at: Date | string | null;
    ultimo_login_at: Date | string | null;
    created_at: Date | string | null;
};

type ProfileClientProps = {
    usuario: PerfilUsuario;
};

function formatDate(value: Date | string | null) {
    if (!value) return "Não informado";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

async function cropImageToSquare(file: File, zoom: number): Promise<File> {
    const imageUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageUrl;
        });

        const outputSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Não foi possível preparar o recorte da imagem.");
        }

        const sourceSize = Math.min(image.width, image.height) / zoom;
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;

        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            outputSize,
            outputSize,
        );

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!blob) {
            throw new Error("Não foi possível gerar a imagem recortada.");
        }

        return new File([blob], "avatar.jpg", {
            type: "image/jpeg",
        });
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

export default function ProfileClient({ usuario }: ProfileClientProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [nome, setNome] = useState(usuario.nome);
    const [nickname, setNickname] = useState(usuario.nickname);
    const [telefone, setTelefone] = useState(usuario.telefone ?? "");

    const [avatarUrl, setAvatarUrl] = useState(usuario.avatar_url);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
    const [avatarZoom, setAvatarZoom] = useState(1);

    const [salvandoDados, setSalvandoDados] = useState(false);
    const [salvandoAvatar, setSalvandoAvatar] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const iniciais = useMemo(() => {
        return nome
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0]?.toUpperCase())
            .join("");
    }, [nome]);

    function handleSelectAvatar(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Selecione uma imagem válida.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5MB.");
            return;
        }

        if (selectedPreviewUrl) {
            URL.revokeObjectURL(selectedPreviewUrl);
        }

        setSelectedFile(file);
        setSelectedPreviewUrl(URL.createObjectURL(file));
        setAvatarZoom(1);
    }

    async function handleSalvarDados(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSalvandoDados(true);

            const response = await fetch("/api/sys/usuarios/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    nickname,
                    telefone,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Erro ao atualizar perfil.");
            }

            alert("Perfil atualizado com sucesso.");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao atualizar perfil.");
        } finally {
            setSalvandoDados(false);
        }
    }

    async function handleSalvarAvatar() {
        if (!selectedFile) return;

        try {
            setSalvandoAvatar(true);

            const croppedFile = await cropImageToSquare(selectedFile, avatarZoom);

            const formData = new FormData();
            formData.append("file", croppedFile);

            const response = await fetch("/api/sys/usuarios/me/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Erro ao atualizar foto.");
            }

            setAvatarUrl(data.usuario.avatar_url);

            if (selectedPreviewUrl) {
                URL.revokeObjectURL(selectedPreviewUrl);
            }

            setSelectedFile(null);
            setSelectedPreviewUrl(null);
            setAvatarZoom(1);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            alert("Foto atualizada com sucesso.");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao atualizar foto.");
        } finally {
            setSalvandoAvatar(false);
        }
    }

    async function handleAlterarSenha(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (novaSenha.length < 8) {
            alert("A nova senha precisa ter pelo menos 8 caracteres.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert("A confirmação da senha não confere.");
            return;
        }

        try {
            setSalvandoSenha(true);

            const result = await authClient.changePassword({
                currentPassword: senhaAtual,
                newPassword: novaSenha,
                revokeOtherSessions: true,
            });

            if (result.error) {
                throw new Error(result.error.message || "Erro ao alterar senha.");
            }

            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");

            alert("Senha alterada com sucesso.");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao alterar senha.");
        } finally {
            setSalvandoSenha(false);
        }
    }

    return (
        <div className="bp-grid">
            <div className="bp-row-between bp-mb-24">
                <div>
                    <h1 className="bp-page-title">Meu perfil</h1>
                    <p className="bp-page-subtitle">
                        Gerencie seus dados pessoais, foto de perfil e segurança da conta.
                    </p>
                </div>
            </div>

            <div className="bp-page-grid">
                <div className="bp-grid">
                    <div className="bp-card bp-card-elevated">
                        <div className="bp-card-body">
                            <div className="bp-avatar-uploader">
                                <div className="bp-avatar-preview">
                                    {selectedPreviewUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={selectedPreviewUrl}
                                            alt="Prévia da nova foto"
                                            style={{ transform: `scale(${avatarZoom})` }}
                                        />
                                    ) : avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarUrl} alt={nome} />
                                    ) : (
                                        <span>{iniciais || "BP"}</span>
                                    )}
                                </div>

                                <div>
                                    <h2 className="bp-section-title">{nome}</h2>
                                    <p className="bp-section-subtitle">@{nickname}</p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="bp-avatar-file-input"
                                    onChange={handleSelectAvatar}
                                />

                                <button
                                    type="button"
                                    className="bp-button bp-button-md bp-button-soft bp-ui-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Escolher foto
                                </button>

                                {selectedFile && (
                                    <div className="bp-avatar-editor">
                                        <label className="bp-label" htmlFor="avatarZoom">
                                            Ajuste do zoom
                                        </label>

                                        <input
                                            id="avatarZoom"
                                            type="range"
                                            min="1"
                                            max="2"
                                            step="0.05"
                                            value={avatarZoom}
                                            onChange={(event) =>
                                                setAvatarZoom(Number(event.target.value))
                                            }
                                        />

                                        <div className="bp-action-row">
                                            <button
                                                type="button"
                                                className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                                                onClick={handleSalvarAvatar}
                                                disabled={salvandoAvatar}
                                            >
                                                {salvandoAvatar ? "Salvando..." : "Salvar foto"}
                                            </button>

                                            <button
                                                type="button"
                                                className="bp-button bp-button-md bp-button-ghost bp-ui-secondary"
                                                onClick={() => {
                                                    if (selectedPreviewUrl) {
                                                        URL.revokeObjectURL(selectedPreviewUrl);
                                                    }

                                                    setSelectedFile(null);
                                                    setSelectedPreviewUrl(null);
                                                    setAvatarZoom(1);

                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = "";
                                                    }
                                                }}
                                                disabled={salvandoAvatar}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bp-card">
                        <div className="bp-card-body">
                            <h2 className="bp-section-title">Resumo da conta</h2>
                            <p className="bp-section-subtitle">
                                Informações principais vinculadas ao seu usuário.
                            </p>

                            <div className="bp-info-list bp-mt-18">
                                <div className="bp-info-row">
                                    <span>Status</span>
                                    <strong>{usuario.ativo ? "Ativa" : "Inativa"}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Email</span>
                                    <strong>{usuario.email}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Criada em</span>
                                    <strong>{formatDate(usuario.created_at)}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Último login</span>
                                    <strong>{formatDate(usuario.ultimo_login_at)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bp-grid">
                    <form className="bp-card" onSubmit={handleSalvarDados}>
                        <div className="bp-card-body">
                            <div className="bp-row-between bp-mb-24">
                                <div>
                                    <h2 className="bp-section-title">Dados pessoais</h2>
                                    <p className="bp-section-subtitle">
                                        Atualize as informações básicas exibidas no sistema.
                                    </p>
                                </div>
                            </div>

                            <div
                                className="bp-grid"
                                style={{
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                }}
                            >
                                <div>
                                    <label className="bp-label" htmlFor="nome">
                                        Nome
                                    </label>
                                    <input
                                        id="nome"
                                        className="bp-input"
                                        value={nome}
                                        onChange={(event) => setNome(event.target.value)}
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="bp-label" htmlFor="nickname">
                                        Nickname
                                    </label>
                                    <input
                                        id="nickname"
                                        className="bp-input"
                                        value={nickname}
                                        onChange={(event) => setNickname(event.target.value)}
                                        placeholder="seu_nickname"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="bp-label" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        className="bp-input"
                                        value={usuario.email}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="bp-label" htmlFor="telefone">
                                        Telefone
                                    </label>
                                    <input
                                        id="telefone"
                                        className="bp-input"
                                        value={telefone}
                                        onChange={(event) => setTelefone(event.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="bp-action-row bp-mt-24">
                                <button
                                    type="submit"
                                    className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                                    disabled={salvandoDados}
                                >
                                    {salvandoDados ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </div>
                        </div>
                    </form>

                    <form className="bp-card" onSubmit={handleAlterarSenha}>
                        <div className="bp-card-body">
                            <div className="bp-row-between bp-mb-24">
                                <div>
                                    <h2 className="bp-section-title">Segurança</h2>
                                    <p className="bp-section-subtitle">
                                        Altere sua senha de acesso à conta.
                                    </p>
                                </div>
                            </div>

                            <div className="bp-grid">
                                <div>
                                    <label className="bp-label" htmlFor="senhaAtual">
                                        Senha atual
                                    </label>
                                    <input
                                        id="senhaAtual"
                                        className="bp-input"
                                        type="password"
                                        value={senhaAtual}
                                        onChange={(event) => setSenhaAtual(event.target.value)}
                                        placeholder="Digite sua senha atual"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="bp-label" htmlFor="novaSenha">
                                        Nova senha
                                    </label>
                                    <input
                                        id="novaSenha"
                                        className="bp-input"
                                        type="password"
                                        value={novaSenha}
                                        onChange={(event) => setNovaSenha(event.target.value)}
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="bp-label" htmlFor="confirmarSenha">
                                        Confirmar nova senha
                                    </label>
                                    <input
                                        id="confirmarSenha"
                                        className="bp-input"
                                        type="password"
                                        value={confirmarSenha}
                                        onChange={(event) => setConfirmarSenha(event.target.value)}
                                        placeholder="Repita a nova senha"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bp-action-row bp-mt-24">
                                <button
                                    type="submit"
                                    className="bp-button bp-button-md bp-button-soft bp-ui-secondary"
                                    disabled={salvandoSenha}
                                >
                                    {salvandoSenha ? "Alterando..." : "Alterar senha"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}