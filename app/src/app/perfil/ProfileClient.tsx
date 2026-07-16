"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Camera, Check, KeyRound, Pencil, X } from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Modal } from "@/components/ui/Modal";
import { Snackbar, type SnackbarState } from "@/components/ui/Snackbar";
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

    const [dados, setDados] = useState(usuario);

    const [editandoPerfil, setEditandoPerfil] = useState(false);
    const [alterandoSenha, setAlterandoSenha] = useState(false);

    const [nome, setNome] = useState(usuario.nome);
    const [nickname, setNickname] = useState(usuario.nickname);
    const [telefone, setTelefone] = useState(usuario.telefone ?? "");

    const [avatarUrl, setAvatarUrl] = useState(usuario.avatar_url);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
    const [avatarZoom, setAvatarZoom] = useState(1);

    const [salvandoDados, setSalvandoDados] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

    const iniciais = useMemo(() => {
        return (editandoPerfil ? nome : dados.nome)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0]?.toUpperCase())
            .join("");
    }, [dados.nome, editandoPerfil, nome]);

    function limparAvatarSelecionado() {
        if (selectedPreviewUrl) {
            URL.revokeObjectURL(selectedPreviewUrl);
        }

        setSelectedFile(null);
        setSelectedPreviewUrl(null);
        setAvatarZoom(1);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function iniciarEdicaoPerfil() {
        setSnackbar(null);
        setNome(dados.nome);
        setNickname(dados.nickname);
        setTelefone(dados.telefone ?? "");
        setEditandoPerfil(true);
    }

    function cancelarEdicaoPerfil() {
        setNome(dados.nome);
        setNickname(dados.nickname);
        setTelefone(dados.telefone ?? "");
        limparAvatarSelecionado();
        setEditandoPerfil(false);
        setSnackbar(null);
    }

    function limparFormularioSenha() {
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
    }

    function fecharModalSenha() {
        if (salvandoSenha) return;

        limparFormularioSenha();
        setAlterandoSenha(false);
    }

    function handleSelectAvatar(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setSnackbar({
                color: "danger",
                title: "Imagem inválida",
                message: "Selecione um arquivo de imagem válido.",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({
                color: "warning",
                title: "Arquivo muito grande",
                message: "A imagem deve ter no máximo 5MB.",
            });
            return;
        }

        limparAvatarSelecionado();

        setSelectedFile(file);
        setSelectedPreviewUrl(URL.createObjectURL(file));
        setAvatarZoom(1);
    }

    async function salvarAvatarSelecionado() {
        if (!selectedFile) return avatarUrl;

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

        return data.usuario.avatar_url as string | null;
    }

    async function handleSalvarDados(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSalvandoDados(true);
            setSnackbar(null);

            const novoAvatarUrl = await salvarAvatarSelecionado();

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

            setAvatarUrl(novoAvatarUrl);
            limparAvatarSelecionado();

            setDados((current) => ({
                ...current,
                nome: data.usuario.nome,
                nickname: data.usuario.nickname,
                telefone: data.usuario.telefone,
                avatar_url: novoAvatarUrl,
            }));

            setEditandoPerfil(false);

            setSnackbar({
                color: "success",
                title: "Perfil atualizado",
                message: "Suas informações foram salvas com sucesso.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao atualizar perfil",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível salvar suas alterações.",
                autoClose: false,
            });
        } finally {
            setSalvandoDados(false);
        }
    }

    async function handleAlterarSenha(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (novaSenha.length < 8) {
            setSnackbar({
                color: "warning",
                title: "Senha muito curta",
                message: "A nova senha precisa ter pelo menos 8 caracteres.",
            });
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setSnackbar({
                color: "warning",
                title: "Confirmação incorreta",
                message: "A confirmação da senha não confere.",
            });
            return;
        }

        try {
            setSalvandoSenha(true);
            setSnackbar(null);

            const result = await authClient.changePassword({
                currentPassword: senhaAtual,
                newPassword: novaSenha,
                revokeOtherSessions: true,
            });

            if (result.error) {
                throw new Error(result.error.message || "Erro ao alterar senha.");
            }

            limparFormularioSenha();
            setAlterandoSenha(false);

            setSnackbar({
                color: "success",
                title: "Senha alterada",
                message: "Sua senha foi atualizada com sucesso.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao alterar senha",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar sua senha.",
                autoClose: false,
            });
        } finally {
            setSalvandoSenha(false);
        }
    }

    const previewAvatarUrl = selectedPreviewUrl || avatarUrl;

    return (
        <div className="bp-grid">
            <div className="bp-card bp-card-elevated">
                <div className="bp-card-body">
                    <div className="bp-account-header">
                        <div className="bp-account-identity">
                            <div className="bp-avatar-preview bp-account-avatar">
                                {previewAvatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={previewAvatarUrl}
                                        alt={editandoPerfil ? "Prévia da foto" : dados.nome}
                                        style={{
                                            transform: selectedPreviewUrl
                                                ? `scale(${avatarZoom})`
                                                : undefined,
                                        }}
                                    />
                                ) : (
                                    <span>{iniciais || "BP"}</span>
                                )}
                            </div>

                            <div className="bp-account-main">
                                <h1 className="bp-page-title">
                                    {editandoPerfil ? nome || dados.nome : dados.nome}
                                </h1>

                                <p className="bp-page-subtitle">
                                    @{editandoPerfil ? nickname || dados.nickname : dados.nickname}
                                </p>

                                <div className="bp-account-meta">
                                    <span>{dados.email}</span>
                                    <span>•</span>
                                    <span>{dados.ativo ? "Conta ativa" : "Conta inativa"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bp-account-actions">
                            {editandoPerfil ? (
                                <button
                                    type="button"
                                    className="bp-button bp-button-md bp-button-ghost bp-ui-secondary"
                                    onClick={cancelarEdicaoPerfil}
                                    disabled={salvandoDados}
                                >
                                    <X size={17} />
                                    Cancelar
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="bp-button bp-button-md bp-button-soft bp-ui-secondary"
                                    onClick={iniciarEdicaoPerfil}
                                >
                                    <Pencil size={17} />
                                    Editar perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bp-page-grid">
                <div className="bp-grid">
                    <form className="bp-card" onSubmit={handleSalvarDados}>
                        <div className="bp-card-body">
                            <div className="bp-row-between bp-mb-24">
                                <div>
                                    <h2 className="bp-section-title">Dados gerais</h2>
                                    <p className="bp-section-subtitle">
                                        Informações básicas exibidas no Brava Pass.
                                    </p>
                                </div>
                            </div>

                            {editandoPerfil ? (
                                <>
                                    <div className="bp-form-grid">
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
                                                onChange={(event) =>
                                                    setNickname(event.target.value)
                                                }
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
                                                value={dados.email}
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
                                                onChange={(event) =>
                                                    setTelefone(event.target.value)
                                                }
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>

                                        <div className="bp-form-grid-full">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="bp-avatar-file-input"
                                                onChange={handleSelectAvatar}
                                            />

                                            <div className="bp-action-row">
                                                <button
                                                    type="button"
                                                    className="bp-button bp-button-md bp-button-soft bp-ui-secondary"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={salvandoDados}
                                                >
                                                    <Camera size={17} />
                                                    Alterar foto
                                                </button>
                                            </div>

                                            {selectedFile && (
                                                <div className="bp-avatar-editor bp-mt-18">
                                                    <label
                                                        className="bp-label"
                                                        htmlFor="avatarZoom"
                                                    >
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
                                                            setAvatarZoom(
                                                                Number(event.target.value),
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bp-inline-edit-actions">
                                        <button
                                            type="button"
                                            className="bp-button bp-button-md bp-button-ghost bp-ui-secondary"
                                            onClick={cancelarEdicaoPerfil}
                                            disabled={salvandoDados}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                                            disabled={salvandoDados}
                                        >
                                            <Check size={17} />
                                            {salvandoDados ? "Salvando..." : "Salvar alterações"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="bp-info-list">
                                    <div className="bp-info-row">
                                        <span>Nome</span>
                                        <strong>{dados.nome}</strong>
                                    </div>

                                    <div className="bp-info-row">
                                        <span>Nickname</span>
                                        <strong>@{dados.nickname}</strong>
                                    </div>

                                    <div className="bp-info-row">
                                        <span>Email</span>
                                        <strong>{dados.email}</strong>
                                    </div>

                                    <div className="bp-info-row">
                                        <span>Telefone</span>
                                        <strong>{dados.telefone || "Não informado"}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bp-grid">
                    <div className="bp-card">
                        <div className="bp-card-body">
                            <h2 className="bp-section-title">Conta</h2>
                            <p className="bp-section-subtitle">
                                Resumo do seu acesso no sistema.
                            </p>

                            <div className="bp-info-list bp-mt-18">
                                <div className="bp-info-row">
                                    <span>Status</span>
                                    <strong>{dados.ativo ? "Ativa" : "Inativa"}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Perfil</span>
                                    <strong>
                                        {dados.perfil_completo
                                            ? "Completo"
                                            : "Pendente de informações"}
                                    </strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Criada em</span>
                                    <strong>{formatDate(dados.created_at)}</strong>
                                </div>

                                <div className="bp-info-row">
                                    <span>Último login</span>
                                    <strong>{formatDate(dados.ultimo_login_at)}</strong>
                                </div>
                            </div>

                            <div className="bp-action-row bp-mt-24">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>

                    <div className="bp-card">
                        <div className="bp-card-body">
                            <div className="bp-security-row">
                                <div className="bp-security-copy">
                                    <h2 className="bp-section-title">Segurança</h2>
                                    <span>Gerencie sua senha e sessões de acesso.</span>
                                </div>

                                <button
                                    type="button"
                                    className="bp-button bp-button-md bp-button-soft bp-ui-secondary"
                                    onClick={() => {
                                        setSnackbar(null);
                                        setAlterandoSenha(true);
                                    }}
                                >
                                    <KeyRound size={17} />
                                    Alterar senha
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={alterandoSenha}
                title="Alterar senha"
                description="Informe sua senha atual e defina uma nova senha segura."
                onClose={fecharModalSenha}
            >
                <form className="bp-grid" onSubmit={handleAlterarSenha}>
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

                    <div className="bp-inline-edit-actions">
                        <button
                            type="button"
                            className="bp-button bp-button-md bp-button-ghost bp-ui-secondary"
                            onClick={fecharModalSenha}
                            disabled={salvandoSenha}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="bp-button bp-button-md bp-button-solid bp-ui-primary"
                            disabled={salvandoSenha}
                        >
                            {salvandoSenha ? "Alterando..." : "Salvar senha"}
                        </button>
                    </div>
                </form>
            </Modal>

            {snackbar && <Snackbar {...snackbar} onClose={() => setSnackbar(null)} />}
        </div>
    );
}