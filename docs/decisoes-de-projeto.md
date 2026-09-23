# Decisões de projeto — Prato Cheio

*Atividade da Unidade 2: decisões e alternativas, tabela de trade-offs e justificativa das decisões.*

> **Base da justificativa:** a análise que entregamos na Unidade 1, ou seja, `docs/analise.md`, `docs/experimento-h1.md` e o README como estão na `main` do GitHub no commit `850447a`. Não usamos como justificativa nada criado depois disso. As citações entre aspas são trechos dessa análise.

Estas são três decisões que o caso exige, cada uma com duas alternativas viáveis. Na tabela de trade-offs, detalhamos a D3. Na justificativa, ligamos cada decisão à nossa análise da Unidade 1. As decisões que já tomamos, como banco e hospedagem, estão resumidas no fim.

## 1. Decisões e alternativas

Cada decisão tem duas alternativas viáveis.

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| D1 | Como o sistema sabe que o prazo de retirada venceu | **A. O "agora" vira parâmetro das regras:** as funções de `src/doacoes.js` recebem a data de hoje, e os testes passam uma data fixa. **B. As regras leem o relógio do servidor:** a comparação usa a data atual do sistema, e os testes criam doações com prazo relativo, como "hoje + 1 dia". | RN-03; H-03 (critério **T** do INVEST); critérios CA-03.1 a CA-03.4; nota de implementação da H-03 |
| D2 | O que acontece com a doação aceita e não retirada | **A. Liberação automática:** a ONG confirma a retirada, e um aceite sem retirada confirmada em 4 horas volta para a lista. **B. Cancelamento manual:** a ONG, ou a coordenação, cancela o aceite quando a ONG desiste, e a doação volta para a lista. | Risco "uma ONG aceita a doação e não retira"; INC-05; OBJ-01; OBJ-02 |
| D3 | Como as ONGs ficam sabendo de uma doação nova | **A. Aviso no grupo de WhatsApp:** depois de publicar, a tela mostra o botão *Avisar no WhatsApp*, que abre o aplicativo com a mensagem pronta: o que é, quanto, até quando e o link para aceitar. O doador escolhe o grupo da rede e envia. **B. Notificação no celular da ONG:** assim que a doação é publicada, o sistema manda um aviso direto para o celular de cada ONG, sem depender do doador. Cada ONG autoriza os avisos uma vez. | Problema central; OBJ-01 e OBJ-02; expectativa das ONGs; alternativa 3 da Decisão de análise, que foi adiada; INC-03 |

Nas duas alternativas da D1, *hoje* precisa ser a data de São Paulo, porque o servidor da Vercel fica no horário UTC ([ADR 0002](adr/0002-hospedagem-na-vercel.md)).

## 2. Tabela de trade-offs

**D3 — como as ONGs ficam sabendo de uma doação nova.** Cada critério vem de um item da análise, exceto a facilidade de implementação, que é uma restrição do projeto.

| Critério | De onde vem | A — Aviso no grupo de WhatsApp | B — Notificação no celular da ONG |
|---|---|---|---|
| A ONG fica sabendo a tempo | Problema central: as ONGs "respondem quando veem"; OBJ-01 e OBJ-02 | **Sim, se o doador enviar.** O aviso chega pelo canal que a rede já acompanha | **Sim, sem depender do doador.** O alerta chega ao celular de cada ONG que autorizou os avisos |
| Não depende de alguém lembrar | Problema central: canal "dependente de uma pessoa" | **Não.** O doador precisa tocar no botão a cada doação | **Sim.** O sistema avisa assim que a doação é publicada |
| Facilidade de implementação | Restrição do projeto: prazo da Unidade 2 | **Alta.** Um link do WhatsApp com a mensagem pronta, sem serviço externo | **Baixa.** Pedido de autorização, cadastro dos aparelhos das ONGs e serviço de envio |
| Mudança de hábito | Problema central: a rede "já funciona — por WhatsApp" | **Nenhuma.** O doador já avisa no grupo hoje | **Alguma.** Cada ONG autoriza os avisos, e no iPhone precisa adicionar o site à tela de início |
| Atrito para o doador | CONF-01 (30 segundos); H1 | **Um toque a mais**, depois da confirmação, fora do tempo medido pela H1 | **Nenhum** |
| Leva o que a ONG precisa saber | As ONGs querem "saber com antecedência o que vem, em que quantidade e até quando pode ser retirado" | **Sim.** A mensagem pronta leva o que é, quanto e até quando | **Sim.** O alerta leva as mesmas informações |
| Justiça entre as ONGs | INC-03: a regra atual pode favorecer "quem tem alguém sempre olhando o celular" | **Em parte.** O aviso sai para todo o grupo ao mesmo tempo, mas pode se perder na conversa | **Sim.** O alerta chega a todas as ONGs ao mesmo tempo |

**Leitura da tabela.** A é mais fácil de implementar, não muda o hábito da rede e resolve o aviso, desde que o doador envie. B não depende de ninguém lembrar e é mais justa entre as ONGs, mas é mais trabalhosa de construir e pede que cada ONG autorize os avisos.

## 3. Justificativa das decisões

Cada linha liga uma decisão a um requisito ou a um risco da nossa análise da Unidade 1.

| Decisão | Requisito ou risco da análise | Onde está | Por que exige esta decisão |
|---|---|---|---|
| D1 · prazo vencido | A doação com prazo de retirada vencido "não aparece na lista de disponíveis e não pode ser aceita" | RN-03 | Para aplicar a regra, o sistema precisa saber que dia é hoje, e há dois jeitos de fazer isso |
| D1 · prazo vencido | "Comparar o prazo com o relógio do sistema torna o teste dependente da data em que ele roda", e a H-03 "exige uma decisão que ainda não tomamos" | Histórias de usuário, H-03 | A própria análise registra que a H-03 não pode ser implementada antes desta decisão |
| D1 · prazo vencido | O teste usa uma data que "já passou", e com a RN-03 "os testes hoje verdes de H-01 e H-02 quebram em bloco" | Nota de implementação da H-03 | As duas alternativas são as que a nota propõe: prazo relativo ou "agora" como parâmetro |
| D1 · prazo vencido | Sem o teste do limite, "vencida" e "vence hoje" viram a mesma coisa "por acidente" | CA-03.3 | Testar o limite exato de "hoje" exige controlar a data usada no teste |
| D2 · aceite sem retirada | "O que acontece quando a ONG aceita e não retira" ficou para o backlog "como história de cancelamento/no-show" | INC-05 | A análise deixou a pergunta aberta para a Unidade 2 |
| D2 · aceite sem retirada | A doação aceita e não retirada "fica reservada para quem não vem e vence", e isso é "exatamente o que OBJ-02 mede" | Riscos | Sem uma regra de devolução, o risco vira comida jogada fora |
| D2 · aceite sem retirada | O OBJ-01 mede o tempo até a "confirmação da retirada" | Objetivos de impacto | Hoje o sistema não registra a retirada, então o OBJ-01 não pode ser medido |
| D3 · aviso às ONGs | Hoje as ONGs "respondem quando veem" o aviso no grupo | Problema central | Quanto antes a ONG souber da doação, antes aceita. O jeito de avisar decide se a comida é vista a tempo |
| D3 · aviso às ONGs | "Começar pela notificação (avisar as ONGs quando surge doação)" foi adiada porque "só faz sentido depois que existe doação publicada para notificar" | Decisão de análise | A publicação já existe, então a decisão adiada chegou |
| D3 · aviso às ONGs | O OBJ-01 mede as horas entre "a publicação da doação e a confirmação da retirada", e o OBJ-02 as doações que "vencem sem nenhuma ONG aceitar" | Objetivos de impacto | Doação que nenhuma ONG vê não é aceita e vence |
| D3 · aviso às ONGs | As ONGs querem "saber com antecedência o que vem, em que quantidade e até quando pode ser retirado" | Stakeholders, detalhamento | O aviso precisa levar essas três informações, em qualquer das alternativas |
| D3 · aviso às ONGs | "Quem chega primeiro leva" pode favorecer "quem tem alguém sempre olhando o celular" | INC-03 | O jeito de avisar muda quem vê primeiro, e por isso muda quem leva a doação |

## Decisões já tomadas

Estas decisões nós já tomamos antes desta atividade. Cada uma tem seu ADR, com alternativas, consequências e riscos.

| Decisão | Escolha | Alternativa descartada | Registro |
|---|---|---|---|
| Onde os dados ficam guardados | PostgreSQL no Neon | Supabase | [ADR 0001](adr/0001-banco-postgresql-no-neon.md) |
| Onde o sistema roda | Vercel | Render | [ADR 0002](adr/0002-hospedagem-na-vercel.md) |
| Como doador e ONG se identificam | E-mail e senha | Link de acesso pessoal | [ADR 0003](adr/0003-identificacao-por-email-e-senha.md) |
| Como o banco evolui | Prisma com migrations versionadas | SQL versionado à mão com `pg` | [ADR 0004](adr/0004-prisma-e-migrations.md) |
