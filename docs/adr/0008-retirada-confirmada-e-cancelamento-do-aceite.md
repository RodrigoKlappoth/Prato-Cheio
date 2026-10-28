# ADR 0008 — O que acontece com a doação aceita e não retirada

- **Data:** 2026-10-27
- **Status:** aceito e implementado (história H-07). A liberação automática fica registrada como o passo seguinte.

## Contexto

A análise da Unidade 1 registrou este risco com todas as letras: "uma ONG aceita a doação e não retira. Pela RN-02 a doação some da lista das outras no instante do aceite e não existe cancelamento (INC-05): a comida fica reservada para quem não vem e vence — exatamente o que OBJ-02 mede". O combinado da Unidade 1 era sem código: "a ONG que desistir avisa no grupo e o doador publica de novo". Era a decisão **D2** de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md).

Há um segundo problema no mesmo lugar. O **OBJ-01**, que é o objetivo que define o problema, mede "a mediana de horas entre a publicação da doação e a confirmação da retirada". O sistema não registra retirada nenhuma. Ou seja: o indicador principal do projeto **não pode ser calculado** com o modelo de hoje. A própria análise diz isso na justificativa da D2: "hoje o sistema não registra a retirada, então o OBJ-01 não pode ser medido".

O modelo de hoje tem três estados possíveis para uma doação, mas só usa dois: `disponivel` e `aceita`. Não há horário de aceite nem de retirada.

## Alternativas consideradas

1. **Liberação automática.** A ONG confirma a retirada, e um aceite sem retirada confirmada em 4 horas volta para a lista. As 4 horas são o limite do OBJ-01.
   - Prós: ninguém precisa lembrar de nada, que é o espírito do problema central; a doação volta a circular sozinha; o limite tem origem num objetivo medido, e não num palpite.
   - Contras: exige algo que rode no tempo, sem ninguém pedir. A função da Vercel só acorda quando chega uma requisição, então precisaríamos de uma tarefa agendada, que é serviço novo e configuração nova ([ADR 0002](0002-hospedagem-na-vercel.md)). E pune a ONG que combinou com o doador retirar no dia seguinte: 4 horas depois do aceite, a doação sairia das mãos dela sem que ninguém tenha errado.
2. **Cancelamento manual.** A ONG que aceitou cancela o aceite quando desiste, e a doação volta para a lista.
   - Prós: nada para agendar, nada de serviço novo; quem sabe que não vai buscar é a ONG, e é ela que age; a doação volta para a lista no mesmo instante, em vez de esperar 4 horas.
   - Contras: depende de a ONG avisar. Se ela não cancelar nem retirar, a doação continua reservada e vence — o risco da análise sobrevive em parte.

Consideramos e descartamos uma terceira: **o doador cancelar o aceite da ONG**. Ela resolveria o caso da ONG que simplesmente desaparece, mas tira a doação de uma ONG que pode estar a caminho, e cria exatamente o tipo de disputa que hoje a Marta arbitra no WhatsApp — o problema central da nossa análise.

## Decisão

Alternativa **2** agora, junto com a confirmação da retirada, que as duas alternativas pediam. A alternativa 1 fica registrada como o passo seguinte, para quando houver onde rodar tarefa no tempo.

As regras:

- **A doação ganha um terceiro estado, `retirada`**, que é o fim da linha: dela não se sai.
- **O modelo passa a registrar `aceita_em` e `retirada_em`**, que são os dois instantes que o OBJ-01 mede, junto com o `criada_em` que já existia.
- **Só a ONG que aceitou confirma a retirada ou cancela o aceite.** Nem o doador, nem outra ONG, nem a coordenação.
- **Cancelar devolve a doação para `disponivel`** e apaga o aceite: a ONG, o `ong_id` e o `aceita_em` voltam a ficar vazios. A doação reaparece na lista das outras ONGs no mesmo instante, com o `id` que sempre teve.
- **Cancelar não exige conta de ONG aprovada**, ao contrário de aceitar. Se a coordenação desaprovar uma conta depois do aceite, essa ONG ainda precisa poder devolver a comida para a lista — é isso que interessa ao OBJ-02. Aceitar continua exigindo conta aprovada (RN-04, [ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md)).
- **Cada papel vê o seu histórico:** o doador vê o que publicou, com o estado de cada doação e quem levou; a ONG vê o que aceitou e o que já retirou. **A coordenação não tem histórico de doações**, porque doação não tem cidade — só a conta tem. Ela decide sobre contas, não sobre comida.

Escolhemos a alternativa 2 primeiro porque ela entrega hoje as duas coisas que faltavam: um jeito de devolver a doação à lista e os horários que tornam o OBJ-01 mensurável. A alternativa 1 depende de infraestrutura nova e, sozinha, resolveria menos: sem a confirmação de retirada, não há como saber se a ONG veio.

## Consequências

- **Positivas:**
  - **O OBJ-01 passa a ser calculável:** a mediana de horas entre `criada_em` e `retirada_em`. Era o indicador que define o problema do projeto e que, até aqui, nenhuma versão do sistema conseguia medir.
  - A doação que uma ONG aceitou e não vai buscar volta para a lista em um toque, em vez de o doador ter de publicar tudo de novo — o combinado da Unidade 1 criava uma segunda doação para a mesma comida, e com ela um registro duplicado para a vigilância.
  - A INC-05, que a Unidade 1 deixou explicitamente no backlog, está respondida.
  - O doador passa a ver o que aconteceu com o que publicou, que é a informação que o canal do WhatsApp nunca guardou.
- **Negativas / o que abrimos mão:**
  - **A ONG que não cancelar nem retirar continua segurando a comida até o prazo vencer.** O risco da análise diminuiu, mas não acabou; só a liberação automática o fecha.
  - **Nada obriga a confirmar a retirada.** Então o OBJ-01 vai medir só as retiradas confirmadas, e uma ONG que busca a comida e não toca no botão aparece como se nunca tivesse buscado. É um viés de medição que precisa ser olhado na primeira medição, e não um número para usar como se fosse completo.
  - Duas rotas novas e um estado novo, com mais caminhos de erro para testar — 14 testes em `tests/historico.test.js`.
- **Riscos e o que fazer:**
  - *A ONG confirmar a retirada sem ter ido buscar* → o registro é a palavra da ONG, não prova. Aceitável numa rede de ONGs conhecidas e aprovadas pela coordenação da cidade; se virar problema, o doador é quem passa a confirmar.
  - *O OBJ-01 vir com poucos dados porque ninguém confirma* → medir, nas duas primeiras semanas, a proporção de doações aceitas que recebem confirmação. Se for baixa, o próximo passo é lembrar a ONG, e não trocar o indicador.
  - *A liberação automática ficar esquecida no backlog* → ela está no README, na lista do que falta, com a dependência explícita: precisa de tarefa agendada.

## Rastreabilidade

- **Decisão D2** de [`docs/decisoes-de-projeto.md`](../decisoes-de-projeto.md): as duas alternativas aqui são as duas registradas lá.
- **Risco** "uma ONG aceita a doação e não retira" e **INC-05** ("o que acontece quando a ONG aceita e não retira", deixada para o backlog na Unidade 1).
- **OBJ-01** (mediana de horas entre publicação e confirmação da retirada): os campos `aceita_em` e `retirada_em` existem por causa dele, e a própria análise previu esses dois nomes.
- **OBJ-02** (doações que vencem sem nenhuma ONG aceitar): o cancelamento devolve a doação à lista antes de vencer.
- **RN-02**: o aceite continua sendo exclusivo; o cancelamento é a única saída, e só para quem aceitou.
- **RN-04** e [**ADR 0006**](0006-cadastro-de-ong-com-aprovacao-da-cidade.md): aceitar exige conta aprovada, cancelar não.
- **Problema central**: devolver a doação à lista não passa pela Marta nem por nós.
