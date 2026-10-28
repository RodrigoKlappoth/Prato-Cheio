# Documento de Projeto — Prato Cheio

*Entrega 2 · evolução do sistema: histórias implementadas, decisões de projeto e requisitos não funcionais*

- **Grupo:** Rodrigo Xavier ([@RodrigoKLappoth](https://github.com/RodrigoKLappoth)) e Henrique Xavier ([@Ikeew](https://github.com/Ikeew))
- **Repositório:** <https://github.com/RodrigoKlappoth/Prato-Cheio> · **No ar:** <https://prato-cheio-sigma.vercel.app>
- **Testes:** 57, todos passando, em 6 arquivos. **25 deles** verificam que o sistema **recusa** algo.

## 1. O que esta entrega fez

Quatro histórias, todas vindas de decisões que já estavam documentadas e esperando implementação. Nenhuma foi inventada para a entrega: as três primeiras pendências do backlog do README eram exatamente estas.

| # | História | Critérios | Código | Teste |
|---|---|---|---|---|
| **H-05** | Como **ONG**, quero criar minha própria conta informando a cidade, para entrar na rede sem esperar que alguém da equipe me cadastre | CA-05.1 a CA-05.5 | `cadastrarPeloSite` em `src/usuarios.js`; escolha *Sou doador / Sou ONG* em `public/index.html` | `tests/aprovacao.test.js` |
| **H-06** | Como **coordenação da minha cidade**, quero ver os pedidos de conta de ONG e aprovar ou recusar, para que só ONGs que eu conheço aceitem doações | CA-06.1 a CA-06.6 | `listarOngsPendentes` e `avaliarOng` em `src/usuarios.js`; tela *Pedidos de conta* | `tests/aprovacao.test.js` |
| **H-03** | Como **ONG**, quero que doações com prazo vencido não apareçam nem possam ser aceitas, para não deslocar voluntário para comida que não pode ser distribuída | CA-03.1 a CA-03.5 | `hojeNaRede` e `diaValido` em `src/regras.js`; `criarDoacao`, `listarDisponiveis` e `aceitar` em `src/doacoes.js` | `tests/prazo.test.js` |
| **H-07** | Como **ONG**, quero confirmar a retirada ou cancelar o aceite, e como **doador**, quero ver o que aconteceu com o que publiquei | CA-07.1 a CA-07.8 | `confirmarRetirada`, `cancelarAceite` e `listarRecentes` em `src/doacoes.js` | `tests/historico.test.js` |

Os critérios de aceite, um por um, com o enunciado em Dado/Quando/Então e o nome do teste que prova cada um, estão em [`docs/analise.md`](analise.md). Duas regras de negócio novas saíram daqui: a **RN-04** (só ONG aprovada aceita doações) e a **RN-05** (só quem aceitou confirma a retirada ou cancela), e a **RN-03**, escrita na Unidade 1, saiu de "pendente".

**Por que estas quatro.** A H-05 e a H-06 tiram a equipe de desenvolvimento do caminho de toda ONG nova, que é o problema central da análise: um canal "dependente de uma pessoa". A H-03 fecha a última regra de negócio que estava escrita e sem código desde a Unidade 1. A H-07 responde a única incerteza da análise que tinha sido empurrada para o backlog (INC-05) e, de quebra, **torna o OBJ-01 calculável pela primeira vez** — até esta entrega, o indicador que define o problema do projeto não podia ser medido, porque o sistema não registrava retirada nenhuma.

## 2. Decisões de projeto

Cada decisão tem um ADR em `docs/adr/`, com contexto, alternativas, trade-offs, decisão e consequências.

### Os ADRs desta entrega

| ADR | Decisão | Alternativas | O que decidiu o desempate |
|---|---|---|---|
| [**0005**](adr/0005-postgresql-no-lugar-do-sqlite.md) *(revisado)* | **Migração do SQLite para o PostgreSQL** | SQLite num servidor com disco · SQLite remoto (Turso) · PostgreSQL no Neon | Revisado nesta entrega com as evidências de duas mudanças de modelo feitas **depois** da migração. As duas são `ALTER TYPE ... ADD VALUE`, instrução que o SQLite não tem: lá, mudar um conjunto de valores aceitos obriga a recriar a tabela e copiar os dados. A decisão se confirmou |
| [**0007**](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md) | **Como o sistema sabe que o prazo venceu** (decisão D1) | As regras leem o relógio do servidor · o "agora" vira parâmetro das regras | O critério CA-03.3, que a análise já apontava como a fronteira da regra: com o relógio lido por dentro, o teste do limite exato de hoje não existe de forma honesta |
| [**0008**](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md) | **O que acontece com a doação aceita e não retirada** (decisão D2) | Liberação automática em 4 h · cancelamento manual pela ONG · (descartada) cancelamento pelo doador | A liberação automática precisa de algo que rode no tempo, e a função da Vercel só acorda quando chega uma requisição. O cancelamento manual entrega hoje as duas coisas que faltavam: devolver a doação à lista e os horários que o OBJ-01 mede |

### Decisão implementada nesta entrega, decidida antes

| ADR | Decisão | Situação |
|---|---|---|
| [**0006**](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) | Como a ONG ganha conta: cadastro na tela com aprovação da coordenação da cidade | Estava **aceito, a implementar**. Virou código nas histórias H-05 e H-06. O ADR ganhou uma tabela que liga cada regra da decisão ao código e ao teste correspondente |

### Todas as decisões do projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva | Situação |
|---|---|---|---|---|
| [ADR 0001](adr/0001-banco-postgresql-no-neon.md) | Onde os dados ficam guardados | Neon · Supabase | Problema central; rastreabilidade para a vigilância; OBJ-01 a OBJ-03 | Tomada: Neon |
| [ADR 0002](adr/0002-hospedagem-na-vercel.md) | Onde o sistema roda | Vercel · Render | CONF-01; hipótese H1; problema central | Tomada e no ar: Vercel |
| [ADR 0003](adr/0003-identificacao-por-email-e-senha.md) | Como doador e ONG se identificam | E-mail e senha · link de acesso pessoal | Decisão de análise (sem autenticação); RN-02; CONF-01 | Tomada e implementada. A regra da conta de ONG foi substituída pelo ADR 0006, agora implementado |
| [ADR 0004](adr/0004-prisma-e-migrations.md) | Como o banco evolui | Prisma · SQL versionado à mão | Riscos que pedem campos novos; restrição da disciplina | Tomada e implementada: Prisma |
| [ADR 0005](adr/0005-postgresql-no-lugar-do-sqlite.md) | Qual banco usar no lugar do SQLite | SQLite com disco · Turso · PostgreSQL | Problema central; CONF-01, via a hospedagem; restrição da disciplina | Tomada e implementada. **Revisada nesta entrega** |
| [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) | Como a ONG ganha conta | Script da coordenação · cadastro livre · cadastro com aprovação da cidade | Problema central; RN-02; risco do ADR 0003 | **Implementada nesta entrega** (H-05, H-06) |
| [ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md) | Como o sistema sabe que o prazo venceu (D1) | Relógio do servidor · "agora" como parâmetro | RN-03; H-03; nota de implementação da H-03; ADR 0002 (UTC) | **Tomada e implementada nesta entrega** (H-03) |
| [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md) | Doação aceita e não retirada (D2) | Liberação automática · cancelamento manual | Risco da ONG que não retira; INC-05; OBJ-01; OBJ-02 | **Tomada e implementada nesta entrega** (H-07) |
| D3 | Como as ONGs ficam sabendo de uma doação nova | Aviso no grupo de WhatsApp · notificação no celular | Problema central; Decisão de análise; OBJ-01; OBJ-02 | **Em aberto.** A tabela de trade-offs está em [`docs/decisoes-de-projeto.md`](decisoes-de-projeto.md) |

## 3. Requisitos não funcionais

Três requisitos que **mudaram o desenho do sistema**. Para cada um: de onde ele vem na análise, o que ele obrigou a fazer, o que ele obrigou a **não** fazer, e como saberíamos que ele não está sendo cumprido.

### RNF-01 — O doador publica em até 30 segundos

**De onde vem:** do CONF-01 e da fala do Seu Paulo — "no fim do expediente eu tenho 30 segundos. Se tiver formulário para preencher, eu jogo fora e pronto". É a hipótese H1 da análise.

**Como afeta o desenho:**

| Decisão de desenho | Por quê |
|---|---|
| A publicação tem **três campos** e nada mais | Critério do CONF-01: um campo só é obrigatório se a norma sanitária exigir ou se a ONG não puder decidir sem ele |
| **O doador não informa cidade**, mesmo tendo a ONG passado a informar nesta entrega | Foi a decisão mais direta tomada por este requisito. A cidade é necessária para saber **qual coordenação** aprova a ONG; no cadastro do doador ela não serve para nada hoje, e campo a mais no cadastro dele é doador a menos |
| A sessão dura **30 dias**, num cookie `HttpOnly` | O login é pago uma vez por celular, e não a cada doação: o atrito fica fora do caminho medido pela H1 |
| Hospedagem que **não dorme** ([ADR 0002](adr/0002-hospedagem-na-vercel.md)) | O servidor gratuito do Render leva cerca de um minuto para acordar: o dobro do orçamento inteiro do doador |
| O campo de data recebe `min` com o dia de hoje | O celular recusa um prazo no passado sem gastar uma ida e volta até o servidor ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)) |
| A tela **não mostra** o botão de aceitar para conta de ONG não aprovada | Mesma ideia, do outro lado: a tela não oferece uma ação que a regra vai recusar |

**O que este requisito nos impediu de fazer:** pedir origem, condição de conservação, temperatura e horário de preparo na publicação — tudo o que a vigilância sanitária gostaria de ter. Isso está registrado como risco aceito na análise, e não como esquecimento.

**Como saberíamos que não está cumprido:** mediana acima de 60 s ou mais de 20% de cadastros abandonados, pelo protocolo de [`docs/experimento-h1.md`](experimento-h1.md). **Ainda não medimos com doadores reais** — é o que falta para fechar este requisito, e nenhuma decisão de código substitui essa medição.

### RNF-02 — Ninguém age em nome de outro

**De onde vem:** da Decisão de análise da Unidade 1, que aceitou ficar sem identificação e registrou o preço: "qualquer pessoa aceita em nome de qualquer ONG". Aceitar é o ponto sensível, porque pela RN-02 o aceite tira a doação da lista de **todas** as outras ONGs. Com o sistema num endereço público, um visitante poderia aceitar tudo e as doações venceriam (OBJ-02).

**Como afeta o desenho:**

| Decisão de desenho | Por quê |
|---|---|
| A senha é guardada **só como hash** `scrypt` com sal, nunca como texto | Vazamento do banco não entrega as senhas. Teste: "guarda só o hash da senha, nunca a senha" |
| A sessão fica **numa tabela do banco**, e não assinada no cookie | Na Vercel, várias cópias da função rodam ao mesmo tempo; a sessão no banco vale para todas, e sair encerra a sessão de verdade |
| Três papéis separados: doador, ONG e coordenação | Publicar, aceitar e aprovar são ações de pessoas diferentes. Falta de login é `401`; papel errado é `403` |
| O cadastro da tela cria **doador ou ONG pendente, e mais nada** | Ninguém vira coordenação preenchendo o formulário. É o que o critério CA-04.2 passou a proteger nesta entrega |
| Aceitar exige conta de ONG **aprovada pela coordenação da cidade** (RN-04) | [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md): quem aprova conhece as ONGs da sua cidade |
| A situação da conta é **lida do banco a cada requisição**, não guardada na sessão | Uma aprovação vale na hora, e uma conta recusada perde o acesso na hora, sem esperar a sessão expirar |
| A coordenação só decide sobre contas **da sua cidade** | Sem isso, um coordenador aprovaria ONGs de qualquer cidade. O filtro por cidade usa `?? null` de propósito: no Prisma, uma cidade `undefined` apagaria o filtro e devolveria os pedidos de todas as cidades |
| Só a ONG que aceitou confirma a retirada ou cancela (RN-05) | [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md): nem o doador, nem outra ONG, nem a coordenação |

**O que este requisito nos custou:** mais código que a alternativa do link de acesso pessoal, e um login na primeira vez que o doador usa o sistema — atrito que o RNF-01 queria evitar. Os dois requisitos se chocam aqui, e a saída foi a sessão de 30 dias: o atrito é pago uma vez, fora do caminho da publicação.

**Como saberíamos que não está cumprido:** qualquer requisição conseguir publicar, aceitar, aprovar ou cancelar sem a conta certa. **25 dos 57 testes** existem só para isso. Para confirmar que eles têm dente, desligamos a regra do aceite (trocamos `exigirOngAprovada` por `exigirPapel`) e três testes quebraram na hora; depois restauramos a regra.

### RNF-03 — Os testes rodam com um comando, sem internet e sem senha

**De onde vem:** é um compromisso que assumimos na Unidade 1 e que a troca de banco ameaçava. Ele não nasce de uma fala de stakeholder: nasce de como queremos trabalhar, e por isso está escrito aqui, onde pode ser cobrado.

**Como afeta o desenho:**

| Decisão de desenho | Por quê |
|---|---|
| Os testes rodam num **PostgreSQL em memória** (PGlite), criado a partir das **mesmas migrations** que vão para o Neon | Se o teste usasse outro banco ou um schema escrito à mão, ele deixaria de provar o que vai para produção. Foi o PGlite que provou que `ALTER TYPE ... ADD VALUE` funciona dentro da transação em que o Prisma aplica cada migration |
| `vitest.config.js` força `DATABASE_URL` **vazia** | Garantia de que nenhum teste chegue ao banco de verdade por acidente |
| O **"agora" é parâmetro** das regras de doação ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)) | Sem isso, o teste do prazo depende do dia em que roda, e provar a fronteira de "hoje" exigiria mexer no relógio da máquina ou gravar no banco um estado que o sistema não produziria |
| Toda consulta vive só em `src/repositorio.js` | As regras não sabem qual é o banco, e trocar de banco não mexe nas regras |
| O CI **não tem segredo nenhum** | O endereço do Neon nunca entra no GitHub Actions. Um fork roda os testes sem pedir nada a ninguém |

**O que este requisito nos custou:** duas dependências de desenvolvimento (`@electric-sql/pglite` e `pglite-prisma-adapter`), um parâmetro a mais em quatro funções, e uma pegadinha que nos pegou durante esta entrega: mudar o `schema.prisma` sem rodar `prisma generate` faz os testes falharem com um erro do Prisma que não parece ter relação com o que você mudou.

**Como saberíamos que não está cumprido:** `npm ci && npm test` falhar numa máquina limpa, sem `.env`, ou o CI passar a precisar de um segredo.

**Um requisito que escolhemos não detalhar:** disponibilidade. O sistema não pode depender do computador de um integrante nem dormir, e isso levou ao Neon e à Vercel — mas essas decisões já estão inteiras nos ADRs [0001](adr/0001-banco-postgresql-no-neon.md) e [0002](adr/0002-hospedagem-na-vercel.md), e repeti-las aqui não acrescentaria nada.

## 4. Critérios de validação

Como sabemos que esta entrega está de pé:

| Critério | Como verificamos | Situação |
|---|---|---|
| Cada critério de aceite aponta para um teste **com nome** | `docs/analise.md`, seção Critérios de aceite | Atende. CA-01 a CA-07, com uma exceção: o CA-03 não tem teste para o prazo em horas, porque a regra é por dia, de propósito |
| Os testes cobrem erro, e não só o caminho feliz | 25 dos 57 testes verificam recusas | Atende |
| Os testes **falham** quando a regra sai | Mutação manual: `exigirOngAprovada` → `exigirPapel` quebrou 3 testes; fixture com data fixa quebrou 23 | Atende |
| Toda mudança entra por Pull Request, com CI verde e revisão de outro integrante | Histórico do repositório | Atende |
| Mudança de banco entra no mesmo PR, como migration versionada | `prisma/migrations/`, duas pastas novas nesta entrega | Atende |
| A decisão documentada e o código concordam | O [ADR 0006](adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md) tem uma tabela regra → código → teste | Atende |
| O OBJ-01 pode ser calculado | `criada_em`, `aceita_em` e `retirada_em` em `doacoes` | **Atende em parte:** os dados existem, mas nada obriga a ONG a confirmar a retirada, então a medida terá viés. Está registrado como consequência negativa no [ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md) |
| O RNF-01 (30 segundos) se confirma com doadores reais | Protocolo em [`docs/experimento-h1.md`](experimento-h1.md) | **Não atende ainda:** o experimento não foi executado |

## 5. Diagramas

Os diagramas da atividade anterior continuam valendo, e um deles mudou de significado com esta entrega:

- [`docs/diagramas/final/estados-doacao-v2.puml`](diagramas/final/estados-doacao-v2.puml) — ciclo de vida da doação. **Esta entrega acrescentou o estado `retirada` e a volta de `aceita` para `disponivel`** pelo cancelamento ([ADR 0008](adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md)), além da saída da lista por prazo vencido ([ADR 0007](adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)).
- [`docs/diagramas/final/sequencia-aceite-v2.puml`](diagramas/final/sequencia-aceite-v2.puml) — sequência do aceite de uma doação, que continua como estava: o aceite é uma única instrução que só altera a doação se ela ainda estiver disponível.

O modelo de dados está em [`prisma/schema.prisma`](../prisma/schema.prisma), e cada mudança nele tem o SQL correspondente em `prisma/migrations/`.

## 6. Uso de IA

| Trecho | Ferramenta | O que fizemos depois |
|---|---|---|
| Resumo das decisões e ADRs 0001 a 0004 | Claude Code (Anthropic) | Escolhemos Neon, Vercel, e-mail e senha e Prisma; revisamos os textos |
| Rascunho de `docs/decisoes-de-projeto.md`: decisões D1 a D3, alternativas, tabela de trade-offs e justificativa | Claude Code (Anthropic) | Escolhemos as três decisões e a D3 para a tabela de trade-offs, revisamos o texto e conferimos cada citação contra a nossa análise da Unidade 1 |
| ADRs 0005 e 0006, status do ADR 0003 e risco de crescimento no ADR 0001 | Claude Code (Anthropic) | Escolhemos o ADR 0003 para revisar diante da rede em várias cidades, decidimos manter o banco no Neon e revisamos os textos |
| **Entrega 2** — código das histórias H-03, H-05, H-06 e H-07, as duas migrations, os 34 testes novos, os ADRs 0007 e 0008 e a revisão do ADR 0005 | Claude Code (Anthropic) | As decisões foram nossas: escolhemos implementar o ADR 0006 que já estava aceito, escolhemos a alternativa A da D1 e a B da D2, e escolhemos deixar a D3 em aberto. Cobramos evidência em vez de aceitar afirmação: mandamos **medir** a quebra que a nota da H-03 previa (23 testes) em vez de escrever um número de memória, e **desligar** a regra do aceite para ver se os testes novos tinham dente (3 quebraram). Dois problemas foram encontrados nessa revisão: a ordem das verificações de retirada dava a mensagem errada para uma doação que ninguém aceitou, e um filtro `undefined` no Prisma mostraria à coordenação os pedidos de todas as cidades |

**Onde a IA não decidiu nada:** quais histórias entrariam, qual alternativa de cada decisão, o que fica no backlog, e o que escrevemos como consequência negativa de cada ADR.
