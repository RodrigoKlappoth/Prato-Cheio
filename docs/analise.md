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
| INC-05 | O que acontece quando a ONG aceita e não retira | Fora do escopo da U1; entra no backlog como história de cancelamento/no-show |

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
| RN-03 | "Se passou do horário, aquilo não presta mais" | Doação cujo **prazo de retirada já passou não aparece na lista de disponíveis e não pode ser aceita**. A tentativa de aceite é recusada com o motivo "prazo de retirada vencido". | Teste a escrever: publicar doação com prazo no passado → não aparece em `GET /api/doacoes` e `POST /api/doacoes/:id/aceitar` responde 400 | **Pendente** — vira a história H-03 |

**Contraexemplo do que não vale como regra:** "o sistema deve ser rápido", "tratar os casos especiais". Não têm sujeito, condição nem efeito — ninguém consegue dizer se foram cumpridas.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| H-01 | Como **doador**, quero publicar uma doação informando tipo, quantidade e prazo de retirada, para que as ONGs saibam da comida antes que ela vença. | **N**egotiable é fraca: os três campos vêm de RN-01/CONF-01 e não são negociáveis com o time — negociá-los significa reabrir o conflito com a vigilância. **S**mall e **T**estable estão ok. |
| H-02 | Como **ONG**, quero aceitar uma doação disponível e que ela saia da lista das demais, para que duas ONGs não deslocem voluntários para a mesma comida. | **I**ndependent falha: sem H-01 não existe doação para aceitar, então H-02 não entra em sprint sozinha. Podia ser fatiada (aceitar / sumir da lista / bloquear 2º aceite), mas as três partes sem as outras entregam meia regra — mantivemos junta assumindo o custo. |
| H-03 | Como **ONG**, quero que doações com prazo de retirada vencido não apareçam nem possam ser aceitas, para não deslocar voluntário para comida que não pode mais ser distribuída. | **T**estable exige uma decisão que ainda não tomamos: comparar o prazo com o relógio do sistema torna o teste dependente da data em que ele roda. Antes de implementar, o "agora" precisa ser injetável (ver nota abaixo). **E**stimable sofre com isso. |

**Nota de implementação da H-03 (dívida já identificada):** o fixture `SOPA` em `tests/doacoes.test.js` usa `validade: '2026-08-01'` — uma data que **já passou**. No dia em que RN-03 for implementada, os testes hoje verdes de H-01 e H-02 quebram em bloco, porque a doação de teste passa a nascer vencida. A correção vem junto com a história: o prazo passa a ser calculado relativamente (`hoje + 1 dia`) ou o "agora" vira parâmetro das funções de `src/doacoes.js`. Registrar isso agora evita descobrir na véspera da entrega.

**Fora do escopo da Unidade 1 (backlog):** autenticação de doador e de ONG, notificação às ONGs, cancelamento de aceite/no-show, campos opcionais de conservação, relatório de impacto para o patrocinador.

## Critérios de aceite

Cada critério aponta para o teste que o prova. Nome do teste entre aspas = existe em `tests/doacoes.test.js`; *(a escrever)* = ainda não.

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
  **Quando** chega um aceite sem o nome da ONG,
  **Então** o sistema responde `400` e a doação continua `disponivel`.
  → *(a escrever)* — a regra já existe em `src/doacoes.js`, mas nenhum teste a prova; sem teste, ela pode sumir numa refatoração

### H-03 — Doação vencida não circula (RN-03) — pendente

- **CA-03.1 — vencida não aparece**
  **Dado** que existe uma doação cujo prazo de retirada foi ontem,
  **Quando** a ONG consulta a lista de disponíveis,
  **Então** essa doação não aparece.
  → *(a escrever)*

- **CA-03.2 — vencida não pode ser aceita**
  **Dado** uma doação com prazo de retirada vencido,
  **Quando** uma ONG tenta aceitá-la,
  **Então** o sistema responde `400` com o motivo "prazo de retirada vencido" e a doação **não** muda para `aceita`.
  → *(a escrever)*

- **CA-03.3 — o limite é inclusivo**
  **Dado** uma doação cujo prazo de retirada é **hoje**,
  **Quando** a ONG consulta a lista,
  **Então** a doação aparece e pode ser aceita normalmente.
  → *(a escrever)* — é a fronteira da regra; sem esse teste, "vencida" e "vence hoje" viram a mesma coisa por acidente

- **CA-03.4 — não se publica algo já vencido**
  **Dado** que sou doador e informei um prazo de retirada no passado,
  **Quando** tento publicar,
  **Então** o sistema responde `400` com "prazo de retirada já vencido".
  → *(a escrever)*

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| A vigilância sanitária exigir registro de conservação e horário de preparo que a primeira versão não coleta (decisão CONF-01) | Média | Alto | Levar o critério de CONF-01 a uma conversa com a vigilância antes da Unidade 3; campos opcionais já previstos no modelo |

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
- **Riscos e limitações:** sem autenticação, qualquer pessoa aceita em nome de qualquer ONG e o campo `ong` é texto livre, sujeito a erro de digitação — aceitável enquanto a rede é a da Marta, com ONGs conhecidas, mas vira história obrigatória na U2. RN-03 fica de fora da U1 (vira H-03), então doação vencida ainda circula. O modelo não guarda o doador que publicou, o que limita a rastreabilidade prometida à vigilância — decisão consciente, ligada ao risco já registrado.

## Uso de IA

O que geramos com IA, o que verificamos e o que alteramos.

| Trecho | Ferramenta | O que fizemos depois |
|---|---|---|
| Rascunho das histórias H-01 a H-03, dos critérios de aceite e do protocolo do experimento | Claude (Anthropic) | Verificamos toda a informação, alteramos alguns pontos das histórias, excluimos alguns critérios


