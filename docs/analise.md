# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

<!-- Aula 01 — preencher com o problema central escrito pelo grupo. -->

## Incertezas

<!-- Aula 01 — preencher com as incertezas levantadas pelo grupo. -->

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
| RN-03 | "Se passou do horário, aquilo não presta mais" | Doação cujo **prazo de retirada já passou não aparece na lista de disponíveis e não pode ser aceita**. A tentativa de aceite é recusada com o motivo "prazo de retirada vencido". | Teste a escrever: publicar doação com prazo no passado → não aparece em `GET /api/doacoes` e `POST /api/doacoes/:id/aceitar` responde 400 | **Pendente** — vira história de usuário |

**Contraexemplo do que não vale como regra:** "o sistema deve ser rápido", "tratar os casos especiais". Não têm sujeito, condição nem efeito — ninguém consegue dizer se foram cumpridas.

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|

## Critérios de aceite
**História X** — Dado … Quando … Então …

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| A vigilância sanitária exigir registro de conservação e horário de preparo que a primeira versão não coleta (decisão CONF-01) | Média | Alto | Levar o critério de CONF-01 a uma conversa com a vigilância antes da Unidade 3; campos opcionais já previstos no modelo |

## Hipótese e experimento

## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**

## Uso de IA
O que geramos com IA, o que verificamos e o que alteramos.
