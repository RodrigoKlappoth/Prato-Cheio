# ADR 0007 — Como o sistema sabe que o prazo de retirada venceu

- **Data:** 2026-10-27
- **Status:** aceito e implementado (história H-03, regra RN-03)

## Contexto

A RN-03 está escrita desde a Unidade 1: doação com prazo de retirada vencido não aparece na lista e não pode ser aceita. Ela ficou sem implementação por um motivo registrado na própria análise, na leitura INVEST da H-03: o **T** de *Testable* falhava, porque "comparar o prazo com o relógio do sistema torna o teste dependente da data em que ele roda". Era a decisão **D1** de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md).

Junto com ela havia uma dívida concreta, anotada na nota de implementação da H-03: o fixture `SOPA` dos testes usava `validade: '2026-08-01'`, uma data que já passou. No dia em que a RN-03 fosse implementada, os testes verdes de H-01 e H-02 quebrariam em bloco, porque a doação de teste passaria a nascer vencida.

Dois fatos do sistema de hoje entram na decisão:

- **A função roda em UTC.** Escolhemos a Vercel ([ADR 0002](0002-hospedagem-na-vercel.md)) e a função está na região de Washington. Em UTC, o dia vira três horas antes do que vira em São Paulo: às 21h de São Paulo já é o dia seguinte para o servidor.
- **A `validade` é texto no banco**, no formato `AAAA-MM-DD`, herança do walking skeleton da Unidade 1, onde ela era só repassada da tela para o banco.

## Alternativas consideradas

1. **As regras leem o relógio do servidor.** Cada função de `src/doacoes.js` chama `new Date()` por dentro, e os testes criam doações com prazo relativo, como "hoje + 1 dia".
   - Prós: nenhum parâmetro novo; o código fica mais curto.
   - Contras: o teste do limite (CA-03.3) não tem como existir de verdade. Para provar que "venceu ontem" e "vence hoje" são coisas diferentes, o teste precisa de uma doação já vencida — e, sem controlar o "agora", só há dois caminhos: gravar a doação direto no banco, num estado que o sistema não produziria, ou mexer no relógio da máquina de quem roda os testes.
2. **O "agora" vira parâmetro das funções de regra**, com o relógio do servidor como valor padrão.
   - Prós: o teste fixa a data e o cenário "publiquei anteontem um prazo para ontem" passa pelo mesmo código que o sistema usa em produção; as rotas não mudam, porque o valor padrão continua sendo o relógio; é o mesmo desenho que já usávamos em `pelaSessao` para testar a expiração da sessão de 30 dias.
   - Contras: um parâmetro a mais em quatro funções; nada impede alguém de voltar a chamar `new Date()` dentro de uma regra no futuro.

Duas perguntas vêm junto, e as duas alternativas acima não as respondem:

**Qual é o "hoje": o do servidor em UTC ou o de São Paulo?** Medimos: `2026-10-28T02:00Z` é dia 27 às 23h em São Paulo. Com o dia do servidor, uma doação publicada às 21h30 para retirar "hoje" nasceria vencida.

**A `validade` continua texto ou vira data no banco?** Em `AAAA-MM-DD`, comparar como texto dá a mesma ordem que comparar como data, porque o campo mais significativo vem primeiro e todos têm largura fixa.

## Decisão

Alternativa **2**, com quatro regras:

- **O "agora" é parâmetro** de `criarDoacao`, `listarDisponiveis`, `aceitar` e `confirmarRetirada`, com `new Date()` como valor padrão.
- **"Hoje" é sempre o dia em São Paulo**, pela função `hojeNaRede` de `src/regras.js`. O fuso fica num lugar só, e não espalhado pelas regras.
- **O limite é inclusivo:** vale `validade >= hoje`. O que vence hoje aparece e pode ser aceito o dia inteiro.
- **A `validade` continua texto**, e a publicação passa a validar o formato. A comparação de texto só é confiável enquanto todo valor gravado estiver em `AAAA-MM-DD`, então quem garante isso é a validação na entrada, não a esperança.

Escolhemos a alternativa 2 por causa de um teste específico: o CA-03.3, que a análise já apontava como a fronteira da regra — "sem esse teste, 'vencida' e 'vence hoje' viram a mesma coisa por acidente". Com o relógio lido por dentro, esse teste não existe de forma honesta.

Sobre o fuso, escolhemos São Paulo porque o erro oposto é invisível e cai justamente na hora em que a rede funciona: o fim do expediente do doador. `tests/prazo.test.js` tem um teste só para isso.

Sobre a `validade`, mantivemos texto porque migrar para `DATE` mudaria o contrato da API — o Prisma devolveria um `DateTime`, que no JSON vira `2026-10-28T00:00:00.000Z` — e a tela, que lê a data como texto. Não ganharíamos nada hoje: a ordem da comparação é a mesma. Se um dia precisarmos de aritmética de datas no banco, a troca é uma migration com `USING validade::date`.

**O que não usamos como motivo:** "assim fica mais rápido". A comparação entra na mesma consulta que já buscava as doações disponíveis, e o volume da rede é desconhecido (INC-04).

## Consequências

- **Positivas:**
  - A RN-03 saiu de "pendente" e a H-03 fechou, com 7 testes em `tests/prazo.test.js`, incluindo o limite exato de hoje e quatro formatos de prazo recusados.
  - A dívida da Unidade 1 foi paga: o fixture `SOPA` saiu dos três arquivos de teste onde estava copiado, virou um só em `tests/apoio.js` e passou a ser calculado com `diaNaRede(1)`.
  - A doação vencida **não é apagada e não muda de estado**: ela continua `disponivel` no banco e só deixa de circular. A rastreabilidade prometida à vigilância sanitária depende de o registro continuar lá.
  - O calendário da tela recebeu `min` com o dia de hoje, então o celular recusa um prazo no passado antes de gastar uma viagem até o servidor. Quem decide continua sendo o servidor.
- **Negativas / o que abrimos mão:**
  - Quatro funções ganharam um parâmetro que, em produção, ninguém preenche.
  - O "hoje" da tela (`dataLocal`) vem do relógio do celular, e o do servidor vem do fuso de São Paulo. Um celular com fuso errado pode oferecer um dia que o servidor recusa; a mensagem de erro explica, e o servidor é quem manda.
  - A regra é por **dia**, não por hora. Uma doação publicada às 23h50 para retirar "hoje" vale dez minutos. A análise fala de prazo de retirada em dias, e tratar hora exigiria pedir mais um campo ao doador, contra o CONF-01.
- **Riscos e o que fazer:**
  - *Alguém gravar uma `validade` fora do formato e a comparação de texto errar* → a publicação valida o formato, e o teste cobre `31/12/2026`, `2026-13-01`, `2026-02-31` e `2026-2-3`. O `2026-02-31` é o caso traiçoeiro: `new Date` não reclama dele, vira 3 de março, então a validação confere se o dia volta igual ao que entrou.
  - *O servidor mudar de região e alguém achar que o fuso acompanha* → o fuso é fixo em `src/regras.js` e não depende da região. A mudança de região para São Paulo (`gru1`), que está no backlog, não altera a regra.

## Rastreabilidade

- **RN-03** e **H-03**, pendentes desde a Unidade 1, e os critérios **CA-03.1 a CA-03.4**.
- **Decisão D1** de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md): as duas alternativas aqui são as duas registradas lá.
- **Nota de implementação da H-03** em [`docs/analise.md`](../analise.md): a dívida do fixture com data fixa.
- **[ADR 0002](0002-hospedagem-na-vercel.md)**: a função roda em UTC, que é a origem da questão do fuso.
- **OBJ-02** (doações que vencem sem ninguém aceitar): a regra é o que permite distinguir, no banco, a doação que venceu da que ainda espera.
- **CONF-01**: não pedimos hora ao doador, só o dia.
