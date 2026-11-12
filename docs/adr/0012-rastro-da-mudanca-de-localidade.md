# ADR 0012 — O rastro da mudança de localidade da conta

- **Data:** 2026-11-12
- **Status:** aceito e implementado (história H-11, regra RN-08)

## Contexto

A história H-09 entregou a conta editável e deixou uma dívida escrita na própria decisão que a autorizou, o [ADR 0011](0011-conta-editavel-e-cidade-na-doacao.md):

> **Nada guarda o histórico da própria conta.** Depois da correção, não sobra registro de que a conta era de outra cidade. Para a conta de ONG isso é mais relevante do que parece: a coordenação aprovou uma ONG que dizia ser de uma cidade, e ela pode estar em outra.

O mesmo ADR registrou o risco que vem daí, e o que fazer com ele:

> *A ONG mudar de cidade para alcançar doações de outra cidade* → (…) Se virar problema real, a saída é a mesma do risco acima: gravar a mudança de cidade com data, e avisar a coordenação. Fica registrado aqui, sem código.

**Por que agora, e não quando virar problema real.** Porque descobrir que virou problema real depende exatamente do dado que não existe. A aprovação da conta de ONG (RN-04) é a única defesa da rede contra "qualquer um aceita a comida de qualquer um", e ela é dada olhando uma cidade: a Marta aprova o Banco de Alimentos *de Joinville*. Depois da H-09, essa conta pode dizer Blumenau no dia seguinte, passar a ver e aceitar a lista de Blumenau, e não há nada no banco nem na tela que mostre que ela mudou — nem para a coordenação que aprovou, nem para nós dois, depois, tentando entender o que aconteceu.

A correção de cidade é um acerto legítimo e comum, e é para isso que a H-09 existe; a questão não é impedi-la, é não deixá-la invisível.

## Alternativas consideradas

Três perguntas, cada uma com as suas alternativas.

**(a) Onde fica o rastro?**

1. **Uma tabela própria, com uma linha por mudança.**
   - Prós: guarda a história inteira, inclusive a conta que mudou duas vezes; cada linha tem de onde, para onde e quando; não mexe na tabela de contas, que é lida em toda requisição.
   - Contras: uma tabela a mais no modelo, e uma consulta que a regra precisa interpretar.
2. **Dois campos na própria conta:** `cidade_anterior` e `localidade_mudada_em`.
   - Prós: nada novo no modelo; a consulta da lista fica trivial.
   - Contras: guarda **só a última** mudança. A conta que mudou três vezes perde as duas primeiras, e é justamente a conta que mudou várias vezes que a coordenação precisa ver. Além disso, a conta passaria a ter campo que fala do passado, misturado com os que falam do presente.
3. **Não guardar nada e avisar a coordenação no instante da mudança.**
   - Prós: resolve o aviso, que é o efeito que importa.
   - Contras: o aviso depende de um canal que a rede ainda não tem — é a decisão D3, a última da Unidade 2 em aberto. E aviso que ninguém leu não deixa nada atrás de si: a pergunta "essa ONG sempre foi de Blumenau?" continuaria sem resposta.

**(b) O que a mudança de cidade faz com a aprovação da ONG?**

1. **Nada automático: a coordenação vê a mudança e decide.**
   - Prós: a situação da conta continua sendo decisão de quem decide (RN-04, [ADR 0010](0010-aprovacao-central-da-conta-de-ong.md)); quem corrigiu um erro de cadastro não é punido por isso; reaproveita as rotas de aprovar e recusar que já existem.
   - Contras: entre a mudança e a decisão, a ONG aceita doações da cidade nova com uma aprovação dada para a cidade antiga. A janela é real.
2. **A conta volta para `pendente` automaticamente.**
   - Prós: fecha a janela acima.
   - Contras: pune o caso comum para prevenir o raro. Quem escolheu a cidade errada no cadastro — o motivo pelo qual a H-09 existe — perderia o aceite até alguém aprovar de novo, e a conta voltaria a ser inútil: o problema que estávamos resolvendo, de volta pela porta dos fundos.
3. **Barrar a mudança de cidade para ONG já aprovada.**
   - Prós: nada muda depois da aprovação; nenhuma janela.
   - Contras: é a alternativa (b)(3) do ADR 0011 outra vez, com outro nome: fecha a porta para quem mais precisa dela. A ONG que se cadastrou na cidade errada ficaria presa para sempre, porque a aprovação é exatamente o que ela recebe primeiro.

**(c) O que a lista da coordenação compara?**

1. **A localidade da aprovação com a de hoje.**
   - Prós: a lista pergunta o que a coordenação precisa decidir — "a conta ainda está onde eu aprovei?". A conta que mudou e voltou não ocupa a lista.
   - Contras: uma ONG pode ir e voltar para escapar do alerta, e a lista não mostra isso (o rastro, sim).
2. **"Existe mudança registrada depois da aprovação."**
   - Prós: toda mexida na cidade aparece, inclusive a ida e volta.
   - Contras: a lista passa a pedir decisão sobre conta que está exatamente onde foi aprovada. Lista que pede decisão sobre o que não precisa de decisão é lista que a pessoa aprende a despachar sem ler, e aí ela deixa de proteger o caso que importa.

## Decisão

**(a) alternativa 1**, **(b) alternativa 1** e **(c) alternativa 1**, com estas regras:

- **Toda mudança de estado ou cidade de uma conta grava uma linha** em `mudancas_de_localidade`: qual conta, de onde, para onde e quando. Vale para qualquer papel, inclusive doador.
- **O que não é mudança de localidade não vira registro.** Corrigir só o nome, ou reenviar a mesma cidade que já está gravada — o que a tela faz sempre, porque manda os três campos —, não acrescenta nada ao rastro.
- **O instante vem do `agora` que a regra recebe**, e não do relógio do banco: é a mesma decisão D1 do [ADR 0007](0007-agora-como-parametro-e-dia-de-sao-paulo.md), e é o que deixa o teste fixar a data.
- **O registro é gravado depois da escrita da conta**, e só se ela aconteceu. Rastro de uma mudança que a regra ainda podia recusar — por doação em circulação (RN-07), por cidade fora da lista (RN-06) — seria pior do que rastro nenhum.
- **A coordenação vê as contas de ONG aprovadas cuja localidade de hoje é diferente da localidade em que foram aprovadas**, em `GET /api/ongs/mudancas-de-cidade`. Uma linha por conta, não por mudança: de onde é a localidade da aprovação, para onde é a de hoje, quando é a da mudança mais recente, e a contagem diz quantas foram.
- **A ONG criada no terminal (`npm run ong:criar`) não tem `avaliada_em`:** ela nasce aprovada ([ADR 0003](0003-identificacao-por-email-e-senha.md)), então a referência de "quando foi aprovada" é o `criado_em` da conta.
- **Empate de milissegundo entre a mudança e a aprovação conta como depois.** Esconder uma mudança custa mais do que mostrar uma a mais.
- **A mudança não altera a situação da conta.** As duas saídas da lista são as duas decisões que já existiam: *manter aprovada*, que regrava a aprovação com a data de hoje e tira a conta da lista, e *recusar*, que barra o aceite (RN-04). Nenhuma rota de escrita nova entrou com esta história.
- **A tabela nasce vazia.** As mudanças de cidade que aconteceram antes desta migration não foram gravadas em lugar nenhum — era a dívida — e inventar linha para elas seria inventar data e cidade de origem.

**O que não usamos como motivo:** "auditoria é boa prática". O rastro existe porque uma decisão concreta do sistema, a aprovação da conta de ONG, depende de um dado que podia mudar sem deixar marca. Se a aprovação não existisse, a tabela não se justificaria sozinha.

## Consequências

- **Positivas:**
  - A dívida que o ADR 0011 registrou está paga: a correção de cidade continua livre, e deixa de ser invisível.
  - A aprovação da conta de ONG deixou de ser um cheque em branco para qualquer cidade futura, **sem** tirar da ONG a correção que a H-09 deu a ela.
  - A coordenação ganhou a informação sem ganhar rota nova de escrita: aprovar e recusar já faziam o que ela precisa fazer depois de olhar.
  - O rastro vale para toda conta, e não só para ONG. A pergunta "desde quando este doador é de Blumenau?" passou a ter resposta, mesmo que hoje ninguém a faça.
- **Negativas / o que abrimos mão:**
  - **Existe uma janela entre a mudança e a decisão.** Nela, a ONG aceita doações da cidade nova com uma aprovação dada para a cidade antiga. Escolhemos a janela em vez de derrubar a conta automaticamente, e o limite do estrago é o que a RN-07 já impõe: a cidade não muda com doação em circulação.
  - **A ida e volta não aparece na lista** (CA-11.7). O rastro guarda as duas mudanças, mas quem olha só a lista não vê. É o preço da alternativa (c)(1), e a porta está aberta de propósito.
  - **"Eu vi e está tudo bem" não existe como ação própria:** a coordenação resolve o alerta regravando a aprovação, o que sobrescreve `avaliada_em`. A data da primeira aprovação se perde.
  - **Ninguém é avisado ativamente.** A coordenação precisa abrir a tela. O aviso depende da decisão D3, que continua em aberto.
  - **A tabela cresce sem poda.** Uma linha por correção de cidade, numa rede onde isso é raro: é volume desprezível hoje, e não escrevemos limpeza nenhuma.
- **Riscos e o que fazer:**
  - *Uma ONG usar a ida e volta para escapar do alerta* → o rastro mostra, a lista não. Se virar caso real, a saída é a alternativa (c)(2), que já está escrita aqui. Fica registrado, sem código.
  - *A lista virar rotina de despacho, aprovada sem ler* → é o motivo da escolha (c)(1), e é o que medir quando a rede tiver mais de uma cidade com coordenação.
  - *Alguém gravar o rastro antes da escrita da conta, numa refatoração* → o comentário em `editarConta` diz por que a ordem é essa, e o CA-11.2 falha se o registro passar a sair de qualquer pedido.

## Rastreabilidade

- **[ADR 0011](0011-conta-editavel-e-cidade-na-doacao.md):** este ADR **paga a dívida** "nada guarda o histórico da própria conta" e implementa a mitigação que aquele risco previa. A decisão da conta editável continua valendo inteira — nenhuma premissa dela caiu.
- **RN-04 ([ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md), [ADR 0010](0010-aprovacao-central-da-conta-de-ong.md)):** a mudança de cidade não altera a situação da conta; quem decide continua sendo a coordenação, de qualquer cidade da rede.
- **[ADR 0007](0007-agora-como-parametro-e-dia-de-sao-paulo.md):** o `mudada_em` vem do "agora" que a regra recebe, e não do relógio do banco.
- **RN-07 e RN-08**, história **H-11**, critérios **CA-11.1 a CA-11.8** — os dois últimos escritos durante os testes, e não antes deles.
- **Decisão D3** (aviso às ONGs, em aberto): quando houver canal de aviso, o alerta desta lista é candidato a sair pelo mesmo canal.
