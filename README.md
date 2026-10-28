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
npm run coordenacao:criar -- "Marta" marta@pratocheio.org senha-segura SC "Joinville"
npm start            # sobe em http://localhost:3000
npm test             # roda os testes, sem usar o Neon
npm run dev          # sobe recarregando a cada alteração
```

**Quem cria cada conta.** Doadores e ONGs criam a própria conta na tela, escolhendo *Sou doador* ou *Sou ONG* e informando **estado e cidade** numa lista ([ADR 0009](docs/adr/0009-estado-e-cidade-escolhidos-em-lista.md)). A conta de ONG nasce **pendente** e só aceita doações depois que a coordenação aprova ([ADR 0006](docs/adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md)) — por isso o comando acima, que cria uma conta de coordenação, é o único cadastro que precisa do terminal.

Para criar uma ONG já aprovada, sem passar pela fila:

```bash
npm run ong:criar -- "Banco de Alimentos" contato@banco.org senha-segura SC "Joinville"
```

**Para demonstrar o sistema**, o comando abaixo deixa o banco num estado pronto: uma coordenação, dois doadores em cidades diferentes, uma ONG aprovada, duas ONGs pendentes e seis doações em estados diferentes do ciclo de vida, todas com a senha `12345678`.

```bash
npm run semear -- --confirmar   # ATENÇÃO: apaga todas as contas e doações do banco do .env
```

Ele cria tudo chamando as mesmas funções que a tela chama, e não por `INSERT` direto — então não consegue montar um estado que o sistema não produziria.

Para ver os três papéis ao mesmo tempo, use uma janela normal, uma anônima e uma de outro navegador.

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

Os porquês estão nos ADRs [0005](docs/adr/0005-postgresql-no-lugar-do-sqlite.md) (PostgreSQL no lugar do SQLite), [0001](docs/adr/0001-banco-postgresql-no-neon.md) (Neon) e [0004](docs/adr/0004-prisma-e-migrations.md) (Prisma e migrations). A troca de banco está registrada em [`docs/refatoracoes.md`](docs/refatoracoes.md).

## Estrutura

```
src/server.js          entrypoint (npm start)
src/app.js             página inicial, rotas da API e cookie da sessão
src/doacoes.js         regras das doações: publicar, listar, aceitar, retirar e cancelar (RN-01 a RN-05)
src/usuarios.js        regras de conta: cadastro, login, sessão, papéis e aprovação da ONG (H-04 a H-06)
src/regras.js          peças comuns: erro com status, id válido, campos obrigatórios e o dia de hoje em São Paulo
src/localidades.js     onde a rede atende: estados e cidades (RN-06)
src/repositorio.js     acesso ao banco (Prisma Client)
src/db.js              conexão com o PostgreSQL
prisma/schema.prisma   modelo das tabelas
prisma/migrations/     SQL de cada mudança no banco
prisma.config.js       configuração do Prisma (lê o .env)
scripts/criar-ong.js   cria conta de ONG já aprovada (npm run ong:criar)
scripts/criar-coordenacao.js  cria a coordenação de uma cidade (npm run coordenacao:criar)
scripts/criar-conta.js parte comum dos dois comandos acima
scripts/semear.js      apaga e recria contas e doações para demonstração (npm run semear)
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
- **Identificação por e-mail e senha** (H-04, [ADR 0003](docs/adr/0003-identificacao-por-email-e-senha.md)). Cada pessoa tem conta, a senha é guardada só como hash, a sessão dura 30 dias, e cada doação registra quem publicou e quem aceitou.
- **Banco PostgreSQL no Neon, com Prisma** ([ADR 0001](docs/adr/0001-banco-postgresql-no-neon.md), [ADR 0004](docs/adr/0004-prisma-e-migrations.md)).
- **No ar na Vercel:** [prato-cheio-sigma.vercel.app](https://prato-cheio-sigma.vercel.app) ([ADR 0002](docs/adr/0002-hospedagem-na-vercel.md)). Cada merge na `main` publica uma versão nova.
- **Cadastro de ONG com aprovação da coordenação** (H-05 e H-06, [ADR 0006](docs/adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) e [ADR 0010](docs/adr/0010-aprovacao-central-da-conta-de-ong.md)). A ONG se cadastra na tela e a conta nasce pendente: ela entra, vê as doações, mas o aceite só libera depois da aprovação (RN-04). A coordenação é um papel novo, que vê os pedidos de **qualquer cidade da rede**, aprova ou recusa, e cada decisão fica gravada com quem decidiu e quando.
- **Estado e cidade em toda conta, escolhidos numa lista** (H-08, RN-06, [ADR 0009](docs/adr/0009-estado-e-cidade-escolhidos-em-lista.md)). A ONG vê e aceita só as doações da cidade dela, e a doação herda a cidade de quem publicou. A cidade deixou de ser digitada: antes, `"Joinvile"` com uma letra a menos criava uma conta que não encontrava a rede, sem erro nenhum.
- **Doação vencida não circula** (H-03, RN-03, [ADR 0007](docs/adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)). Era a última regra de negócio escrita na Unidade 1 e sem código. Quem vence hoje ainda aparece o dia inteiro; "hoje" é o dia em **São Paulo**, e não o do servidor, que roda em UTC. O prazo no passado é recusado na publicação.
- **Retirada confirmada e aceite cancelado** (H-07, RN-05, [ADR 0008](docs/adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)). A ONG confirma a retirada ou devolve a doação para a lista das outras, e cada papel vê o seu histórico. Com `aceita_em` e `retirada_em`, o **OBJ-01 passou a ser calculável** — era o indicador que define o problema do projeto e que nenhuma versão anterior conseguia medir.
- **Tela nova, pensada para o celular.** Tem entrar e criar conta — escolhendo doador ou ONG —, publicar com confirmação e erro visível, as doações recentes do doador, a lista da ONG com o botão de aceitar e o que ela já aceitou, e a tela de pedidos da coordenação.
- **Decisões de projeto** em [`docs/decisoes-de-projeto.md`](docs/decisoes-de-projeto.md): três decisões que o caso exige, cada uma com duas alternativas, a tabela de trade-offs da D3 e a justificativa ligada à nossa análise. O resumo de todas as decisões, inclusive as que já tomamos, está em [`docs/projeto.md`](docs/projeto.md).
- **Dez ADRs em `docs/adr/`.** O [0005](docs/adr/0005-postgresql-no-lugar-do-sqlite.md) registra por que trocamos o SQLite pelo PostgreSQL e foi **revisado nesta entrega** com as evidências de três mudanças de modelo feitas depois da migração. O [0006](docs/adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) revisa o [0003](docs/adr/0003-identificacao-por-email-e-senha.md) e agora está implementado. São quatro novos: [0007](docs/adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md) e [0008](docs/adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md) fecham as decisões D1 e D2; [0009](docs/adr/0009-estado-e-cidade-escolhidos-em-lista.md) põe estado e cidade em toda conta; e [0010](docs/adr/0010-aprovacao-central-da-conta-de-ong.md) **substitui uma regra do 0006 no mesmo dia em que a implementamos** — a aprovação deixou de ser por cidade, porque a rede tem uma coordenação só e o pedido de uma cidade sem coordenador ficava esperando ninguém.
- **Documento da entrega** em [`docs/projeto.md`](docs/projeto.md): histórias implementadas, decisões, os três requisitos não funcionais e os critérios de validação. A retrospectiva está em [`docs/retrospectivas/2.md`](docs/retrospectivas/2.md), e a v3 do diagrama de estados, em [`docs/diagramas/`](docs/diagramas/README.md).

A fatia atravessa todas as camadas de propósito — é isso que faz dela um *walking skeleton*:

| Passo da história | Tela (`public/`) | Rota (`src/app.js`) | Regra | Banco (`src/repositorio.js`) |
|---|---|---|---|---|
| Doador entra ou cria a conta | formulários **Entrar** e **Criar conta** | `POST /api/login`, `POST /api/cadastro` | `src/usuarios.js` — senha com hash, sessão de 30 dias, e o cadastro da tela cria só doador ou ONG (H-04) | tabelas `usuarios` e `sessoes` |
| Doador publica | formulário **Publicar doação** | `POST /api/doacoes` | `criarDoacao` — só doador; exige tipo, quantidade e validade (RN-01) | `inserir` — grava quem publicou |
| ONG vê a lista | lista **Doações disponíveis** | `GET /api/doacoes` | `listarDisponiveis` — exige login, e filtra pela cidade da conta (RN-06) | `listarDisponiveis` — só `disponivel`, no prazo e da mesma cidade do doador |
| ONG aceita | botão **Aceitar doação** | `POST /api/doacoes/:id/aceitar` | `aceitar` — só ONG **aprovada**, doação **no prazo** e **da mesma cidade**; o nome vem da conta | `aceitar` — altera só se ainda estiver `disponivel` e `validade >= hoje`, numa única instrução (RN-02, RN-03) |
| ONG cria a conta | escolha **Sou ONG** + estado e cidade | `POST /api/cadastro`, `GET /api/localidades` | `cadastrarPeloSite` — conta de ONG nasce pendente (RN-04) e a localidade é validada contra a lista (RN-06) | `inserirUsuario` — grava estado, cidade e situação |
| Coordenação aprova | tela **Pedidos de conta** | `GET /api/ongs/pendentes`, `POST /api/ongs/:id/aprovar` e `/recusar` | `listarOngsPendentes` e `avaliarOng` — só a coordenação, de qualquer cidade da rede | `listarOngsPorSituacao` e `avaliarConta` — grava quem decidiu e quando |
| ONG retira ou devolve | botões **Confirmar retirada** e **Cancelar aceite** | `POST /api/doacoes/:id/retirar` e `/cancelar` | `confirmarRetirada` e `cancelarAceite` — só a ONG que aceitou (RN-05) | `registrarRetirada` grava `retirada_em`; `devolverParaDisponivel` apaga o aceite |
| Cada um vê o que já passou | listas **Suas doações recentes** e **Suas doações aceitas** | `GET /api/doacoes/recentes` | `listarRecentes` — o doador vê o que publicou, a ONG o que aceitou | `listarPublicadasPor` e `listarAceitasPor` |

Cada critério de aceite em `docs/analise.md` aponta para um teste com nome. São **66 testes**, todos passando: 8 em `tests/doacoes.test.js`, 12 em `tests/contas.test.js`, 13 em `tests/aprovacao.test.js`, 7 em `tests/prazo.test.js`, 14 em `tests/historico.test.js`, 9 em `tests/localidade.test.js` e 3 em `tests/deploy.test.js`, que conferem o que a Vercel exige. **29 deles verificam que o sistema recusa algo:** erro de regra vira `400`, falta de login vira `401` e papel, conta ou cidade sem permissão vira `403`.

**Falta (backlog):**
- Trocar a região da função da Vercel para São Paulo (`gru1`), a mesma do banco. Hoje ela roda em Washington (`iad1`) ([ADR 0002](docs/adr/0002-hospedagem-na-vercel.md)).
- Aviso às ONGs quando surge uma doação, depois de decidirmos a D3 de [`docs/decisoes-de-projeto.md`](docs/decisoes-de-projeto.md) — a última das três decisões da Unidade 2 em aberto.
- **Liberação automática do aceite:** aceite sem retirada confirmada em 4 h volta para `disponivel`. Era a outra alternativa da D2 e depende de uma tarefa agendada, porque a função da Vercel só acorda quando chega requisição ([ADR 0008](docs/adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)).
- **Executar o experimento H1** com 8 doadores reais. O requisito de publicar em 30 segundos ainda é uma suposição ([`docs/experimento-h1.md`](docs/experimento-h1.md)).
- **Teste automatizado da tela.** Os 66 testes cobrem regras e rotas; `public/tela.js` é conferido à mão.
- Recuperação de senha e limite de tentativas de login ([ADR 0003](docs/adr/0003-identificacao-por-email-e-senha.md)). Os dois são pré-requisitos para a rede atender outras cidades ([ADR 0006](docs/adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md)).
- **Editar a conta, principalmente a cidade.** Quem escolher a cidade errada no cadastro fica preso: hoje a saída é criar outra conta, ou alguém corrigir no banco. É a primeira dívida do [ADR 0009](docs/adr/0009-estado-e-cidade-escolhidos-em-lista.md).
- **Mais cidades em `src/localidades.js`.** A lista tem 61 das 295 cidades de SC, e crescer depende de um PR nosso.
- **Aprovação por cidade de volta**, quando a rede tiver pessoa de coordenação em mais de uma cidade ([ADR 0010](docs/adr/0010-aprovacao-central-da-conta-de-ong.md)).

Detalhes em "Fora do escopo" e "Riscos" de `docs/analise.md`.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
