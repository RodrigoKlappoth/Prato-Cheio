# ADR 0002 — Hospedagem da aplicação na Vercel

- **Data:** 2026-09-23
- **Status:** aceito

## Contexto
Hoje o sistema só roda no computador de quem digita `npm start`. O caso pede:

- Endereço público, com HTTPS, que abra no celular do doador no balcão e no da ONG. O protocolo do experimento H1 usa "o celular do próprio participante".
- Resposta rápida: o doador tem 30 segundos no fim do expediente (CONF-01), e o experimento H1 mede até a confirmação. Qualquer espera do servidor contamina a medida, como a "conexão ruim" já listada nas ameaças à validade.
- Não depender de uma pessoa manter o sistema ligado (problema central).
- Nosso fluxo exige revisão de todo Pull Request por outro integrante (README).

## Alternativas consideradas
1. **Vercel** — publica a cada push; o código roda em funções que ligam quando chega uma requisição; a pasta `public/` vai para uma CDN.
   - Prós: plano gratuito (Hobby, uso não comercial); a função liga em fração de segundo; cada Pull Request ganha um endereço de prévia para o revisor testar; integração com o Neon ([ADR 0001](0001-banco-postgresql-no-neon.md)).
   - Contras: não guarda arquivo nem memória entre requisições; o relógio é sempre UTC; o ponto de entrada precisa seguir o formato que a Vercel espera para Express.
2. **Render** — roda o `npm start` como está, com um servidor sempre ligado.
   - Prós: nenhuma mudança no código; servidor tradicional, fácil de entender.
   - Contras: no plano gratuito, o serviço dorme depois de 15 minutos sem acesso e leva cerca de um minuto para acordar.

## Decisão
Vercel. Um minuto acordando o servidor é o dobro do tempo total que o doador aceita gastar (CONF-01) e invalidaria a medida do H1. Na Vercel, o estilo e o código da tela saem direto da CDN, e a função, que entrega a página inicial e a API, liga em fração de segundo. Pesou também o endereço de prévia por Pull Request: o revisor abre o link e testa sem instalar nada.

## Consequências
- **Positivas:** endereço público com HTTPS; publicação automática a cada merge na `main`; prévia por Pull Request; custo zero.
- **Negativas / o que abrimos mão:**
  - Nada gravado em arquivo sobrevive, então o SQLite sai e o deploy depende do PostgreSQL ([ADR 0001](0001-banco-postgresql-no-neon.md)).
  - Não há memória entre requisições, então a sessão do login fica numa tabela do banco e não na memória do servidor ([ADR 0003](0003-identificacao-por-email-e-senha.md) já foi implementado assim).
  - A Vercel usa como entrada o primeiro arquivo que importa o `express`, que é o `src/app.js`, e esse arquivo precisa exportar o app como padrão. O `src/server.js` usa o mesmo app para rodar localmente.
  - A Vercel entrega os arquivos de `public/` pela CDN, cada um no seu caminho, como `/estilo.css`, e o `express.static` só vale localmente. O endereço `/` é a exceção: a Vercel publica o Express justamente nesse endereço, então o `/` sempre chega ao Express, nunca ao `index.html` da CDN. Por isso a página inicial sai de uma rota do próprio Express (`GET /` no `src/app.js`). Sem essa rota, o site mostrava "Cannot GET /". Uma regra de reescrita no `vercel.json` não resolve, porque a Vercel entrega o `/` ao Express antes de olhar essas regras.
  - A Vercel converte arquivos `.ts` em `.js` no build, então nenhum arquivo JavaScript pode importar `.ts`. Por isso o cliente do Prisma é gerado em JavaScript ([ADR 0004](0004-prisma-e-migrations.md)).
  - O plano Hobby é só para uso não comercial: serve ao projeto acadêmico. Se a rede adotar de verdade, reavaliar o plano.
- **Riscos e o que fazer:**
  - *Quebrar o deploy sem perceber.* O primeiro deploy caiu com erro 500 pelos dois motivos acima: o `src/app.js` não exportava o app, e o `src/db.js` importava o cliente do Prisma como `.ts`. Depois, a página inicial deu "Cannot GET /" → os testes em `tests/deploy.test.js` conferem essas regras a cada Pull Request. Um deles sobe o app numa pasta sem `public/`, como a função fica na Vercel, e pede o `/`.
  - *Relógio em UTC.* Às 21h em São Paulo já é o dia seguinte em UTC, e a Vercel não deixa mudar o fuso (a variável `TZ` é reservada). Quando a RN-03 (H-03) entrar, uma doação "até hoje" publicada no fim do expediente poderia ser tratada como vencida → a decisão D1 de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md), ainda em aberto, precisa levar o fuso em conta: nas duas alternativas, *hoje* é a data de São Paulo (`America/Sao_Paulo`).
  - *Distância entre função e banco.* A função roda por padrão em Washington (`iad1`) → trocar a região da função para São Paulo (`gru1`), a mesma do banco. O plano gratuito permite uma região, e ela pode ser escolhida.

## Rastreabilidade
- CONF-01 (30 segundos do doador) e INC-01/H1 (experimento no celular do doador).
- Problema central (não depender de uma pessoa com o sistema ligado).
- OBJ-01 (medido "3 meses após entrar no ar").
- Fluxo de Pull Request com revisão (README).
