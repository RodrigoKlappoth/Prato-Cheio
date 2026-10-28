# ADR 0006 — Conta de ONG por cadastro com aprovação da coordenação da cidade

- **Data:** 2026-10-08 · **implementado em** 2026-10-27, nas histórias H-05 e H-06
- **Status:** aceito e implementado, com **uma regra substituída no mesmo dia**. Substitui em parte o [ADR 0003](0003-identificacao-por-email-e-senha.md): a regra "a conta de ONG é criada pela coordenação". E é substituído em parte pelo [ADR 0010](0010-aprovacao-central-da-conta-de-ong.md): **quem aprova não é mais a coordenação de cada cidade**, e sim qualquer conta de coordenação, porque a rede tem uma coordenação só e o pedido de uma cidade sem coordenador ficava parado sem ninguém que pudesse decidir. Tudo o mais aqui continua valendo: o cadastro pela tela, a conta que nasce pendente, o bloqueio do aceite e o registro de quem decidiu.

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
  - *Implementar antes da hora* → o risco se realizou ao contrário: implementamos na Unidade 2, antes da primeira cidade nova, porque o cadastro pela tela já tira a equipe de desenvolvimento do caminho de toda ONG nova, que é o problema central. O custo de antecipar foi baixo porque o script do ADR 0003 continua existindo: ele passou a criar ONG **já aprovada**, e um segundo script cria a primeira coordenação de cada cidade.

## Como ficou implementado

Cada regra da decisão tem onde conferir:

| Regra da decisão | Onde está no código | Teste |
|---|---|---|
| A ONG cria a conta na tela, com cidade, e nasce pendente | `cadastrarPeloSite` em `src/usuarios.js`; escolha "Sou doador / Sou ONG" em `public/index.html` | "cria a conta pendente e já deixa a ONG entrar" |
| ~~A cidade é obrigatória para a ONG, e não para o doador~~ | **Mudou no [ADR 0009](0009-estado-e-cidade-escolhidos-em-lista.md):** estado e cidade passaram a ser obrigatórios em **toda** conta, escolhidos numa lista. A justificativa de poupar o doador vinha de uma leitura errada do CONF-01, que trata dos campos da doação | "recusa o cadastro de doador sem estado e sem cidade" |
| A ONG pendente entra e vê a lista, mas não aceita | `exigirOngAprovada` em `src/usuarios.js`, usada por `aceitar` em `src/doacoes.js` | "deixa a ONG pendente ver a lista, mas recusa o aceite dela" |
| ~~A coordenação é um papel ligado a uma cidade~~ | **Regra substituída pelo [ADR 0010](0010-aprovacao-central-da-conta-de-ong.md) no mesmo dia.** O papel `coordenacao` existe e a conta tem cidade, mas a cidade passou a dizer onde a pessoa está, e não o que ela pode decidir | o teste "mostra só os pedidos pendentes da cidade de quem coordena" virou "mostra os pedidos pendentes de todas as cidades da rede" |
| Cada decisão registra quem aprovou e quando | `avaliarOng` em `src/usuarios.js`; colunas `avaliada_em` e `avaliada_por_id` | "aprovar deixa a ONG aceitar e registra quem aprovou e quando" |
| Uma aprovação pode ser desfeita | a mesma `avaliarOng`, com situação `recusada` | "desfaz uma aprovação, e a ONG volta a não aceitar" |
| Nós criamos a primeira coordenação de cada cidade | `scripts/criar-coordenacao.js` (`npm run coordenacao:criar`) | — (comando de terminal, como o `ong:criar`) |
| As ONGs que já existem continuam aprovadas | `DEFAULT 'aprovada'` na migration `20261027120000_cadastro_de_ong_com_aprovacao` | "nasce aprovada e aceita doações na hora" |

Duas decisões de implementação que o ADR não previa:

- **A situação da conta é lida a cada requisição**, e não guardada na sessão. Por isso uma aprovação vale na hora, sem a ONG precisar sair e entrar de novo — o que o critério CA-06.2 verifica.
- **A tela não mostra o botão de aceitar para conta não aprovada.** A regra no servidor é o que protege a doação; esconder o botão evita oferecer à ONG uma ação que ela vai receber de volta como erro.

## Rastreabilidade
- Problema central: canal "dependente de uma pessoa". Se toda conta de ONG passasse por nós, a rede voltaria a depender de uma pessoa.
- Stakeholder Marta: espera que "a rede funcione sem depender do WhatsApp dela".
- RN-02 e Decisão de análise ("qualquer pessoa aceita em nome de qualquer ONG"): o aceite continua restrito a ONGs aprovadas.
- [ADR 0003](0003-identificacao-por-email-e-senha.md), risco "a coordenação vira gargalo para ONGs novas".
- CA-04.2, que muda quando este ADR for implementado.
