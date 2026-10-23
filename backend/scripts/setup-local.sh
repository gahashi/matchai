#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
service_env="$root/services/.env.rustfs"
backend_env="$root/backend/.env"

if [[ -e "$service_env" || -e "$backend_env" ]]; then
  echo 'Os arquivos de configuração locais já existem. Nenhum arquivo foi sobrescrito.' >&2
  echo 'Confira services/.env.rustfs e backend/.env manualmente.' >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo 'Instale openssl para gerar chaves locais aleatórias.' >&2
  exit 1
fi

umask 077
access_key="matchai$(openssl rand -hex 8)"
secret_key="$(openssl rand -hex 32)"

printf 'RUSTFS_ACCESS_KEY=%s\nRUSTFS_SECRET_KEY=%s\n' "$access_key" "$secret_key" > "$service_env"
cp "$root/backend/.env.example" "$backend_env"
# Substituir sem expor credenciais no terminal
sed -i "s/^S3_ACCESS_KEY_ID=.*/S3_ACCESS_KEY_ID=$access_key/" "$backend_env"
sed -i "s/^S3_SECRET_ACCESS_KEY=.*/S3_SECRET_ACCESS_KEY=$secret_key/" "$backend_env"
chmod 600 "$service_env" "$backend_env"

# Exclusão LOCAL ao Git: não altera o .gitignore compartilhado do projeto.
if git -C "$root" rev-parse --git-dir >/dev/null 2>&1; then
  git_dir="$(git -C "$root" rev-parse --absolute-git-dir)"
  printf '\nservices/.env.rustfs\nbackend/.env\n' >> "$git_dir/info/exclude"
fi

echo 'Criados services/.env.rustfs e backend/.env (sem sobrescrever dados existentes).'
echo 'Configure SMTP no backend/.env antes de rodar check:email.'
