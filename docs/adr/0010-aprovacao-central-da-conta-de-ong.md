# ADR 0010 — A coordenação aprova contas de ONG de qualquer cidade

- **Data:** 2026-10-27
- **Status:** aceito e implementado (história H-06, revisada). **Substitui** a regra "quem aprova é a coordenação de cada cidade" do [ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md). O resto do ADR 0006 continua valendo.

## Contexto

O [ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md) decidiu que a conta de ONG é aprovada pela **coordenação da cidade dela**, por dois motivos escritos:

> "A Marta não conhece as ONGs de outras cidades. Ela não tem como saber se quem pede uma conta é mesmo uma ONG."
>
> "Toda ONG nova espera um de nós. A entrada na rede volta a depender de uma pessoa, que é exatamente o problema central da nossa análise."

Implementamos essa regra na história H-06, e usá-la revelou o que a decisão tinha deixado de lado: **a rede tem uma coordenação, não uma por cidade.** A Marta coordena a rede inteira. A regra por cidade pressupõe pessoas de coordenação que ainda não existem.

A consequência prática é a pior possível diante do próprio objetivo do ADR 0006: enquanto não houver uma conta de coordenação na cidade X, **nenhuma ONG de X consegue ser aprovada por ninguém**. O pedido fica pendente para sempre, sem ninguém com permissão para decidir, e sem mensagem explicando. Trocamos "a ONG espera um de nós" por "a ONG espera alguém que não existe" — que é pior.

O ADR 0006 previu esse risco:

> "*Uma cidade fica sem coordenador ativo, e os pedidos param* → cada cidade começa com dois coordenadores, e nós acompanhamos os pedidos pendentes há mais de uma semana."

A mitigação pressupõe duas pessoas de coordenação por cidade. A rede não tem isso, e criar conta de coordenação é um comando de terminal nosso ([ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md)) — então, na prática, a entrada de ONGs de uma cidade nova continuaria dependendo de nós, só por um caminho mais longo.

## Alternativas consideradas

1. **Manter a aprovação por cidade**, como está no ADR 0006.
   - Prós: quem aprova conhece as ONGs de perto, que é o motivo original; nenhuma mudança a fazer.
   - Contras: pedido de cidade sem coordenação fica parado indefinidamente; criar coordenação por cidade é comando nosso, então a dependência de nós volta disfarçada; a rede não tem gente para isso hoje.
2. **Aprovação central:** qualquer conta de coordenação aprova ou recusa ONG de qualquer cidade da rede.
   - Prós: nenhum pedido fica sem quem decida; a cidade da ONG continua registrada e aparece na lista de pendentes, então quem aprova sabe de onde é cada pedido; nada a construir além de tirar uma verificação.
   - Contras: quem aprova passa a decidir sobre ONGs que não conhece, que é exatamente o motivo pelo qual o ADR 0006 descentralizou; com a rede crescendo, a coordenação central volta a ser um gargalo.
3. **Dois níveis:** a coordenação da cidade aprova as da sua cidade, e uma coordenação geral pode aprovar qualquer uma.
   - Prós: resolve o pedido parado sem abrir mão do conhecimento local.
   - Contras: um quarto papel e mais regras de quem pode o quê, para resolver um problema que nesta escala não existe — a rede tem uma pessoa coordenando.

## Decisão

Alternativa **2**, com estas regras:

- **Qualquer conta de coordenação vê e decide os pedidos pendentes de todas as cidades da rede.**
- **A cidade da conta de coordenação registra onde a pessoa está, e não o que ela pode.** O campo continua obrigatório ([ADR 0009](0009-estado-e-cidade-escolhidos-em-lista.md)), mas deixou de ser uma permissão.
- **A lista de pendentes mostra a cidade de cada pedido**, agrupada por cidade, para que quem aprova possa ligar para a ONG antes de decidir quando não a conhece.
- **A aprovação continua podendo ser desfeita**, e continua registrando quem decidiu e quando — é essa a rede de segurança para a aprovação de quem não se conhece.

Escolhemos a 2 e não a 1 porque o motivo do ADR 0006 — não depender de uma pessoa — se virou contra ele mesmo: a regra por cidade só funciona com gente de coordenação em cada cidade, e sem ela o pedido não espera "um de nós", espera ninguém. Descartamos a 3 porque ela acerta no desenho e erra no momento: é um papel a mais para uma rede que tem uma coordenação.

**Quando esta decisão deve ser revista:** quando a rede tiver pessoa de coordenação em mais de uma cidade. Aí o motivo original do ADR 0006 volta a valer com força, e a alternativa 3 passa a ser a melhor das três. O código da regra por cidade está no histórico do repositório, no Pull Request que implementou a H-06 pela primeira vez.

## Consequências

- **Positivas:** nenhum pedido de conta fica sem quem decida; uma ONG de cidade nova entra na rede no dia em que pede; uma verificação a menos no código.
- **Negativas / o que abrimos mão:**
  - **Quem aprova decide sobre ONGs que não conhece.** Este é o custo real, e é o motivo pelo qual o ADR 0006 tinha decidido o contrário. O que temos contra isso é a cidade visível no pedido, a aprovação reversível e o registro de quem aprovou — nada disso substitui conhecer a ONG.
  - **A coordenação central volta a ser o gargalo** se a rede crescer. É o risco que o ADR 0006 tinha fechado e que estamos reabrindo de propósito, com a condição de revisão escrita acima.
- **O que isso fez com os testes:** dois testes da H-06 **viraram o oposto do que eram**, e isso está dito no próprio arquivo de teste:
  - "mostra só os pedidos pendentes da cidade de quem coordena" → **"mostra os pedidos pendentes de todas as cidades da rede"**
  - "recusa aprovar uma ONG de outra cidade", que esperava `403` → **"aprova uma ONG de outra cidade, porque a coordenação atende a rede toda"**, que espera `200`
- **Riscos e o que fazer:**
  - *Aprovarem uma ONG que não é ONG* → a aprovação é reversível e fica registrada com autor e data; o aceite dela pode ser cancelado.
  - *Esta decisão ser esquecida quando a rede crescer* → a condição de revisão está escrita neste ADR e no backlog do README.

## Rastreabilidade

- **[ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md):** substitui a regra de quem aprova; mantém o cadastro pela tela, a conta pendente e o bloqueio do aceite.
- **[ADR 0009](0009-estado-e-cidade-escolhidos-em-lista.md):** decidido junto, e é ele que mantém a cidade obrigatória na conta.
- **Problema central** ("canal dependente de uma pessoa"): é o critério que mudou de lado. Depender de uma pessoa que existe é melhor que depender de uma que não existe.
- **Risco do ADR 0006** "uma cidade fica sem coordenador ativo, e os pedidos param": é este risco se realizando antes mesmo de a rede crescer.
- **RN-04** e os critérios **CA-06.1** e **CA-06.5**, que mudaram de enunciado.
