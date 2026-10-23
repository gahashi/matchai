#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [ ! -f matchai-prototipo-visual/package.json ]; then
  echo "Erro: o protótipo não está na raiz deste repositório." >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != 'chore/next-projetc-estruction' ]]; then
  echo "Aviso: branch atual é $(git branch --show-current), não chore/next-projetc-estruction." >&2
  echo "Para segurança, faça o commit manualmente após conferir a branch." >&2
  exit 1
fi
printf 'Arquivos do protótipo a adicionar ao Git:\n'
git add -- matchai-prototipo-visual/
git diff --cached --name-only -- matchai-prototipo-visual/
if [[ -z "$(git diff --cached --name-only -- matchai-prototipo-visual/)" ]]; then
  echo "Nenhuma modificação do protótipo está pendente de commit."
  exit 0
fi
printf '\nO commit inclui somente matchai-prototipo-visual/, sem tocar nos outros arquivos preparados.\n'
git commit --only -m "feat(ui): prototipo responsivo MatchAI sem backend (sprint 2)" -- matchai-prototipo-visual/
printf '\nCommit criado:\n'
git log -1 --oneline
printf '\nPara publicar execute: git push\n'
