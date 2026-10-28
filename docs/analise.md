# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

A rede da Marta já funciona — por WhatsApp. O doador avisa no grupo quando sobra comida, as ONGs respondem quando veem, e a Marta arbitra quem retira. O canal só funciona enquanto ela está online, não guarda quem ficou com o quê e não deixa rastro para a vigilância sanitária.

**Enunciado:** comida boa e disponível vence antes de chegar a quem precisa porque a oferta e a demanda só se encontram por um canal informal, dependente de uma pessoa, sem registro do que foi combinado.

O que **não** é o problema: falta de comida excedente (ela existe), falta de ONGs (elas existem) e falta de vontade de doar (o doador doa, se for rápido). O gargalo é a **coordenação entre o momento em que a comida fica disponível e o momento em que alguém a busca** — é por isso que OBJ-01 mede horas, não cadastros.

## Incertezas

O que ainda não sabemos, e como cada coisa se resolve. Nem toda incerteza vira experimento: algumas se resolvem com uma conversa, outras só aparecem em operação real.

| # | Incerteza | Como se resolve |
|---|---|---|
| INC-01 | Quanto atrito de cadastro o doador tolera antes de simplesmente descartar a comida | **Experimento** — é a hipótese H1 desta análise |
| INC-02 | O que a vigilância sanitária exige *por norma* e o que é interpretação nossa da fala da Renata | Conversa com a vigilância + leitura da norma, antes da Unidade 3 |
| INC-03 | Se "quem chega primeiro leva" (RN-02) é aceito pelas ONGs ou favorece quem tem alguém sempre olhando o celular | Conversa com 3 ONGs da rede; se for problema, vira história de fila/rodízio na U2 |
| INC-04 | Volume real de doações por dia — define se uma lista única em tela basta ou se precisa de filtro/busca | Só em operação; medir nas duas primeiras semanas |
| INC-05 | O que acontece quando a ONG aceita e não retira | Fora do escopo da U1; entra no backlog como história de cancelamento/no-show. **Respondida na U2:** a ONG cancela o aceite e a doação volta para a lista (H-07, [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)) |

## Stakeholders

Todo mundo que afeta ou é afetado pela solução — não só quem usa a tela.

### Mapa por interesse × influência

|                    | **Influência alta**                                   | **Influência baixa**                                |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------- |
| **Interesse alto** | *Gerenciar de perto:* Marta (coordenadora), ONGs e cozinhas comunitárias | *Manter informado:* voluntários entregadores, pessoas atendidas |
| **Interesse baixo**| *Manter satisfeito:* vigilância sanitária, patrocinador da rede, doadores | *Monitorar:* comunidade e imprensa local            |

**Por que os doadores estão em "interesse baixo, influência alta":** doar excedente não é o negócio deles, é o fim do expediente. O interesse é frágil e a qualquer atrito eles saem — mas sem eles não há produto. É exatamente essa combinação que produz o conflito registrado adiante.

### Detalhamento

| Stakeholder | Tipo | Interesse | Influência | O que espera |
|---|---|---|---|---|
| Marta — coordenadora da rede | Patrocinadora / operação | Alto | Alta | Que a rede funcione sem depender do WhatsApp dela; aceitar o máximo de doadores possível |
| ONGs e cozinhas comunitárias | Usuário | Alto | Média-alta | Saber com antecedência o que vem, em que quantidade e até quando pode ser retirado |
| Doadores — restaurantes, padarias, mercados | Usuário | Baixo-médio | Alta | Publicar a doação em segundos, sem burocracia e sem risco de responsabilização |
| Voluntários entregadores | Operação | Alto | Baixa | Endereço, horário e volume claros antes de sair para a coleta |
| Vigilância sanitária | Regulador | Baixo | Alta | Rastreabilidade: o que foi doado, por quem, quando e em que condição — pode barrar tudo |
| Pessoas atendidas | Usuário indireto / beneficiário | Alto | Baixa | Comida em condição segura, com regularidade |
| Patrocinador da rede (edital, prefeitura, doador financeiro) | Patrocinador | Baixo-médio | Alta | Números que provem impacto para justificar o financiamento |
| Comunidade e imprensa local | Externo | Baixo | Baixa | Transparência sobre o destino das doações |

**O que quase esquecemos:** a vigilância sanitária. Ela não usa o sistema, não paga por ele e não tem interesse no sucesso da rede — mas é a única que pode inviabilizar o produto inteiro.

## Objetivos de impacto

Resultado no mundo (*outcome*), não funcionalidade entregue (*output*). Linha de base a medir nas duas primeiras semanas de operação real; as metas são revisadas depois da primeira medição.

| # | Objetivo | Indicador | Meta | Prazo |
|---|---|---|---|---|
| OBJ-01 | Reduzir o tempo entre a comida ficar disponível e ser coletada | Mediana de horas entre a publicação da doação e a confirmação da retirada | ≤ 4 horas | 3 meses após entrar no ar |
| OBJ-02 | Reduzir o descarte de comida boa nos doadores da rede | % de doações publicadas que vencem sem nenhuma ONG aceitar | ≤ 10% | 3 meses |
| OBJ-03 | Aumentar as refeições que chegam a quem precisa | Porções coletadas por mês pelas ONGs da rede | +30% sobre a linha de base | 6 meses |

**Falsos objetivos que descartamos:** "lançar o app", "ter 10 telas prontas", "cadastrar 50 doadores". São entregas (*output*) — cabe cumprir os três e não mover nenhum dos indicadores acima.

## Conflitos de prioridade

### CONF-01 — Velocidade do cadastro × rastreabilidade sanitária

**Falas que se contradizem**

- **Seu Paulo, dono da padaria (doador):** "No fim do expediente eu tenho 30 segundos. Se tiver formulário para preencher, eu jogo fora e pronto."
- **Renata, fiscal da vigilância sanitária (regulador):** "Sem registro de tipo, quantidade, condição de conservação e prazo de consumo, essa doação não é rastreável. Se alguém passar mal, a rede responde."

**O conflito, por escrito:** cada campo obrigatório no cadastro aumenta a rastreabilidade exigida pelo regulador e, ao mesmo tempo, aumenta a chance de o doador desistir e descartar a comida. Um stakeholder de alta influência quer *menos* dado; outro, também de alta influência, quer *mais*. Não há solução que atenda os dois integralmente.

**Critério de decisão adotado:** um campo só é obrigatório se (a) for exigido por norma sanitária, ou (b) a ONG não conseguir decidir se aceita a doação sem ele. Todo o resto é opcional e pode ser preenchido depois da publicação. Na dúvida entre um campo a mais e um doador a menos, **o campo fica fora** — exceto quando cai em (a).

**Consequência concreta:** o cadastro fica com três campos obrigatórios — tipo, quantidade e prazo de retirada (RN-01). Origem, condição de conservação e observações entram como opcionais, com valores padrão por doador recorrente.

**Quem perde o quê:**
- O doador perde ~20 segundos que gostaria de não gastar.
- A vigilância não recebe, na primeira versão, o registro de temperatura e horário de preparo — assumimos esse risco de forma explícita e ele entra na seção de Riscos.
- A ONG perde a antecedência que gostaria de ter: só sabe o que vem quando é publicado.

**Como saberemos que erramos:** se mais de 20% dos cadastros iniciados forem abandonados antes de publicar, o critério pesou demais para o lado da rastreabilidade e precisa ser revisto. Se aparecer qualquer ocorrência sanitária, ele pesou de menos.

## Regras de negócio

Regras que ninguém enuncia — estão no hábito de quem opera. Aqui viram frase com sujeito, condição e efeito, e por isso viram teste.

| # | Como aparece implícito | Enunciado explícito e verificável | Como se verifica | Situação |
|---|---|---|---|---|
| RN-01 | "A gente anota mais ou menos o que sobrou" | Toda doação publicada deve informar **tipo, quantidade e prazo de retirada**. Faltando qualquer um dos três, o sistema recusa a publicação e informa quais campos faltam. | `tests/doacoes.test.js` → "recusa doação sem os campos obrigatórios" | Implementada |
| RN-02 | "Quem chegar primeiro leva" | Uma doação **aceita por uma ONG deixa de estar disponível para as demais**: muda para o estado *aceita*, registra qual ONG aceitou e sai da lista de disponíveis. Uma segunda tentativa de aceite é recusada, informando quem já aceitou. | `tests/doacoes.test.js` → "remove a doação da lista de disponíveis depois de aceita" e "recusa aceitar uma doação que já foi aceita por outra ONG" | Implementada |
| RN-03 | "Se passou do horário, aquilo não presta mais" | Doação cujo **prazo de retirada já passou não aparece na lista de disponíveis e não pode ser aceita**. A tentativa de aceite é recusada com o motivo "prazo de retirada vencido". O limite é o dia de hoje em São Paulo, inclusive: o que vence hoje ainda circula. Publicar com prazo no passado também é recusado. | `tests/prazo.test.js` → "CA-03.1 — não mostra na lista a doação com prazo de ontem", "CA-03.2 — recusa o aceite de uma doação com o prazo vencido" e os dois testes do CA-03.3 | Implementada na U2 ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)) |
| RN-05 | "Se a ONG desistir, ela avisa no grupo e o doador publica de novo" | **Só a ONG que aceitou** confirma a retirada ou cancela o aceite. O cancelamento devolve a doação para `disponivel` e apaga o aceite; a retirada confirmada é o fim da linha e não pode ser desfeita. | `tests/historico.test.js` → "devolve a doação para a lista das outras ONGs, sem rastro do aceite", "recusa cancelar o aceite de outra ONG" e "recusa cancelar depois de a retirada estar confirmada" | Implementada na U2 ([ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)) |
| RN-04 | "Essas ONGs aí eu conheço" | Só **ONG com conta aprovada pela coordenação da sua cidade** aceita doações. ONG com conta pendente ou recusada entra e vê a lista, mas o aceite é recusado com o motivo, e a doação continua *disponivel*. | `tests/aprovacao.test.js` → "deixa a ONG pendente ver a lista, mas recusa o aceite dela" e "recusa o aceite da ONG que a coordenação recusou" | Implementada na U2 ([ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md)) |

**Contraexemplo do que não vale como regra:** "o sistema deve ser rápido", "tratar os casos especiais". Não têm sujeito, condição nem efeito — ninguém consegue dizer se foram cumpridas.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| H-01 | Como **doador**, quero publicar uma doação informando tipo, quantidade e prazo de retirada, para que as ONGs saibam da comida antes que ela vença. | **N**egotiable é fraca: os três campos vêm de RN-01/CONF-01 e não são negociáveis com o time — negociá-los significa reabrir o conflito com a vigilância. **S**mall e **T**estable estão ok. |
| H-02 | Como **ONG**, quero aceitar uma doação disponível e que ela saia da lista das demais, para que duas ONGs não deslocem voluntários para a mesma comida. | **I**ndependent falha: sem H-01 não existe doação para aceitar, então H-02 não entra em sprint sozinha. Podia ser fatiada (aceitar / sumir da lista / bloquear 2º aceite), mas as três partes sem as outras entregam meia regra — mantivemos junta assumindo o custo. |
| H-03 | Como **ONG**, quero que doações com prazo de retirada vencido não apareçam nem possam ser aceitas, para não deslocar voluntário para comida que não pode mais ser distribuída. | **T**estable exigia uma decisão que a Unidade 1 não tomou: comparar o prazo com o relógio do sistema torna o teste dependente da data em que ele roda. Antes de implementar, o "agora" precisava ser injetável (ver nota abaixo). **E**stimable sofria com isso. **Resolvido na U2** pela decisão D1, registrada no [ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md). |
| H-04 *(U2)* | Como **doador ou ONG**, quero entrar com meu e-mail e senha, para que o sistema saiba quem publicou e quem aceitou cada doação e ninguém aceite em nome de uma ONG. | **S**mall é a mais fraca: junta cadastro, login, sessão e a regra de quem pode o quê. Não fatiamos porque qualquer parte sozinha deixa o sistema tão aberto quanto antes. Nasce da Decisão de análise e do ADR 0003. |
| H-05 *(U2)* | Como **ONG**, quero criar minha própria conta informando a minha cidade, para entrar na rede sem esperar que alguém da equipe de desenvolvimento me cadastre. | **I**ndependent falha, e de propósito: a conta nasce pendente, então sem a H-06 ninguém a aprova e ela nunca aceita uma doação. **V**aluable sozinha é fraca pelo mesmo motivo. As duas entram juntas. Nasce do [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md). |
| H-06 *(U2)* | Como **coordenação da minha cidade**, quero ver os pedidos de conta de ONG da minha cidade e aprovar ou recusar cada um, para que só ONGs que eu conheço aceitem doações. | **S**mall é a mais fraca: traz um papel novo, uma tela nova e um estado novo na conta. Não fatiamos porque aprovar sem o cadastro da H-05 não tem o que aprovar. **T**estable é forte: cada decisão fica gravada com quem decidiu e quando. |
| H-07 *(U2)* | Como **ONG**, quero confirmar a retirada ou cancelar o aceite, e **como doador**, quero ver o que aconteceu com o que publiquei, para que a comida que uma ONG não vai buscar volte para a lista em vez de vencer reservada. | **I**ndependent é fraca: depende de H-01 e H-02 existirem. **V**aluable é a mais forte das três partes juntas, e é por isso que não fatiamos: o cancelamento sozinho resolveria o risco da ONG que não retira, mas sem a confirmação de retirada o OBJ-01 continuaria sem poder ser medido, e sem o histórico ninguém encontraria a doação para cancelar. Nasce da decisão D2 e do [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md). |

**Nota de implementação da H-03 (dívida já identificada):** o fixture `SOPA` em `tests/doacoes.test.js` usa `validade: '2026-08-01'` — uma data que **já passou**. No dia em que RN-03 for implementada, os testes hoje verdes de H-01 e H-02 quebram em bloco, porque a doação de teste passa a nascer vencida. A correção vem junto com a história: o prazo passa a ser calculado relativamente (`hoje + 1 dia`) ou o "agora" vira parâmetro das funções de `src/doacoes.js`. Registrar isso agora evita descobrir na véspera da entrega.

> **Dívida paga na Unidade 2, e a previsão estava certa.** Implementamos a RN-03 e corrigimos o fixture no mesmo passo, então não vimos a quebra acontecer — fomos medi-la de propósito. Com a RN-03 valendo e o fixture de volta para `validade: '2026-08-01'`, **23 testes quebram, em 4 dos 6 arquivos**: a doação de teste nasce vencida, não aparece na lista e não pode ser aceita, então tudo que depende dela cai. Fizemos as **duas** correções que a nota propunha, e não uma: o "agora" virou parâmetro ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)) **e** o prazo passou a ser relativo. O fixture, que estava copiado nos três arquivos de teste, virou um só em `tests/apoio.js`, calculado por `diaNaRede(1)`. Ter a dívida escrita na Unidade 1 transformou o que seria uma tarde de confusão em uma linha de plano.

**Fora do escopo da Unidade 1 (backlog):** autenticação de doador e de ONG, notificação às ONGs, cancelamento de aceite/no-show, campos opcionais de conservação, relatório de impacto para o patrocinador. Na Unidade 2, a autenticação saiu desta lista e virou a H-04 ([ADR 0003](adr/0003-identificacao-por-email-e-senha.md)), e a entrada de ONGs na rede virou as histórias H-05 e H-06 ([ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md)).

## Critérios de aceite

Cada critério aponta para o teste que o prova. Nome do teste entre aspas = existe em `tests/doacoes.test.js` ou `tests/contas.test.js`; *(a escrever)* = ainda não.

### H-01 — Doador publica uma doação

- **CA-01.1 — publicação válida**
  **Dado** que sou doador e informei tipo `"Sopa"`, quantidade `"10 porções"` e prazo de retirada,
  **Quando** publico a doação,
  **Então** o sistema responde `201`, cria a doação com status `disponivel` e ela passa a aparecer na lista de disponíveis.
  → "mostra a doação publicada na lista de disponíveis"

- **CA-01.2 — campos obrigatórios faltando (RN-01)**
  **Dado** que informei apenas o tipo `"Pão"` e deixei quantidade em branco e prazo ausente,
  **Quando** tento publicar,
  **Então** o sistema responde `400`, a mensagem de erro nomeia *quantidade* e *validade*, e nada é gravado — a lista de disponíveis continua vazia.
  → "recusa doação sem os campos obrigatórios"

- **CA-01.3 — espaço em branco não preenche campo**
  **Dado** que preenchi um campo obrigatório só com espaços (`"   "`),
  **Quando** tento publicar,
  **Então** o sistema trata o campo como não preenchido e recusa com `400`.
  → coberto pelo mesmo teste acima (o fixture usa `quantidade: '  '`)

### H-02 — ONG aceita uma doação (RN-02)

- **CA-02.1 — aceite válido**
  **Dado** que existe uma doação `disponivel`,
  **Quando** a ONG "Banco de Alimentos" a aceita,
  **Então** o sistema responde `200` e a doação passa a ter status `aceita` com a ONG registrada.
  → "marca a doação como aceita pela ONG"

- **CA-02.2 — sai da lista, e só ela**
  **Dado** que existem duas doações disponíveis,
  **Quando** uma delas é aceita,
  **Então** a lista de disponíveis passa a conter exatamente a outra.
  → "remove a doação da lista de disponíveis depois de aceita"

- **CA-02.3 — segundo aceite é recusado**
  **Dado** que a doação já foi aceita pelo "Banco de Alimentos",
  **Quando** a "Casa de Apoio" tenta aceitá-la,
  **Então** o sistema responde `400` e a mensagem informa **qual** ONG já aceitou.
  → "recusa aceitar uma doação que já foi aceita por outra ONG"

- **CA-02.4 — doação inexistente**
  **Dado** um identificador que não corresponde a nenhuma doação,
  **Quando** uma ONG tenta aceitá-lo,
  **Então** o sistema responde `400` com "não encontrada".
  → "recusa aceitar uma doação que não existe"

- **CA-02.5 — ONG precisa se identificar**
  **Dado** uma doação disponível,
  **Quando** chega um aceite de quem não entrou como ONG, mesmo que o pedido traga um nome de ONG,
  **Então** o sistema responde `401` e a doação continua `disponivel`.
  → "recusa aceite de quem não entrou como ONG". Na U1 o teste era "recusa aceitar sem informar a ONG" e esperava `400`: escrevê-lo revelou que a rota preenchia `"ONG"` como nome padrão, e o padrão foi removido. Com a H-04, o nome da ONG passou a vir da conta, e não do que é digitado.

### H-03 — Doação vencida não circula (RN-03) — Unidade 2

Testes em `tests/prazo.test.js`.

- **CA-03.1 — vencida não aparece**
  **Dado** que existe uma doação cujo prazo de retirada foi ontem,
  **Quando** a ONG consulta a lista de disponíveis,
  **Então** essa doação não aparece — mas continua gravada, e com o estado que tinha: a rastreabilidade prometida à vigilância depende de o registro não desaparecer.
  → "CA-03.1 — não mostra na lista a doação com prazo de ontem"

- **CA-03.2 — vencida não pode ser aceita**
  **Dado** uma doação com prazo de retirada vencido,
  **Quando** uma ONG tenta aceitá-la,
  **Então** o sistema responde `400` com o motivo "prazo de retirada vencido" e a doação **não** muda para `aceita`.
  → "CA-03.2 — recusa o aceite de uma doação com o prazo vencido"

- **CA-03.3 — o limite é inclusivo**
  **Dado** uma doação cujo prazo de retirada é **hoje**,
  **Quando** a ONG consulta a lista,
  **Então** a doação aparece e pode ser aceita normalmente.
  → "CA-03.3 — o limite é hoje, inclusive: o que vence hoje aparece e é aceito" e "CA-03.3 — 'vence hoje' e 'venceu ontem' não viram a mesma coisa". É a fronteira da regra: sem esse teste, "vencida" e "vence hoje" viram a mesma coisa por acidente. São dois testes porque um prova que hoje passa e o outro prova que hoje e ontem são tratados de forma diferente **na mesma lista**.

- **CA-03.4 — não se publica algo já vencido**
  **Dado** que sou doador e informei um prazo de retirada no passado,
  **Quando** tento publicar,
  **Então** o sistema responde `400` com "prazo de retirada já vencido" e nada é gravado.
  → "CA-03.4 — recusa publicar com o prazo no passado" e "CA-03.4 — recusa publicar com um prazo que não é um dia de verdade", que cobre `31/12/2026`, `2026-13-01`, `2026-02-31`, `amanhã` e `2026-2-3`

- **CA-03.5 — "hoje" é o dia de São Paulo, não o do servidor** *(novo na U2)*
  **Dado** que a função roda em UTC ([ADR 0002](adr/0002-hospedagem-na-vercel.md)) e são 23h de um dia em São Paulo,
  **Quando** a regra pergunta que dia é hoje,
  **Então** a resposta é o dia em São Paulo, e não o dia seguinte que o relógio do servidor já marca.
  → "às 23h de São Paulo ainda é o dia anterior ao do relógio em UTC". Sem este critério, uma doação publicada no fim do expediente para retirar "hoje" nasceria vencida ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)).

### H-07 — Retirada confirmada e aceite cancelado (RN-05, ADR 0008) — Unidade 2

Testes em `tests/historico.test.js`.

- **CA-07.1 — o doador vê o que aconteceu com o que publicou**
  **Dado** que publiquei duas doações e uma ONG aceitou uma delas,
  **Quando** abro minhas doações recentes,
  **Então** vejo as duas, a mais recente primeiro, uma como `aceita` com o nome da ONG e a outra como `disponivel`.
  → "o doador vê o que publicou, com o estado e quem levou"

- **CA-07.2 — a ONG vê só o que ela aceitou**
  **Dado** que duas ONGs aceitaram uma doação cada,
  **Quando** cada uma abre o seu histórico,
  **Então** cada uma vê só a doação que ela mesma aceitou.
  → "a ONG vê só o que ela mesma aceitou"

- **CA-07.3 — confirmar a retirada grava a hora que o OBJ-01 mede**
  **Dado** uma doação que aceitei,
  **Quando** confirmo a retirada,
  **Então** o sistema responde `200`, a doação passa a `retirada`, e o banco guarda `aceita_em` e `retirada_em` — os dois instantes que, com o `criada_em`, fecham a conta do OBJ-01.
  → "registra a retirada com a hora, que é o que o OBJ-01 mede"

- **CA-07.4 — retirada é o fim da linha**
  **Dado** uma doação com retirada confirmada,
  **Quando** outra ONG tenta aceitá-la, ou eu tento confirmar de novo, ou tento cancelar,
  **Então** ela não volta para a lista e as três tentativas são recusadas com o motivo.
  → "a doação retirada não volta para a lista nem pode ser aceita por outra ONG", "recusa confirmar a mesma retirada duas vezes" e "recusa cancelar depois de a retirada estar confirmada"

- **CA-07.5 — cancelar devolve a doação para as outras ONGs**
  **Dado** uma doação que aceitei e não vou buscar,
  **Quando** cancelo o aceite,
  **Então** ela volta a `disponivel` sem rastro do aceite (sem ONG, sem `ong_id`, sem `aceita_em`), aparece na lista das outras ONGs com o mesmo `id` e outra ONG consegue aceitá-la.
  → "devolve a doação para a lista das outras ONGs, sem rastro do aceite"

- **CA-07.6 — só quem aceitou mexe no aceite**
  **Dado** uma doação aceita pelo "Banco de Alimentos",
  **Quando** a "Casa de Apoio" tenta confirmar a retirada ou cancelar, ou o doador tenta confirmar,
  **Então** o sistema responde `403` e a doação continua `aceita` com a ONG original.
  → "recusa confirmar a retirada de uma doação que não é sua", "recusa cancelar o aceite de outra ONG" e "recusa o doador confirmar a retirada da própria doação"

- **CA-07.7 — doação que ninguém aceitou, que não existe, e sem login**
  **Dado** uma doação `disponivel`, um id inexistente, um id que não é número, ou nenhum login,
  **Quando** tento confirmar a retirada ou cancelar,
  **Então** o sistema responde `400` com "não está aceita por ninguém", `400` com "não encontrada", `400` com "id de doação inválido" e `401` sem login.
  → "recusa confirmar a retirada de uma doação que ninguém aceitou" e "recusa cancelar e confirmar uma doação que não existe, e com id que não é número"

- **CA-07.8 — a coordenação não tem histórico de doações**
  **Dado** que entrei como coordenação,
  **Quando** abro as doações recentes,
  **Então** o sistema responde `403`: a coordenação decide sobre contas, e doação não tem cidade para ela filtrar.
  → "a coordenação não tem histórico de doações, porque a doação não tem cidade"

### H-04 — Doador e ONG entram com e-mail e senha (RN-02, ADR 0003) — Unidade 2

Testes em `tests/contas.test.js`, exceto quando indicado.

- **CA-04.1 — o doador cria a própria conta**
  **Dado** que informei nome, e-mail e uma senha com pelo menos 8 caracteres,
  **Quando** crio minha conta,
  **Então** o sistema responde `201`, já me deixa conectado como doador e a resposta não traz a senha.
  → "cria a conta e já deixa o doador conectado"

- **CA-04.2 — o cadastro da tela cria doador ou ONG, e mais nada**
  **Dado** um pedido de cadastro que diz ser de coordenação,
  **Quando** ele é enviado,
  **Então** a conta criada é de doador, sem cidade.
  → "cria conta de doador quando o pedido pede um papel que a tela não cria". Até o [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md), este critério dizia que o cadastro da tela criava **só** doador, e o teste se chamava "cria sempre conta de doador, mesmo que o pedido diga ONG". O ADR 0006 previu esta mudança: a tela passou a criar ONG pendente (H-05), e o que o critério protege agora é a fronteira que sobrou — ninguém vira coordenação preenchendo o formulário.

- **CA-04.3 — cadastro inválido é recusado com o motivo**
  **Dado** um e-mail que já tem cadastro, ou uma senha com menos de 8 caracteres,
  **Quando** tento criar a conta,
  **Então** o sistema responde `400` dizendo o motivo.
  → "recusa e-mail que já tem cadastro" e "recusa senha com menos de 8 caracteres"

- **CA-04.4 — senha errada não entra**
  **Dado** uma conta existente,
  **Quando** alguém tenta entrar com a senha errada,
  **Então** o sistema responde `401` com "e-mail ou senha incorretos", sem dizer qual dos dois errou, e a pessoa continua desconectada.
  → "recusa entrar com a senha errada"

- **CA-04.5 — cada um só faz a sua parte**
  **Dado** que não entrei, ou que entrei com o papel errado,
  **Quando** tento publicar sem entrar, publicar como ONG ou aceitar como doador,
  **Então** o sistema responde `401` sem login e `403` com o papel errado, e a doação continua `disponivel`.
  → "recusa publicar sem entrar", "recusa publicação feita por ONG" e "recusa aceite feito por doador"; o aceite sem login é o CA-02.5

- **CA-04.6 — o sistema registra quem fez**
  **Dado** que a Padaria do Seu Paulo publicou e o Banco de Alimentos aceitou,
  **Quando** a doação é listada e depois aceita,
  **Então** a lista mostra quem doou e o aceite grava o nome da conta da ONG, mesmo que o pedido traga outro nome.
  → "registra quem publicou e quem aceitou"

- **CA-04.7 — a senha nunca é guardada como texto**
  **Dado** uma conta criada,
  **Quando** olhamos o banco,
  **Então** existe só o resumo (hash) da senha, e não a senha.
  → "guarda só o hash da senha, nunca a senha"

- **CA-04.8 — a sessão termina**
  **Dado** que entrei,
  **Quando** saio, ou quando se passam 30 dias,
  **Então** a próxima ação pede login de novo.
  → "sair encerra a sessão" e "a sessão expira depois de 30 dias"

### H-05 — A ONG cria a própria conta (RN-04, ADR 0006) — Unidade 2

Testes em `tests/aprovacao.test.js`.

- **CA-05.1 — a conta de ONG nasce pendente**
  **Dado** que informei nome, e-mail, senha e a cidade da minha ONG,
  **Quando** crio a conta pela tela,
  **Então** o sistema responde `201`, a conta vem com papel `ong` e situação `pendente`, e eu já fico conectada.
  → "cria a conta pendente e já deixa a ONG entrar"

- **CA-05.2 — ONG sem cidade é recusada**
  **Dado** um cadastro de ONG com a cidade em branco (ou só com espaços),
  **Quando** tento criar a conta,
  **Então** o sistema responde `400` nomeando *cidade*, e nenhuma conta é gravada.
  → "recusa o cadastro de ONG sem cidade, porque a coordenação é por cidade". A cidade é obrigatória porque é ela que define **qual** coordenação decide sobre a conta.

- **CA-05.3 — pendente vê, mas não aceita**
  **Dado** que minha conta de ONG está pendente e existe uma doação disponível,
  **Quando** consulto a lista e tento aceitar,
  **Então** a lista mostra a doação, o aceite responde `403` dizendo que a conta aguarda a aprovação da coordenação da minha cidade, e a doação continua `disponivel`.
  → "deixa a ONG pendente ver a lista, mas recusa o aceite dela"

- **CA-05.4 — recusada também não aceita**
  **Dado** que a coordenação recusou minha conta,
  **Quando** tento aceitar uma doação,
  **Então** o sistema responde `403` dizendo que a coordenação da minha cidade não aprovou a conta.
  → "recusa o aceite da ONG que a coordenação recusou"

- **CA-05.5 — a ONG cadastrada pela coordenação não espera nada**
  **Dado** que a coordenação criou a conta pelo terminal (`npm run ong:criar`),
  **Quando** a ONG entra,
  **Então** a conta já está `aprovada` e ela aceita doações na hora.
  → "nasce aprovada e aceita doações na hora". É a regra "as ONGs que já existem continuam aprovadas" do ADR 0006.

### H-06 — A coordenação da cidade aprova ou recusa (RN-04, ADR 0006) — Unidade 2

Testes em `tests/aprovacao.test.js`.

- **CA-06.1 — cada coordenação vê só a sua cidade**
  **Dado** que coordeno Santo André e existem um pedido pendente em Santo André, um pedido pendente em Diadema e uma ONG já aprovada em Santo André,
  **Quando** abro os pedidos,
  **Então** vejo exatamente um pedido: o pendente de Santo André.
  → "mostra só os pedidos pendentes da cidade de quem coordena"

- **CA-06.2 — aprovar libera o aceite e deixa rastro**
  **Dado** um pedido pendente da minha cidade,
  **Quando** aprovo,
  **Então** o sistema responde `200` com a situação `aprovada`, a ONG passa a aceitar doações **sem precisar entrar de novo**, e o banco guarda quem aprovou e quando.
  → "aprovar deixa a ONG aceitar e registra quem aprovou e quando"

- **CA-06.3 — a aprovação pode ser desfeita**
  **Dado** uma ONG que eu já aprovei,
  **Quando** eu a recuso,
  **Então** ela volta a não aceitar doações, e a doação que ela tentar aceitar continua `disponivel`.
  → "desfaz uma aprovação, e a ONG volta a não aceitar". É a saída prevista no ADR 0006 para o risco "um coordenador aprova quem não é ONG".

- **CA-06.4 — só a coordenação decide**
  **Dado** que entrei como doador ou como ONG,
  **Quando** tento aprovar um pedido ou abrir a lista de pedidos,
  **Então** o sistema responde `403` e o pedido continua `pendente`.
  → "recusa quem não é da coordenação, mesmo entrando como doador ou ONG"

- **CA-06.5 — ninguém decide fora da sua cidade**
  **Dado** que coordeno Santo André e o pedido é de Diadema,
  **Quando** tento aprovar,
  **Então** o sistema responde `403`, a mensagem nomeia as duas cidades, e o pedido continua `pendente`.
  → "recusa aprovar uma ONG de outra cidade"

- **CA-06.6 — pedido que não existe, conta que não é ONG, e sem login**
  **Dado** o id de um doador, um id inexistente, um id que não é número, ou nenhum login,
  **Quando** tento aprovar,
  **Então** o sistema responde `400` com "conta de ONG não encontrada" nos dois primeiros, `400` com "id de conta inválido" no terceiro e `401` sem login — e nada muda.
  → "recusa aprovar uma conta que não é de ONG", "recusa aprovar uma conta que não existe e um id que não é número" e "recusa aprovar e ver os pedidos sem entrar"

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| A vigilância sanitária exigir registro de conservação e horário de preparo que a primeira versão não coleta (decisão CONF-01) | Média | Alto | Levar o critério de CONF-01 a uma conversa com a vigilância antes da Unidade 3; campos opcionais já previstos no modelo |
| Uma ONG aceita a doação e não retira. Pela RN-02 a doação some da lista das outras no instante do aceite e não existe cancelamento (INC-05): a comida fica reservada para quem não vem e vence — exatamente o que OBJ-02 mede | Média | Alto | **U1, sem código:** combinado com a Marta — a ONG que desistir avisa no grupo e o doador publica de novo. **U2, implementado (H-07, [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)):** a ONG cancela o aceite e a doação volta para `disponivel` na hora, e o modelo passou a registrar `aceita_em` e `retirada_em` — os dois campos que a U1 já tinha previsto por nome. **Risco reduzido, não fechado:** a ONG que não cancelar nem retirar continua segurando a comida até vencer. Só a liberação automática fecha, e ela depende de tarefa agendada |

## Hipótese e experimento

**Suposição escolhida (INC-01):** decidimos em CONF-01 que três campos obrigatórios são "rápidos o bastante" para o Seu Paulo. Ninguém mediu isso — é uma suposição nossa apoiada em uma única fala. Se ela estiver errada, o produto perde doadores em silêncio: eles não reclamam, apenas jogam a comida fora.

**Por que esta e não outra:** é a suposição que sustenta o critério de decisão de CONF-01 e afeta diretamente OBJ-02. As outras incertezas se resolvem com conversa (INC-02, INC-03) ou só com operação real (INC-04).

**Hipótese H1 (falsificável):**
> Acreditamos que, com o cadastro reduzido a três campos obrigatórios (tipo, quantidade e prazo de retirada), um doador consegue publicar uma doação sozinho, pelo celular, em **até 30 segundos**, e **menos de 20%** dos cadastros iniciados são abandonados antes da publicação.
> Saberemos que estamos certos quando, em 8 doadores reais observados, a **mediana** do tempo entre o primeiro toque no formulário e a tela de confirmação for **≤ 30 s** e a taxa de abandono for **≤ 20%**.
> Saberemos que estamos errados se a mediana passar de **60 s** ou o abandono passar de **20%**.

**Hipótese nula que aceitamos rejeitar:** o número de campos obrigatórios não afeta a conclusão do cadastro dentro dessa faixa.

**Experimento (resumo):** teste de usabilidade cronometrado com 8 doadores da rede da Marta, no balcão deles, no fim do expediente, no celular deles, sem ajuda. Tarefa única: "sobraram 10 porções de sopa, publique para as ONGs". Métrica primária: mediana do tempo até o `201`. Secundária: taxa de abandono. *Guardrail:* % de doações que a ONG não consegue decidir sem ligar de volta — protege contra "ficou rápido porque ficou inútil". Duas tardes, custo zero.

**O que muda conforme o resultado:**

| Resultado | Decisão |
|---|---|
| Mediana ≤ 30 s **e** abandono ≤ 20% | Mantemos os três campos; CONF-01 fica fechado e a análise segue |
| Mediana > 60 s **ou** abandono > 20% | Quantidade vira opcional (fica só tipo + prazo), e reabrimos CONF-01 com a vigilância antes da U2 |
| Zona cinzenta (30–60 s, abandono 10–20%) | Não mexemos em nada por sensação: mantemos e re-medimos com telemetria nas duas primeiras semanas de operação |

O protocolo completo — participantes, roteiro, instrumentação, ameaças à validade — está em [`docs/experimento-h1.md`](experimento-h1.md).

## Decisão de análise

- **Problema:** por onde cortar a primeira fatia (walking skeleton da Unidade 1), sabendo que ela precisa atravessar a arquitetura inteira e ainda assim caber no prazo.
- **Alternativas:**
  1. Começar por cadastro e autenticação de doadores e ONGs.
  2. Começar pelo fluxo publicar → listar → aceitar, sem autenticação.
  3. Começar pela notificação (avisar as ONGs quando surge doação).
- **Decisão e justificativa:** alternativa **2**. É a menor fatia que sai da tela, passa pelas regras (`src/doacoes.js`), pelo SQL (`src/repositorio.js`) e chega ao banco — e é a única das três que mexe em OBJ-01, o indicador que define o problema. A (1) constrói infraestrutura antes de existir o que proteger; a (3) só faz sentido depois que existe doação publicada para notificar.
- **Riscos e limitações:** sem autenticação, qualquer pessoa aceita em nome de qualquer ONG e o campo `ong` é texto livre, sujeito a erro de digitação — aceitável enquanto a rede é a da Marta, com ONGs conhecidas, mas vira história obrigatória na U2 (atendido na U2 pela H-04 e pelo [ADR 0003](adr/0003-identificacao-por-email-e-senha.md)). RN-03 fica de fora da U1 (vira H-03), então doação vencida ainda circula. O modelo não guarda o doador que publicou, o que limita a rastreabilidade prometida à vigilância — decisão consciente, ligada ao risco já registrado.

## Uso de IA

O que geramos com IA, o que verificamos e o que alteramos.

| Trecho | Ferramenta | O que fizemos depois |
|---|---|---|
| Rascunho das histórias H-01 a H-03, dos critérios de aceite e do protocolo do experimento | Claude (Anthropic) | Verificamos toda a informação, alteramos alguns pontos das histórias, excluimos alguns critérios |
| Teste do CA-02.5 ("recusa aceitar sem informar a ONG"), remoção do nome padrão `"ONG"` na rota de aceite, segundo risco da tabela e atualização do README | Claude Code (Anthropic) | Revisamos o teste novo e a linha alterada na rota, rodamos `npm test` (8 passando) e ajustamos a redação do segundo risco |
| História H-04, critérios CA-04.1 a CA-04.8 e atualização do CA-02.5 | Claude Code (Anthropic) | Escolhemos e-mail e senha como identificação; revisamos os critérios e conferimos cada um contra o teste correspondente |
| Histórias H-05 e H-06, regra RN-04, critérios CA-05.1 a CA-06.6 e reescrita do CA-04.2 | Claude Code (Anthropic) | A decisão já estava tomada por nós no ADR 0006; conferimos cada critério contra o nome do teste em `tests/aprovacao.test.js` e verificamos que os 13 testes novos têm dente, desligando a regra do aceite e vendo 3 deles falharem |
| História H-07, regras RN-03 e RN-05, critérios CA-03.1 a CA-03.5 e CA-07.1 a CA-07.8 | Claude Code (Anthropic) | Escolhemos as alternativas das decisões D1 e D2; medimos a quebra que a nota de implementação da H-03 previa, em vez de escrever o número de memória (23 testes em 4 arquivos); conferimos o fuso de São Paulo com datas reais antes de aceitar a regra |


