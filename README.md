# Prato Cheio — Rodrigo e Henrique

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Rodrigo Xavier — @RodrigoKLappoth
- Henrique Xavier — @Ikeew

## Como rodar

Requisitos: **Node.js 22.13 ou superior** e um banco **PostgreSQL no Neon** (o plano gratuito basta).

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README e banco relacional migrado para PostgreSQL na Unidade 3.

**1. Configure o banco.** Copie o `.env.example` para `.env` e cole os dois endereços do seu banco, que o painel do Neon mostra no botão *Connect*:

- `DATABASE_URL`: a conexão com `-pooler` no host, usada pelo sistema;
- `DATABASE_URL_UNPOOLED`: a conexão direta, o mesmo host sem `-pooler`, usada pelas migrations.

O `.env` fica só na sua máquina, porque o git ignora esse arquivo. Nunca coloque a senha real no `.env.example`, que vai para o repositório público.

**2. Rode:**

```bash
npm install          # instala e gera o cliente do Prisma
npm run db:migrar    # cria ou atualiza as tabelas no Neon
npm run ong:criar -- "Banco de Alimentos" contato@banco.org senha-segura
npm start            # sobe em http://localhost:3000
npm test             # roda os testes, sem usar o Neon
npm run dev          # sobe recarregando a cada alteração
```

Doadores criam a própria conta na tela. ONGs **não** se cadastram sozinhas: a coordenação cria a conta com `npm run ong:criar`, como no exemplo acima ([ADR 0003](docs/adr/0003-identificacao-por-email-e-senha.md)). Para ver os dois papéis ao mesmo tempo, use uma janela normal para o doador e uma janela anônima para a ONG.

Os testes rodam num **PostgreSQL em memória** (PGlite), criado a partir das mesmas migrations que vão para o Neon. Eles não precisam de internet nem de senha e nunca tocam no banco de verdade.

## O banco: PostgreSQL no Neon, com Prisma

| Unidade | Banco | Como |
|---|---|---|
| 1 — Análise | SQLite (`node:sqlite`, embutido) | walking skeleton, sem nada para instalar |
| 2 — Projeto | **PostgreSQL no Neon** | Prisma com migrations versionadas. A troca, prevista para a U3, foi antecipada porque o deploy na Vercel depende dela |
| 3 — Construção | PostgreSQL no Neon | — |

- **O modelo** das tabelas está em `prisma/schema.prisma`: usuários, sessões e doações.
- **Cada mudança** no modelo vira uma pasta em `prisma/migrations/` com o SQL, que entra no Pull Request junto com o código.
- **Para mudar o modelo:** edite o `schema.prisma` e rode `npm run db:nova-migration -- nome-da-mudanca`. Faça isso com um branch de desenvolvimento do Neon no `.env`, nunca com o banco que a rede usa. Depois, `npm run db:migrar` aplica a mudança em cada banco.
- **Para ver o que falta aplicar:** `npx prisma migrate status`.
- **As consultas** ficam só em `src/repositorio.js`: as regras de negócio não sabem qual é o banco.

Os porquês estão nos ADRs [0001](docs/adr/0001-banco-postgresql-no-neon.md) (Neon) e [0004](docs/adr/0004-prisma-e-migrations.md) (Prisma e migrations). A troca de banco está registrada em [`docs/refatoracoes.md`](docs/refatoracoes.md).

## Estrutura

```
src/server.js          entrypoint (npm start)
src/app.js             rotas da API e cookie da sessão
src/doacoes.js         regras das doações (RN-01, RN-02)
src/usuarios.js        regras de conta: cadastro, login, sessão e papéis (H-04)
src/regras.js          peças comuns às regras: erro com status e campos obrigatórios
src/repositorio.js     acesso ao banco (Prisma Client)
src/db.js              conexão com o PostgreSQL
prisma/schema.prisma   modelo das tabelas
prisma/migrations/     SQL de cada mudança no banco
prisma.config.js       configuração do Prisma (lê o .env)
vercel.json            configuração da Vercel: a página inicial vai para o index.html
scripts/criar-ong.js   cria conta de ONG (npm run ong:criar)
public/                interface para celular: index.html, estilo.css e tela.js
tests/                 testes automatizados (PostgreSQL em memória)
docs/analise.md        documento de análise   (Trabalho 1)
docs/experimento-h1.md protocolo do experimento H1 (Trabalho 1)
docs/projeto.md        documento de projeto   (Trabalho 2): resumo de todas as decisões
docs/decisoes-de-projeto.md decisões da U2: alternativas, trade-offs e justificativa
docs/adr/              decisões arquiteturais (Trabalho 2)
docs/validacao.md      validação e testes     (Trabalho 3)
docs/refatoracoes.md   refatorações feitas    (Trabalho 3)
docs/demo.md           roteiro da demo        (Trabalho 3)
docs/retrospectivas/   retrospectiva de cada iteração
.github/workflows/     pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

Mudou o banco? A pasta nova em `prisma/migrations/` entra no mesmo Pull Request, e depois do merge alguém roda `npm run db:migrar` para aplicar a mudança no Neon.

## O que já está pronto e o que falta

**Pronto no Trabalho 1 (walking skeleton):** a história zero funciona ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**

**Pronto na Unidade 2:**
- **Identificação por e-mail e senha** (H-04, [ADR 0003](docs/adr/0003-identificacao-por-email-e-senha.md)). O doador cria a conta na tela, a conta de ONG é criada pela coordenação, e cada doação registra quem publicou e quem aceitou.
- **Banco PostgreSQL no Neon, com Prisma** ([ADR 0001](docs/adr/0001-banco-postgresql-no-neon.md), [ADR 0004](docs/adr/0004-prisma-e-migrations.md)).
- **Tela nova, pensada para o celular.** Tem entrar e criar conta, publicar com confirmação e erro visível, e a lista de doações da ONG com o botão de aceitar.
- **Decisões de projeto** em [`docs/decisoes-de-projeto.md`](docs/decisoes-de-projeto.md): três decisões que o caso exige, cada uma com duas alternativas, a tabela de trade-offs da D3 e a justificativa ligada à nossa análise. O resumo de todas as decisões, inclusive as que já tomamos, está em [`docs/projeto.md`](docs/projeto.md).

A fatia atravessa todas as camadas de propósito — é isso que faz dela um *walking skeleton*:

| Passo da história | Tela (`public/`) | Rota (`src/app.js`) | Regra | Banco (`src/repositorio.js`) |
|---|---|---|---|---|
| Doador entra ou cria a conta | formulários **Entrar** e **Criar conta de doador** | `POST /api/login`, `POST /api/cadastro` | `src/usuarios.js` — senha com hash, sessão de 30 dias, cadastro público só cria doador (H-04) | tabelas `usuarios` e `sessoes` |
| Doador publica | formulário **Publicar doação** | `POST /api/doacoes` | `criarDoacao` — só doador; exige tipo, quantidade e validade (RN-01) | `inserir` — grava quem publicou |
| ONG vê a lista | lista **Doações disponíveis** | `GET /api/doacoes` | `listarDisponiveis` — exige login | `listarDisponiveis` — só `disponivel`, com o nome do doador |
| ONG aceita | botão **Aceitar doação** | `POST /api/doacoes/:id/aceitar` | `aceitar` — só ONG; o nome vem da conta; explica por que recusou | `aceitar` — altera só se ainda estiver `disponivel`, numa única instrução (RN-02) |

Cada critério de aceite de H-01, H-02 e H-04 em `docs/analise.md` aponta para um teste. São 23 testes, todos passando: 8 em `tests/doacoes.test.js`, 12 em `tests/contas.test.js` e 3 em `tests/deploy.test.js`, que conferem o que a Vercel exige. Erro de regra vira resposta `400`, falta de login vira `401` e papel errado vira `403`.

**Falta (backlog):**
- Deploy na Vercel ([ADR 0002](docs/adr/0002-hospedagem-na-vercel.md)): o primeiro deploy caiu com erro 500 e a causa foi corrigida; falta publicar a correção e conferir o endereço público.
- H-03, doação com prazo vencido não circula (RN-03), depois de decidirmos a D1 de [`docs/decisoes-de-projeto.md`](docs/decisoes-de-projeto.md).
- Doação aceita e não retirada, depois de decidirmos a D2.
- Aviso às ONGs quando surge uma doação, depois de decidirmos a D3.
- Recuperação de senha e limite de tentativas de login ([ADR 0003](docs/adr/0003-identificacao-por-email-e-senha.md)).

Detalhes em "Fora do escopo" e "Riscos" de `docs/analise.md`.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
