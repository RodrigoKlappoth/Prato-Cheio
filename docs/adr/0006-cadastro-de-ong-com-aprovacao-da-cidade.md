# ADR 0006 — Conta de ONG por cadastro com aprovação da coordenação da cidade

- **Data:** 2026-10-08
- **Status:** aceito, a implementar antes de a rede atender a primeira cidade nova. Substitui em parte o [ADR 0003](0003-identificacao-por-email-e-senha.md): a regra "a conta de ONG é criada pela coordenação".

## Contexto
Pelo [ADR 0003](0003-identificacao-por-email-e-senha.md), a conta de ONG é criada pela coordenação com `npm run ong:criar`. Isso funciona porque a rede é a da Marta: poucas ONGs, todas conhecidas. O próprio ADR 0003 registrou o limite dessa regra, no risco "a coordenação vira gargalo para ONGs novas", com a saída "se a rede crescer, trocar por cadastro de ONG com aprovação".

A mudança chegou: o Prato Cheio, feito para um único bairro, passa a ser usado por ONGs e doadores de várias cidades, com acessos simultâneos e mais doações. Reavaliamos o ADR 0003 regra por regra para esse cenário:

| Regra do ADR 0003 | O que muda com várias cidades | Situação |
|---|---|---|
| E-mail e senha, e não link de acesso | Com mais gente, há mais encaminhamentos, e cada link ainda precisaria ser gerado pela coordenação. O link fica pior | **Mantida** |
| O doador cria a própria conta | Continua sem depender de ninguém, em qualquer cidade | **Mantida** |
| A sessão de 30 dias fica numa tabela do banco | Com acessos simultâneos, várias cópias da função rodam ao mesmo tempo na Vercel, e a sessão no banco vale para todas | **Mantida** |
| Sem recuperação de senha: quem esquece fala com a coordenação | A coordenação não dá conta de doadores de várias cidades, e o doador que não consegue entrar desiste (CONF-01) | **Vira pré-requisito** da expansão |
| Sem limite de tentativas de login | O ADR 0003 adiou o limite para "antes de divulgar o endereço amplamente", e a expansão é exatamente essa divulgação | **Vira pré-requisito** da expansão |
| A conta de ONG é criada pela coordenação, com `npm run ong:criar` | Tem os três problemas descritos abaixo | **Substituída** por este ADR |

Os aceites simultâneos não pedem mudança: o aceite já é uma única instrução, que só altera a doação se ela ainda estiver disponível (RN-02), então duas ONGs não ficam com a mesma doação.

A regra da conta de ONG tem três problemas concretos:

- **A Marta não conhece as ONGs de outras cidades.** Ela não tem como saber se quem pede uma conta é mesmo uma ONG.
- **O script exige a senha do banco de produção.** O `npm run ong:criar` roda no terminal com o `.env`, que guarda a senha do banco. Para cada cidade criar as próprias ONGs, teríamos de entregar essa senha a outras pessoas, e ela dá acesso a todos os dados da rede.
- **Toda ONG nova espera um de nós.** A entrada na rede volta a depender de uma pessoa, que é exatamente o problema central da nossa análise.

O que não pode se perder: ninguém aceita em nome de uma ONG. Aceitar é o ponto sensível, porque tira a doação da lista de todas as outras (RN-02).

## Alternativas consideradas
1. **Manter a regra:** a coordenação central cria todas as contas de ONG pelo script.
   - Prós: nada a construir; controle total sobre quem é ONG.
   - Contras: os três problemas do contexto. Quanto mais cidades, maior a fila.
2. **Cadastro livre de ONG**, igual ao do doador.
   - Prós: nenhuma espera; ninguém precisa da senha do banco.
   - Contras: qualquer pessoa vira ONG e aceita doações. Reabre o problema que o ADR 0003 fechou, agora com muito mais gente desconhecida na rede.
3. **Cadastro com aprovação da coordenação da cidade:** a ONG se cadastra na tela, informando a cidade. A conta nasce pendente e só aceita doações depois que um coordenador daquela cidade aprova.
   - Prós: ninguém precisa da senha do banco; quem aprova conhece as ONGs da sua cidade; a proteção do aceite continua.
   - Contras: um papel novo (coordenação), uma tela de aprovação e um estado novo na conta; a ONG nova espera a aprovação antes do primeiro aceite; cada cidade precisa de alguém ativo na coordenação.

## Decisão
Alternativa 3, com estas regras:

- **A ONG cria a conta na tela**, com nome, e-mail, senha e cidade. A conta nasce **pendente**.
- **A ONG pendente entra no sistema e vê a lista**, como qualquer pessoa que entrou, mas **não aceita**: o aceite responde `403` com "sua conta de ONG ainda aguarda a aprovação da coordenação da sua cidade".
- **A coordenação é um papel novo, ligado a uma cidade.** O coordenador vê os pedidos pendentes da sua cidade e aprova ou recusa cada um. Uma aprovação pode ser desfeita, e cada uma registra quem aprovou e quando.
- **Nós criamos o primeiro coordenador de cada cidade**, por um script como o de hoje. É um comando por cidade, e não um por ONG. Cada cidade pode ter mais de um coordenador.
- **As ONGs que já existem continuam aprovadas**, na cidade da rede atual.

Quem aprova é a coordenação de cada cidade, e não só a Marta. Uma tela de aprovação só para ela resolveria a senha do banco, mas a Marta continuaria sem conhecer as ONGs das outras cidades e seria o único ponto de espera da rede inteira. Na nossa análise, ela espera que "a rede funcione sem depender do WhatsApp dela". Descartamos o cadastro livre porque ele entrega o aceite a qualquer pessoa.

## Consequências
- **Positivas:** uma ONG nova entra na rede sem esperar por nós; ninguém fora da equipe de desenvolvimento precisa da senha do banco; quem aprova conhece as ONGs da cidade; a proteção do aceite do ADR 0003 continua; a conta passa a ter cidade, o que prepara a lista de doações por cidade.
- **Negativas / o que abrimos mão:**
  - Um terceiro papel, uma tela de aprovação e mais regras de quem pode o quê.
  - Uma migration ([ADR 0004](0004-prisma-e-migrations.md)): a conta ganha a cidade e a situação da aprovação (pendente, aprovada ou recusada).
  - A ONG nova espera a aprovação antes do primeiro aceite, como hoje espera que um de nós crie a conta. A diferença é que quem aprova está na cidade dela.
  - O critério CA-04.2 muda: o cadastro público deixa de criar só doador e passa a criar também ONG pendente. O teste "cria sempre conta de doador, mesmo que o pedido diga ONG" será reescrito junto com a história.
- **Antes da primeira cidade nova:** além deste ADR, a recuperação de senha e o limite de tentativas de login saem do backlog do ADR 0003 e passam a ser pré-requisitos.
- **Riscos e o que fazer:**
  - *Uma cidade fica sem coordenador ativo, e os pedidos param* → cada cidade começa com dois coordenadores, e nós acompanhamos os pedidos pendentes há mais de uma semana.
  - *Um coordenador aprova quem não é ONG* → a aprovação pode ser desfeita, e o registro de quem aprovou mostra onde está o erro.
  - *Implementar antes da hora* → enquanto a rede for de um bairro só, o script do ADR 0003 continua valendo. Este ADR entra em prática antes da primeira cidade nova.

## Rastreabilidade
- Problema central: canal "dependente de uma pessoa". Se toda conta de ONG passasse por nós, a rede voltaria a depender de uma pessoa.
- Stakeholder Marta: espera que "a rede funcione sem depender do WhatsApp dela".
- RN-02 e Decisão de análise ("qualquer pessoa aceita em nome de qualquer ONG"): o aceite continua restrito a ONGs aprovadas.
- [ADR 0003](0003-identificacao-por-email-e-senha.md), risco "a coordenação vira gargalo para ONGs novas".
- CA-04.2, que muda quando este ADR for implementado.
