# ADR 0001 — Banco de dados: PostgreSQL gerenciado no Neon

- **Data:** 2026-09-23
- **Status:** aceito

## Contexto
Na Unidade 1 o banco era SQLite: um arquivo no computador de quem rodava o servidor. Serviu para o walking skeleton, mas o caso pede mais:

- Doadores e ONGs usam o sistema de celulares diferentes, em lugares diferentes. Os dados precisam estar num lugar sempre ligado, e não no computador de um integrante. O problema central da análise é justamente um canal que só funciona enquanto uma pessoa está online.
- A vigilância sanitária quer rastreabilidade (o que foi doado, por quem, quando) e os objetivos OBJ-01 a OBJ-03 são medidos ao longo de meses. O histórico não pode se perder.
- A hospedagem escolhida ([ADR 0002](0002-hospedagem-na-vercel.md)) não guarda arquivos entre uma requisição e outra: o arquivo do SQLite não sobreviveria lá.
- Restrição da disciplina: PostgreSQL acessível por `DATABASE_URL`, schema migrado e CI verde.

Instalar o PostgreSQL no computador de um integrante ou num contêiner foi descartado para produção pelo primeiro motivo: o banco desligaria junto com a máquina.

## Alternativas consideradas
1. **Neon** — PostgreSQL gerenciado, só o banco.
   - Prós: plano gratuito; depois de 5 minutos sem uso desliga o processamento e volta sozinho na próxima consulta, em cerca de meio segundo; integração nativa com a Vercel; tem servidor em São Paulo.
   - Contras: a primeira consulta depois de um tempo parado demora um pouco mais; 0,5 GB de espaço no plano gratuito.
2. **Supabase** — PostgreSQL gerenciado com extras: login pronto, armazenamento de arquivos e API automática.
   - Prós: plano gratuito; o login pronto traria recuperação de senha por e-mail.
   - Contras: o projeto gratuito é pausado depois de cerca de uma semana sem uso e só volta quando alguém reativa no painel; usar o login pronto amarra o código ao fornecedor e faz os testes dependerem de internet e de chaves secretas.

## Decisão
Neon. A rede tem semanas sem doação (feriados, férias). Com o Supabase gratuito, o sistema poderia estar fora do ar justamente quando o próximo doador tentasse publicar, e ninguém perceberia antes dele: o doador não reclama, descarta a comida (OBJ-02). O Neon acorda sozinho. Abrimos mão do login pronto do Supabase: preferimos um login simples feito por nós ([ADR 0003](0003-identificacao-por-email-e-senha.md)), que roda nos testes sem internet.

## Consequências
- **Positivas:** dados num lugar sempre disponível; custo zero; atende à restrição da disciplina; o código só conhece a `DATABASE_URL`, então trocar de fornecedor é trocar uma variável.
- **Negativas / o que abrimos mão:** a primeira consulta depois de 5 minutos parado é mais lenta; dependemos de um serviço externo e do plano gratuito dele; recuperação de senha terá de ser feita por nós.
- **Duas conexões:** `DATABASE_URL` (host com `-pooler`) é a usada pelo sistema, que abre muitas conexões curtas; `DATABASE_URL_UNPOOLED` (conexão direta) é a usada pelas migrations ([ADR 0004](0004-prisma-e-migrations.md)).
- **Riscos e o que fazer:**
  - *Senha do banco vazar no repositório, que é público* → as duas URLs ficam só no `.env`, que o git ignora; o `.env.example` tem só um modelo. Se a senha vazar, trocar no painel do Neon.
  - *Testes apagarem dados reais* (os testes limpam as tabelas antes de cada caso) → os testes nunca usam o Neon: rodam num PostgreSQL em memória ([ADR 0004](0004-prisma-e-migrations.md)), e o `vitest.config.js` zera a `DATABASE_URL`.
  - *Atraso somado a cada consulta se banco e servidor ficarem longe* → o banco foi criado em São Paulo (`sa-east-1`); a função da Vercel deve ficar na mesma região ([ADR 0002](0002-hospedagem-na-vercel.md)).
- **Quando:** a troca do SQLite pelo PostgreSQL estava prevista para a Unidade 3. Foi antecipada para a Unidade 2 porque o deploy depende dela; o registro está em `docs/refatoracoes.md`.

## Rastreabilidade
- Problema central: canal que depende de alguém online.
- Stakeholder vigilância sanitária e risco "a vigilância exigir registro de conservação e horário de preparo": histórico persistente e rastreável.
- OBJ-01 a OBJ-03: medidos ao longo de 3 a 6 meses.
- OBJ-02 e CONF-01: o doador desiste ao primeiro atrito.
- INC-04: volume real desconhecido; 0,5 GB sobra para esta fase.
- Restrição da disciplina (README): PostgreSQL por `DATABASE_URL`, schema migrado e CI verde.
