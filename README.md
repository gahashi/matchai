# Brava Pass

O **Brava Pass** é uma plataforma SaaS em desenvolvimento para gestão de atléticas universitárias, parceiros, eventos e marketplace universitário.

A ideia principal do sistema é permitir que atléticas tenham uma estrutura digital própria para gerenciar membros, diretorias, cargos, permissões, identidade visual, planos, eventos, benefícios e futuras integrações comerciais com parceiros.

O sistema principal do Brava Pass possui uma identidade própria, com visual dark, moderno, limpo e profissional. Cada atlética ou parceiro poderá ter seu próprio tema visual, mas esse tema deve aparecer apenas nas páginas e áreas relacionadas àquela organização.

---

## Objetivo do projeto

O Brava Pass tem como objetivo centralizar a gestão de atléticas universitárias em uma plataforma moderna e escalável.

Inicialmente, o sistema deve permitir:

* cadastro e gestão de atléticas;
* vínculo de atléticas com instituições e cursos;
* cadastro e gestão de membros;
* definição de cargos e diretorias;
* controle de permissões por usuário, cargo, role e atlética;
* configuração de tema visual da atlética;
* cadastro de regimento interno;
* controle de planos e assinaturas;
* base inicial para eventos, marketplace, parceiros e benefícios.

No futuro, o sistema também deve evoluir para:

* marketplace universitário;
* eventos e ingressos;
* benefícios para sócios;
* parcerias com empresas;
* relatórios para atléticas e parceiros;
* sistema de pontos/ranking;
* gestão financeira;
* comunicação com membros;
* páginas públicas personalizadas para cada atlética;
* páginas públicas de eventos;
* ferramentas administrativas para parceiros.

---

## Conceito de negócio

O Brava Pass funciona como uma plataforma multi-organização.

Existem diferentes tipos de usuários e contextos:

* usuário comum do sistema;
* administrador global do Brava Pass;
* diretor ou membro de uma atlética;
* colaborador de uma atlética;
* parceiro externo;
* estudante/sócio futuramente vinculado a planos ou benefícios.

Uma mesma pessoa pode ter permissões diferentes em contextos diferentes.

Exemplo:

* Gabriel pode ser administrador global do sistema;
* Gabriel também pode ser presidente da atlética Computaria;
* outro usuário pode ser financeiro apenas dentro de uma atlética específica;
* um parceiro pode ter acesso apenas às ferramentas relacionadas à própria empresa.

Por isso, as permissões precisam considerar o **contexto**.

---

## Regra importante de tema visual

O Brava Pass possui um tema próprio do sistema.

Atualmente, o tema principal do sistema é:

* fundo escuro;
* visual premium;
* cor principal branca/off-white;
* identidade limpa e profissional;
* logo Brava Pass.

As atléticas e parceiros podem ter temas próprios, mas esses temas devem ser aplicados apenas em áreas específicas daquela organização.

Exemplo:

* dashboard geral do Brava Pass usa o tema Brava Pass;
* página pública da Computaria usa o tema da Computaria;
* configurações internas de uma atlética podem usar destaque visual da própria atlética;
* páginas administrativas globais continuam usando o tema Brava Pass.

Regra prática:

```txt
Tema global do sistema ≠ tema da atlética
```

---

## Estrutura de autorização

O sistema deve suportar quatro tipos principais de acesso a páginas:

### 1. Público

Qualquer pessoa pode acessar, estando logada ou não.

Exemplos:

* landing page pública;
* página pública de atlética;
* página pública de evento;
* página pública de parceiro.

Código conceitual:

```ts
access: "public"
```

---

### 2. Visitante / sem login

Somente pessoas que ainda não estão logadas podem acessar.

Exemplos:

* login;
* cadastro;
* recuperar senha.

Se o usuário já estiver logado e tentar acessar uma rota desse tipo, ele deve ser redirecionado para o painel.

Código conceitual:

```ts
access: "guest"
```

---

### 3. Usuário logado

Qualquer usuário autenticado pode acessar, sem exigir permissão específica.

Exemplos:

* painel inicial básico;
* perfil;
* seleção de atlética;
* páginas gerais do usuário.

Código conceitual:

```ts
access: "auth"
```

---

### 4. Usuário com permissão específica

O usuário precisa estar logado e possuir uma permissão específica.

Exemplos:

* editar tema da atlética;
* criar membro;
* editar cargos;
* acessar configurações administrativas;
* editar dados da atlética.

Código conceitual:

```ts
access: "permission"
permissions: ["tema.editar"]
```

---

## Estrutura atual de permissões

O sistema possui as seguintes tabelas principais para autorização:

* `sys_usuario`
* `sys_role`
* `sys_role_escopo`
* `sys_permission`
* `sys_role_permission`
* `sys_usuario_role`
* `sys_usuario_permission`
* `sys_usuario_permission_tipo`

A lógica principal é:

```txt
Usuário → Role → Permissões
Usuário → Permissão direta
Usuário → Role dentro de uma atlética
Usuário → Permissão direta dentro de uma atlética
```

---

## Roles

Roles representam conjuntos de permissões.

Exemplos de roles iniciais:

* `admin_global`
* `admin_atletica`
* `presidencia_atletica`
* `financeiro_atletica`
* `membro_colaborador`

Uma role pode ter escopo:

* global;
* atlética;
* parceiro.

---

## Escopo de role

O escopo define onde aquela role faz sentido.

### Global

Permissões administrativas do Brava Pass como sistema.

Exemplo:

```txt
admin_global
```

### Atlética

Permissões dentro de uma atlética específica.

Exemplo:

```txt
admin_atletica
presidencia_atletica
financeiro_atletica
```

### Parceiro

Permissões futuras para empresas parceiras.

Exemplo futuro:

```txt
admin_parceiro
operador_parceiro
```

---

## Permissões

Permissões representam ações específicas do sistema.

Exemplos atuais:

```txt
dashboard.visualizar
atletica.visualizar
atletica.editar
tema.visualizar
tema.editar
membro.visualizar
membro.criar
membro.editar
membro.remover
cargo.visualizar
cargo.criar
cargo.editar
cargo.remover
regimento.visualizar
regimento.editar
```

Padrão recomendado:

```txt
modulo.acao
```

Exemplos:

```txt
tema.editar
membro.criar
evento.visualizar
evento.criar
financeiro.visualizar
```

---

## Permissões diretas do usuário

Além das permissões herdadas por role, um usuário pode receber permissões diretas.

Existem dois tipos:

```txt
allow
deny
```

### Allow

Libera uma permissão específica diretamente para o usuário.

Exemplo:

```txt
Usuário X recebe tema.editar diretamente
```

### Deny

Bloqueia uma permissão específica diretamente para o usuário.

Essa regra deve ter prioridade sobre permissões herdadas por role.

Exemplo:

```txt
Usuário tem role admin_atletica
mas recebe deny em membro.remover
então não pode remover membros
```

Regra importante:

```txt
deny direto vence allow e role
```

---

## Contexto de atlética

Permissões podem ser globais ou vinculadas a uma atlética.

Exemplo:

```txt
usuário A tem admin_atletica na atlética Computaria
usuário A não necessariamente tem admin_atletica em outra atlética
```

Por isso, várias tabelas possuem o campo:

```txt
atl_atletica_id
```

Quando `atl_atletica_id` é `null`, a permissão ou role pode ser considerada global, dependendo da regra.

Quando `atl_atletica_id` possui valor, a permissão vale apenas naquele contexto.

---

## Regra de verificação de permissão

A ordem ideal da verificação é:

1. verificar se o usuário está autenticado;
2. verificar se existe `deny` direto para aquela permissão;
3. se houver `deny`, bloquear;
4. verificar se existe `allow` direto;
5. se houver `allow`, liberar;
6. verificar se alguma role do usuário possui a permissão;
7. se houver, liberar;
8. caso contrário, bloquear.

Fluxo conceitual:

```txt
deny direto?
    sim → bloqueia

allow direto?
    sim → libera

role possui permissão?
    sim → libera

nenhuma regra encontrada
    bloqueia
```

---

## Arquivos atuais relacionados à autorização

Arquivos criados para centralizar a lógica:

```txt
src/config/route-access.ts
src/lib/auth/auth-types.ts
src/lib/auth/route-access.ts
src/lib/auth/session.ts
src/lib/auth/permissions.ts
src/lib/auth/require-access.ts
src/app/sem-permissao/page.tsx
src/app/login/page.tsx
```

### `src/config/route-access.ts`

Define quais rotas são públicas, apenas visitantes, apenas logadas ou protegidas por permissão.

### `src/lib/auth/session.ts`

Atualmente possui uma sessão temporária de desenvolvimento.

Importante:

```txt
A sessão atual com bp_auth_dev é apenas para desenvolvimento.
Não usar esse modelo em produção.
```

### `src/lib/auth/permissions.ts`

Consulta no banco se o usuário possui determinada permissão.

### `src/lib/auth/require-access.ts`

Função usada nas páginas para bloquear ou redirecionar o usuário conforme a regra da rota.

---

## Importante sobre segurança

A autorização por permissões pode continuar sendo própria do sistema, pois ela depende das regras de negócio do Brava Pass.

Porém, autenticação real deve ser feita com biblioteca.

Separação recomendada:

```txt
Autenticação/login/sessão/senha/cookies → biblioteca
Autorização/permissões/regras de negócio → lógica própria do Brava Pass
```

A sessão temporária atual:

```txt
bp_auth_dev = 1
```

serve apenas para desenvolvimento.

Antes de produção, substituir por uma solução real como:

* Better Auth;
* Auth.js / NextAuth;
* Clerk;
* Auth0;
* Supabase Auth.

Como o projeto já possui banco próprio e regras específicas de permissão, o caminho recomendado é usar biblioteca apenas para autenticação e manter a autorização própria.

---

## Login temporário de desenvolvimento

Existe uma tela de login temporária:

```txt
src/app/login/page.tsx
```

Ela ativa um cookie dev para simular usuário logado.

Usuário dev inicial:

```txt
email: admin@bravapass.dev
senha: admin123
```

A senha atual do seed usa SHA-256 apenas para desenvolvimento.

Antes de produção, trocar para:

```txt
bcrypt
argon2
ou autenticação gerenciada por biblioteca
```

---

## Estrutura de páginas especiais do Next

Arquivos especiais criados:

```txt
src/app/loading.tsx
src/app/not-found.tsx
src/app/error.tsx
src/app/sem-permissao/page.tsx
```

### `loading.tsx`

Tela de carregamento.

### `not-found.tsx`

Página 404.

### `error.tsx`

Página de erro inesperado.

### `sem-permissao/page.tsx`

Página 403 para usuário sem autorização.

---

## Identidade visual

Arquivos principais da marca ficam em:

```txt
public/brand/
```

Estrutura esperada:

```txt
public/brand/brava-pass-logo-dark.png
public/brand/brava-pass-logo-white.png
public/brand/brava-pass-symbol-dark.png
public/brand/brava-pass-symbol-white.png
public/brand/brava-pass-app-icon.png
public/brand/brava-pass-app-icon.svg
```

Arquivos técnicos do Next:

```txt
src/app/favicon.ico
src/app/icon.png
src/app/apple-icon.png
src/app/opengraph-image.png
src/app/twitter-image.png
```

Observação:

```txt
Arquivos dentro de public são acessados sem /public no caminho.
```

Exemplo:

```txt
public/brand/brava-pass-logo-dark.png
```

é usado no código como:

```txt
/brand/brava-pass-logo-dark.png
```

---

## Estrutura de banco atual

Principais módulos de tabelas:

### SYS

Configurações gerais do sistema.

Exemplos:

```txt
sys_usuario
sys_role
sys_permission
sys_role_permission
sys_usuario_role
sys_usuario_permission
sys_assinatura_plano
```

### EDU

Instituições e cursos.

Exemplos:

```txt
edu_instituicao
edu_curso
edu_instituicao_curso
```

### ATL

Atléticas e estrutura interna.

Exemplos:

```txt
atl_atletica
atl_atletica_curso
atl_cargo
atl_atletica_cargo
atl_atletica_membro
atl_atletica_membro_cargo
atl_atletica_tema
atl_atletica_regimento
atl_atletica_assinatura
```

---

## Regras de nomenclatura

Padrão do banco:

```txt
snake_case
```

Prefixos por módulo:

```txt
sys_ → sistema
edu_ → educação
atl_ → atlética
```

Campos de relacionamento devem ser claros e completos.

Preferir:

```txt
atl_atletica_membro_status_id
```

em vez de:

```txt
status_id
```

Isso evita confusão conforme o sistema crescer.

---

## Prisma

O projeto usa Prisma com MariaDB/MySQL.

Arquivos principais:

```txt
prisma/schema.prisma
prisma/seed.ts
prisma.config.ts
src/lib/prisma.ts
```

Comandos importantes:

```bash
npx prisma generate
npx prisma migrate dev --name nome_da_migration
npm run prisma:seed
npm run dev
```

---

## Seed inicial

O seed cria:

* escopos de role;
* tipos de permissão direta;
* tipos de membro;
* status de membro;
* periodicidades de assinatura;
* status de assinatura;
* permissões iniciais;
* roles iniciais;
* vínculo de permissões nas roles;
* usuário dev;
* cargos padrão;
* instituição UNIVALI;
* cursos iniciais;
* atlética Computaria;
* tema inicial da Computaria;
* regimento inicial;
* plano DEV;
* assinatura DEV;
* vínculo do usuário dev como membro/presidente/admin da atlética.

---

## Usuário dev

Usuário criado para desenvolvimento:

```txt
Nome: Admin Dev
Email: admin@bravapass.dev
Senha: admin123
Nickname: admin_dev
```

Observação:

```txt
Esse usuário é apenas para ambiente de desenvolvimento.
```

---

## Comandos úteis

Rodar projeto:

```bash
npm run dev
```

Gerar Prisma Client:

```bash
npx prisma generate
```

Criar migration:

```bash
npx prisma migrate dev --name nome_da_migration
```

Rodar seed:

```bash
npm run prisma:seed
```

---

## Lembretes importantes

* Não deixar `bp_auth_dev` em produção.
* Não usar SHA-256 simples para senha em produção.
* Usar biblioteca para autenticação real.
* Manter autorização própria baseada em roles/permissões.
* Toda permissão nova deve entrar no seed.
* Toda rota protegida deve ser registrada em `route-access.ts`.
* Rotas não mapeadas devem ser tratadas como protegidas por padrão.
* Tema da atlética não deve sobrescrever o tema global do Brava Pass.
* `deny` direto deve ter prioridade sobre role e allow.
* Permissões de atlética devem considerar `atl_atletica_id`.
* Componentes de layout devem continuar genéricos para servir o sistema inteiro.
* Telas públicas podem usar tema da atlética/parceiro.
* Telas administrativas globais devem usar tema Brava Pass.

---

## Próximas etapas planejadas

Possíveis próximos passos do projeto:

1. substituir login dev por autenticação real;
2. criar tela de usuários;
3. criar tela de gestão de atléticas;
4. criar tela de membros;
5. criar tela de cargos;
6. criar tela de permissões/roles;
7. criar tela de configuração de tema;
8. criar página pública dinâmica da atlética;
9. criar fluxo de planos/assinaturas;
10. iniciar módulo de eventos;
11. iniciar módulo de parceiros;
12. iniciar marketplace universitário.

---

## Observação pessoal

Este README serve como documentação pessoal do projeto.

A ideia não é ser uma documentação final para usuários externos, mas sim um guia para lembrar:

* o que o sistema faz;
* o que ele deve fazer no futuro;
* como as permissões funcionam;
* quais decisões técnicas já foram tomadas;
* quais cuidados precisam ser mantidos antes de produção.
