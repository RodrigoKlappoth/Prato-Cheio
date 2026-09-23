# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** a hospedagem escolhida, a Vercel ([ADR 0002](adr/0002-hospedagem-na-vercel.md)), não guarda arquivos, então o SQLite não funcionaria em produção. O banco passou a ser PostgreSQL no Neon ([ADR 0001](adr/0001-banco-postgresql-no-neon.md)), com o modelo e as migrations no Prisma ([ADR 0004](adr/0004-prisma-e-migrations.md)). A troca estava prevista para a Unidade 3 e foi antecipada para a Unidade 2.
- **O que mudou:**
  - `prisma/schema.prisma` e `prisma/migrations/`: o modelo das tabelas e o SQL que as cria, no lugar do `CREATE TABLE` que ficava no `src/db.js`.
  - `src/db.js`: agora só cria o Prisma Client conectado ao Neon pela `DATABASE_URL`.
  - `src/repositorio.js`: as mesmas funções, com Prisma Client no lugar do SQL escrito à mão. O aceite continua sendo uma única instrução, que só altera a doação se ela ainda estiver disponível.
  - `src/server.js`: não cria mais as tabelas ao subir. Isso passou para `npm run db:migrar`.
  - Testes: a preparação do banco foi para `tests/banco-em-memoria.js`, que cria um PostgreSQL em memória (PGlite) a partir das migrations.
- **O que NÃO mudou:** as rotas (`src/app.js`), as regras de negócio (`src/doacoes.js` e `src/usuarios.js`, exceto a data de expiração da sessão, que passou de texto para data), a tela e os casos de teste, com as mesmas verificações.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: 20 passando com SQLite em memória, rodados antes da troca. Esse estado intermediário não foi commitado; o último estado commitado com SQLite é o do PR #4, com 8 testes passando no CI.
  - testes depois da mudança: 20 passando com PostgreSQL em memória, criado pelas migrations do Prisma.
  - link da execução do CI verde: *(preencher depois do push do Pull Request)*

## Refatoração 2 — (nome)

- **Cheiro de código atacado:** (duplicação, função longa, nome que engana, regra na rota…)
- **Qual dor concreta isso resolvia:**
- **O que mudou:**
- **Evidência (testes verdes antes e depois):**

---

**Limitações e o que ficou de fora:** (o que vocês viram e decidiram não refatorar, e por quê)
