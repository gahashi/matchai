# MatchAI — protótipo visual responsivo (Sprint 2)

Site **independente**, React + TypeScript + Vite, com dados fictícios. Apresenta a experiência de identificar conteúdo humano/IA, publicar exemplo, ranking, notificações, perfil e telas de login/cadastro **simuladas**. Não conecta MySQL/PostgreSQL, Prisma, Better Auth, RustFS ou SMTP; nada é enviado à internet. A pontuação e publicação fictícia podem ser lembradas no `localStorage` do próprio navegador.

## Executar no WSL

```bash
cd /mnt/c/matchai/matchai-prototipo-visual
npm install
npm run dev
```

Abra **http://127.0.0.1:5173/demo/feed**. Não é necessário iniciar `app/` nem Docker. Funciona com o servidor Vite independentemente da página inicial Brava Pass que ainda usa Prisma.

**F12** → *Toggle device toolbar* → altere para 390 px, 768 px e 1440 px. Não há moldura de telefone. O desktop tem menu à esquerda e painel à direita; em telas pequenas a navegação migra para a parte inferior.

## Telas e demonstrações

- `/demo/feed`: clique **Humano** ou **IA**, ou arraste o conteúdo. Após votar, confira se acertou, abra comentários, adicione comentário fictício e avance para o próximo conteúdo.
- `/demo/publicar`: escolha foto/vídeo/áudio/texto, defina autor humano ou IA, preencha os dados; publicar muda o feed somente do navegador, sem upload real.
- `/demo/ranking`: classificação fictícia e pódio.
- `/demo/alertas`: notificações fictícias, botão de marcar como lidas.
- `/demo/perfil`: pontos, taxa de acerto e faixas de progresso fictícias.
- `/demo/login`, `/demo/cadastro`: telas de exemplo; não criam usuários nem verificam senha.

## Importante sobre o Git

O repositório `/mnt/c/matchai` pode conter centenas de arquivos já preparados para outro commit. **Não execute `git add .`, `git reset --hard` ou `git clean`**. Para versionar somente este pacote, a partir da raiz:

```bash
cd /mnt/c/matchai
git add -- matchai-prototipo-visual/
git commit --only -m "feat(ui): prototipo responsivo MatchAI sem backend (sprint 2)" -- matchai-prototipo-visual/
git push
```

Você também pode rodar `bash matchai-prototipo-visual/scripts/commit.sh` da raiz do repositório; ele verifica a branch e cria um commit restrito à pasta do protótipo. `node_modules` e `dist` são ignorados pela `.gitignore` interna.

Sprint de desenvolvimento: **Sprint 2 (05–23/10/2026)**. Registrar a data real do commit; não retrodatá-lo. A implementação visual NÃO substitui as APIs exigidas no relatório M2.

## Testes

```bash
npm run typecheck
npm run build
```

Se aparecer erro `EADDRINUSE: port 5173`, identifique o processo já ouvindo na porta, sem encerrar outros servidores do usuário à força.
