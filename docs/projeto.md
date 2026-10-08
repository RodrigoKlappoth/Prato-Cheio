# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto

A atividade da Unidade 2, com as três decisões que a análise deixou em aberto, a tabela de trade-offs e a justificativa, está em [`docs/decisoes-de-projeto.md`](decisoes-de-projeto.md). Cada decisão tomada tem um ADR em `docs/adr/`. A tabela abaixo resume todas.

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva | Situação |
|---|---|---|---|---|
| [ADR 0001](adr/0001-banco-postgresql-no-neon.md) | Onde os dados ficam guardados | Neon · Supabase | Problema central; rastreabilidade para a vigilância sanitária; OBJ-01 a OBJ-03 | Tomada: Neon |
| [ADR 0002](adr/0002-hospedagem-na-vercel.md) | Onde o sistema roda | Vercel · Render | CONF-01; hipótese H1; problema central | Tomada e no ar: Vercel, em [prato-cheio-sigma.vercel.app](https://prato-cheio-sigma.vercel.app) |
| [ADR 0003](adr/0003-identificacao-por-email-e-senha.md) | Como doador e ONG se identificam | E-mail e senha · link de acesso pessoal | Decisão de análise (sem autenticação); RN-02; CONF-01 | Tomada e implementada: e-mail e senha. A regra da conta de ONG foi substituída pelo ADR 0006 |
| [ADR 0004](adr/0004-prisma-e-migrations.md) | Como o banco evolui | Prisma · SQL versionado à mão | Riscos que pedem campos novos; restrição da disciplina | Tomada e implementada: Prisma |
| [ADR 0005](adr/0005-postgresql-no-lugar-do-sqlite.md) | Qual banco usar no lugar do SQLite | SQLite num servidor com disco · SQLite remoto (Turso) · PostgreSQL | Problema central; CONF-01, via a hospedagem; restrição da disciplina | Tomada e implementada: PostgreSQL |
| [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) | Como a ONG ganha conta quando a rede tiver várias cidades | Script da coordenação · cadastro livre · cadastro com aprovação da cidade | Problema central; RN-02; risco do ADR 0003 (coordenação como gargalo) | Tomada, a implementar antes da primeira cidade nova: cadastro com aprovação da cidade |
| D1 | Como o sistema sabe que o prazo de retirada venceu | *Agora* como parâmetro · relógio do servidor | RN-03; H-03 | Em aberto |
| D2 | O que acontece com a doação aceita e não retirada | Liberação automática · cancelamento manual | Risco da ONG que não retira; INC-05; OBJ-01; OBJ-02 | Em aberto |
| D3 | Como as ONGs ficam sabendo de uma doação nova | Aviso no grupo de WhatsApp · notificação no celular | Problema central; Decisão de análise (alternativa 3); OBJ-01; OBJ-02 | Em aberto |

## Tabela de trade-offs (uma decisão em detalhe)

A tabela da atividade detalha a D3, como as ONGs ficam sabendo de uma doação nova, e está em [`docs/decisoes-de-projeto.md`](decisoes-de-projeto.md). A comparação critério a critério do login está no [ADR 0003](adr/0003-identificacao-por-email-e-senha.md).

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

O modelo de dados atual está descrito em `prisma/schema.prisma`.

## ADRs
Ver `docs/adr/`: [0001](adr/0001-banco-postgresql-no-neon.md) banco no Neon · [0002](adr/0002-hospedagem-na-vercel.md) hospedagem na Vercel · [0003](adr/0003-identificacao-por-email-e-senha.md) identificação por e-mail e senha · [0004](adr/0004-prisma-e-migrations.md) Prisma e migrations · [0005](adr/0005-postgresql-no-lugar-do-sqlite.md) PostgreSQL no lugar do SQLite · [0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) cadastro de ONG com aprovação da cidade. As decisões D1 a D3 ganham um ADR quando as tomarmos.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|

## Critérios de validação do projeto

## Uso de IA

| Trecho | Ferramenta | O que fizemos depois |
|---|---|---|
| Resumo das decisões e ADRs 0001 a 0004 | Claude Code (Anthropic) | Escolhemos Neon, Vercel, e-mail e senha e Prisma; revisamos os textos |
| Rascunho do texto de `docs/decisoes-de-projeto.md`: decisões D1 a D3, alternativas, tabela de trade-offs e justificativa | Claude Code (Anthropic) | Escolhemos as três decisões e a D3 para a tabela de trade-offs, revisamos o texto e conferimos cada citação contra a nossa análise da Unidade 1 |
| ADRs 0005 e 0006, status do ADR 0003 e risco de crescimento no ADR 0001 | Claude Code (Anthropic) | Escolhemos o ADR 0003 para revisar diante da rede em várias cidades, decidimos manter o banco no Neon e revisamos os textos |
