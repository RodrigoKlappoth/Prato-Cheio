# ADR 0005 — Banco relacional: PostgreSQL no lugar do SQLite

- **Data:** 2026-10-08, registro da decisão tomada em 2026-09-23, junto com o [ADR 0001](0001-banco-postgresql-no-neon.md)
- **Status:** aceito e implementado

## Contexto
No walking skeleton da Unidade 1, o banco era o SQLite embutido no Node (`node:sqlite`): um arquivo, `dados.sqlite`, no computador de quem roda o servidor, sem nada para instalar. O plano da disciplina era trocar pelo PostgreSQL na Unidade 3 e registrar a decisão num ADR na Unidade 2.

Na Unidade 2, três fatos nos obrigaram a decidir antes:

- **Hospedagem.** Escolhemos a Vercel ([ADR 0002](0002-hospedagem-na-vercel.md)) porque o servidor gratuito do Render dorme e leva cerca de um minuto para acordar, o dobro dos 30 segundos que o doador aceita gastar (CONF-01). Só que a Vercel não guarda arquivo entre uma requisição e outra: o `dados.sqlite` se perderia.
- **Problema central.** O canal de hoje "só funciona enquanto ela [a Marta] está online". Com os dados no computador de um integrante, trocaríamos uma dependência de uma pessoa por outra.
- **Restrição da disciplina.** Qualquer que seja o caminho, o banco precisa ser PostgreSQL na Unidade 3, acessível por `DATABASE_URL`, com o schema migrado e o CI verde (README).

Também havia um compromisso da Unidade 1 que não queríamos perder: os testes rodam com um comando, sem internet e sem senha.

## Alternativas consideradas
1. **Manter o SQLite até a Unidade 3, num servidor com disco.**
   - Prós: nenhuma mudança no acesso ao banco agora; nenhum serviço de banco externo.
   - Contras: não funciona na Vercel, então voltamos ao problema da hospedagem. No Render, o disco permanente só existe nos planos pagos, e o plano gratuito, além de não ter disco, dorme. Na Unidade 3, a troca para PostgreSQL aconteceria do mesmo jeito.
2. **SQLite remoto, no Turso (libSQL).** O banco continua no dialeto do SQLite, mas fica num serviço acessado pela rede, o que funciona nas funções da Vercel.
   - Prós: o SQL da Unidade 1 muda pouco; funciona na Vercel; o Prisma tem adaptador para ele.
   - Contras: não cumpre a restrição da disciplina. Na Unidade 3, faríamos uma segunda migração, do Turso para o PostgreSQL, e reescreveríamos o acesso ao banco duas vezes. E continua sendo um serviço externo, como o PostgreSQL gerenciado.
3. **PostgreSQL já na Unidade 2**, gerenciado no Neon ([ADR 0001](0001-banco-postgresql-no-neon.md)).
   - Prós: cumpre a restrição da disciplina uma unidade antes; funciona na Vercel; uma migração só.
   - Contras: traz trabalho da Unidade 3 para a Unidade 2, disputando tempo com as histórias; rodar o sistema localmente passa a exigir uma conta no Neon e o `.env`; dependemos de um serviço externo.

## Decisão
PostgreSQL já na Unidade 2. A alternativa 1 nos obrigaria a abrir mão da Vercel ou a pagar por um servidor com disco, e o motivo da Vercel (CONF-01 e H1) continua valendo. A alternativa 2 resolve a hospedagem, mas nos faria migrar duas vezes. Como a troca para PostgreSQL acontece de qualquer jeito, fazê-la agora custa uma migração só, a mesma que faríamos na Unidade 3.

Para manter o compromisso dos testes, eles rodam no PGlite, um PostgreSQL em memória, criado a partir das mesmas migrations que vão para o Neon ([ADR 0004](0004-prisma-e-migrations.md)).

**O que não usamos como motivo:** "o PostgreSQL aguenta mais acessos". A rede é a de um bairro, o volume real ainda é desconhecido (INC-04), e o aceite (RN-02) já é uma única instrução que só altera a doação se ela ainda estiver disponível, o que funciona igual nos dois bancos. Com os números de hoje, não teríamos como defender o desempenho como motivo.

## Consequências
- **Positivas:** o deploy na Vercel ficou possível; a restrição da disciplina está cumprida desde a Unidade 2; os dados ficam num lugar sempre ligado, e não no computador de um integrante; os testes continuam rodando sem internet e sem senha.
- **Negativas / o que abrimos mão:**
  - Acabou o "nada para instalar" da Unidade 1. Para rodar o sistema (`npm start`), cada integrante precisa de um banco no Neon e do `.env`. Só os testes continuam sem nada.
  - O `src/repositorio.js` foi reescrito, e entraram dependências novas ([ADR 0004](0004-prisma-e-migrations.md)).
  - A troca, prevista para a Unidade 3, tomou tempo da Unidade 2, e as decisões D1 a D3 de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md) continuam em aberto.
- **Riscos e o que fazer:**
  - *A troca mudar o comportamento do sistema* → os mesmos 20 testes passaram antes, com SQLite em memória, e depois, com PostgreSQL em memória ([`docs/refatoracoes.md`](../refatoracoes.md)).
  - *Depender de um serviço externo e do plano gratuito dele* → tratado no [ADR 0001](0001-banco-postgresql-no-neon.md): o código só conhece a `DATABASE_URL`, então trocar de fornecedor é trocar uma variável.

## Rastreabilidade
- Restrição da disciplina (README): PostgreSQL por `DATABASE_URL`, schema migrado e CI verde.
- CONF-01 e H1, por meio do [ADR 0002](0002-hospedagem-na-vercel.md): a hospedagem que não guarda arquivo.
- Problema central: os dados não podem depender do computador de uma pessoa.
- Stakeholder vigilância sanitária: histórico persistente e rastreável.
- INC-04: o volume ainda é desconhecido, por isso o desempenho não entrou como motivo.
