# ADR 0004 — Estrutura do banco com Prisma e migrations versionadas

- **Data:** 2026-09-23
- **Status:** aceito e implementado

## Contexto
Na Unidade 1 o schema era criado por um `CREATE TABLE IF NOT EXISTS` dentro do `src/db.js`. Isso funciona uma vez, mas não evolui: quando a identificação ([ADR 0003](0003-identificacao-por-email-e-senha.md)) acrescentou colunas em `doacoes`, foi preciso um `ALTER TABLE` escrito à mão, rodando a cada subida do servidor.

O modelo vai continuar mudando. O risco da vigilância sanitária prevê campos novos (conservação, horário de preparo), e a mitigação do risco da ONG que aceita e não retira prevê `aceita_em` e `retirada_em`. Com o banco no Neon ([ADR 0001](0001-banco-postgresql-no-neon.md)), cada mudança precisa chegar ao banco real sem perder dados, na mesma ordem para todos nós.

## Alternativas consideradas
1. **Prisma** — o modelo fica descrito em `prisma/schema.prisma`; o Prisma gera o SQL de cada mudança (a migration) e o cliente usado nas consultas.
   - Prós: modelo legível num arquivo só, que serve de diagrama de dados; SQL das mudanças gerado automaticamente; histórico versionado em `prisma/migrations/`; muito usado em projetos Node.
   - Contras: mais uma ferramenta para aprender; o `src/repositorio.js` precisou ser reescrito com o Prisma Client; o cliente gerado é TypeScript; os testes precisam de um PostgreSQL.
2. **SQL versionado à mão + biblioteca `pg`** — cada mudança é um arquivo `.sql` numerado, aplicado por um script nosso.
   - Prós: nenhuma ferramenta nova; o SQL do repositório ficaria quase igual; controle total do SQL.
   - Contras: cada `ALTER TABLE` escrito à mão; nosso próprio controle de quais migrations já rodaram; nenhum arquivo único mostrando o modelo atual.

## Decisão
Prisma, versão 7. Preferimos ter o modelo num arquivo só e deixar a ferramenta gerar o SQL das mudanças, e o Prisma é o padrão mais comum em projetos Node.

Para não perder o que a alternativa 2 tinha de melhor, os testes continuam rodando sem internet e sem senha. Eles usam o PGlite, um PostgreSQL de verdade que roda em memória, criado a partir dos mesmos arquivos de migration que vão para o Neon.

## Consequências
- **Positivas:** o modelo de dados está em `prisma/schema.prisma`; cada mudança vira uma pasta em `prisma/migrations/` com o SQL, revisável no Pull Request; o banco só aceita os valores previstos de papel e de status (enums); os testes exercitam o mesmo SQL que roda no Neon.
- **Negativas / o que abrimos mão:** mais dependências (`prisma`, `@prisma/client`, `@prisma/adapter-pg` e, só nos testes, `@electric-sql/pglite` e `pglite-prisma-adapter`); o `npm install` precisa gerar o cliente (script `postinstall`); o `src/db.js` deixou de expor `query()` com SQL, e as consultas agora estão no `src/repositorio.js`, em Prisma Client; o Node mínimo subiu para 22.18, o primeiro que roda TypeScript sem configuração.
- **Como se usa:**
  - `npm run db:migrar` (`prisma migrate deploy`) aplica no banco do `.env` só as migrations que faltam, na ordem.
  - `npx prisma migrate status` mostra o que falta aplicar, sem alterar nada.
  - Para mudar o modelo: editar `prisma/schema.prisma` e rodar `npm run db:nova-migration -- nome-da-mudanca`.
- **Riscos e o que fazer:**
  - *Gerar migration apontando para o banco que a rede usa* → `db:nova-migration` (`prisma migrate dev`) só deve ser usado com um branch de desenvolvimento do Neon no `.env`.
  - *O adaptador do PGlite é mantido pela comunidade, não pelo Prisma* → se ele parar de acompanhar o Prisma, os testes passam a usar um branch de testes no Neon, que era a alternativa considerada.
  - *O Prisma 8 já está em pré-lançamento* → as versões ficam em 7.x no `package.json`. Atualizar é uma decisão futura, com os testes como rede de segurança.

## Rastreabilidade
- Risco "a vigilância exigir registro de conservação e horário de preparo": campos novos no modelo exigem mudanças seguras no banco.
- Risco "uma ONG aceita a doação e não retira": a mitigação da U2 acrescenta `aceita_em` e `retirada_em`.
- [ADR 0001](0001-banco-postgresql-no-neon.md) (Neon) e [ADR 0003](0003-identificacao-por-email-e-senha.md) (identificação, que acrescentou as tabelas `usuarios` e `sessoes`).
- Restrição da disciplina (README): schema migrado e CI verde.
