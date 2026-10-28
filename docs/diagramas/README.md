# Trabalho 2 — Diagramas de Projeto (Prato Cheio)

*Disciplina: Análise, Projeto e Desenvolvimento Ágil · Atividade avaliativa N2 · Entrega 28/10/2026*

**Grupo:** Rodrigo Xavier (@RodrigoKLappoth) · Henrique Xavier (@Ikeew)
**Ferramenta de IA utilizada:** Claude (Anthropic) — modelo Claude Opus, via claude.ai
**Notação e ferramenta de diagramação:** PlantUML (arquivos `.puml`, texto versionável)

---

## Onde o professor encontra cada item

| O que a atividade pede | Arquivo neste repositório |
|---|---|
| Justificativa da escolha dos dois diagramas | Este arquivo, seção **1** |
| Versão original gerada pela IA — Estados | `docs/diagramas/v1-ia/estados-doacao-v1-ia.puml` |
| Versão original gerada pela IA — Sequência | `docs/diagramas/v1-ia/sequencia-aceite-v1-ia.puml` |
| Análise crítica (problemas, justificativas, correções) | Este arquivo, seção **3** |
| Versão final — Estados | `docs/diagramas/final/estados-doacao-v2.puml` |
| Versão final — Sequência | `docs/diagramas/final/sequencia-aceite-v2.puml` |
| Imagens renderizadas (leitura rápida) | `docs/diagramas/img/*.png` |
| Reflexão final | Este arquivo, seção **5** |
| Pull Request revisado | link na seção **6** |
| *(entrega 2)* Estados depois das histórias novas | `docs/diagramas/final/estados-doacao-v3.puml`, explicado na seção **7** |

Os arquivos `v1-ia/` **não foram editados** depois de gerados: são a evidência da Parte 2.

---

## 1. Diagramas escolhidos e justificativa

Escolhemos dois diagramas que respondem a **perguntas diferentes** sobre o Prato Cheio:

| Diagrama | Pergunta que responde | Por que este, e não outro |
|---|---|---|
| **Diagrama de Estados (UML)** | *Quais estados uma doação assume e quais eventos provocam a mudança?* | O coração do sistema é a RN-02 ("quem chega primeiro leva"): uma doação aceita sai da lista. Isso é uma máquina de estados, e o `enum StatusDaDoacao` do `prisma/schema.prisma` tem exatamente dois valores. O diagrama expõe se o modelo de dados dá conta das três regras de negócio — e foi aqui que a RN-03 (doação vencida), ainda pendente, ficou visível. |
| **Diagrama de Sequência (UML)** | *Como os componentes interagem ao longo da operação de aceite, incluindo erros e concorrência?* | O estado diz *o que* muda; a sequência diz *quem* faz mudar e *em que ordem*. O aceite atravessa `app.js → usuarios.js → doacoes.js → repositorio.js → PostgreSQL`, com três respostas de erro diferentes (401, 403, 400) e um problema de concorrência real. Nenhuma dessas coisas aparece no diagrama de estados. |

Descartamos **Casos de Uso** (o sistema tem 3 funcionalidades e 2 atores — o diagrama não revelaria nada que o `docs/analise.md` já não diga) e **Classes** (o `schema.prisma` já é, em texto, o modelo de dados; um diagrama de classes seria tradução, não esclarecimento).

---

## 2. O que foi fornecido à IA (Parte 2)

Prompt enviado, em resumo: descrição do caso Prato Cheio (doadores publicam excedentes, ONGs aceitam antes que vençam), as histórias H-01 a H-04, as regras RN-01/RN-02/RN-03 e os critérios de aceite CA-02.x e CA-04.x de `docs/analise.md`. Pedimos "um diagrama de estados do ciclo de vida da doação" e "um diagrama de sequência do aceite", em PlantUML.

Deliberadamente **não** enviamos o código-fonte nesta primeira rodada — queríamos ver o que a IA assume sozinha. Foi o que produziu os problemas registrados abaixo.

---

## 3. Análise crítica — problemas identificados

### Problema 1 — Estados inventados e a regra real ausente (diagrama de Estados)

**Problema.** A IA produziu uma máquina de **sete** estados: `Pendente`, `Rejeitada`, `Disponivel`, `Reservada`, `EmTransporte`, `Entregue` e `Cancelada`. Nenhum deles, exceto `Disponivel`, existe no sistema. Ao mesmo tempo, o único estado que as regras de negócio realmente exigem além dos dois persistidos — a doação **vencida** (RN-03) — não aparece em lugar nenhum.

**Justificativa.** É um problema concreto em três frentes:

1. **Contradiz a implementação.** O `enum StatusDaDoacao` em `prisma/schema.prisma` tem exatamente dois valores: `disponivel` e `aceita`. O `src/repositorio.js` só escreve `'aceita'`. Um diagrama com moderação (`Pendente → aprovada`) e logística (`EmTransporte`, `Entregue`) comunica ao leitor um fluxo de trabalho que o Prato Cheio não tem e nunca decidiu ter.
2. **Contradiz decisões registradas.** A transição `Reservada → Disponivel` ("ONG desiste") é justamente o que a INC-05 e o 2º risco de `docs/analise.md` colocam **fora do escopo**: não existe cancelamento de aceite, e esse é um risco assumido conscientemente. O diagrama da IA apaga a decisão, fazendo parecer resolvido um problema que está aberto no backlog.
3. **Esconde a dívida real.** A RN-03 é a única regra de negócio ainda **pendente** no projeto, e é exatamente sobre estado ("doação vencida não aparece e não pode ser aceita"). Um diagrama de estados que não a representa falha na única função para a qual foi escolhido.

**Correção.** Reduzimos para os dois estados que o enum persiste (`disponivel`, `aceita`) e acrescentamos `vencida` com estereótipo `<<derivado>>` e uma nota explicando a decisão de projeto: *vencida* não vira um terceiro valor do enum, porque nenhum evento do usuário provoca a transição — só a passagem do tempo. Guardar o valor exigiria uma rotina periódica que o sistema não tem; por isso o estado é calculado na consulta (`WHERE validade >= hoje`). Removemos as transições de moderação e logística, removemos `Aceita → Disponivel` (com nota remetendo à INC-05) e anotamos cada transição com o endpoint, a guarda (`[papel = ong E status ainda = disponivel]`) e a regra correspondente. Acrescentamos ainda as autotransições de tentativa recusada (403 e "já foi aceita"), que o CA-02.3 e o CA-04.5 exigem e que a v1 ignorava.

---

### Problema 2 — Aceite modelado como ler-depois-escrever, sem autenticação (diagrama de Sequência)

**Problema.** A IA modelou o aceite em três passos: `buscar doação` → `verificar se está disponível` → `atualizar status`. Além disso, o diagrama começa direto no "aceitar doação": não há sessão, não há verificação de papel, e o único desfecho representado é o sucesso.

**Justificativa.**

1. **A sequência proposta quebra a RN-02 sob concorrência.** Entre o `SELECT` e o `UPDATE` existe uma janela: duas ONGs clicando em "Aceitar" quase ao mesmo tempo podem ambas ler `status = disponivel` e ambas gravar `aceita`. O resultado é exatamente o que a RN-02 e o OBJ-01 existem para evitar — dois voluntários deslocados para a mesma comida. O `src/repositorio.js` real **não** faz assim: usa `updateMany` com `where: { id, status: 'disponivel' }` e confere o `count`, uma única escrita condicional em que o banco decide o vencedor. O diagrama da IA documentaria uma implementação pior do que a que existe.
2. **Ignora a H-04 inteira.** Desde a Unidade 2 o aceite passa pelo middleware de sessão em `src/app.js` e por `exigirPapel(usuario, 'ong')`. O CA-04.5 e o CA-02.5 exigem 401 sem login e 403 com papel errado; o CA-02.3 exige que a mensagem diga **qual** ONG já aceitou e o CA-02.4 exige o caso "não encontrada". A v1 não representa nenhum dos quatro — um diagrama só de caminho feliz não serve para discutir aceite, porque é nos desvios que mora a regra.

**Correção.** Na v2, a escrita condicional virou uma única mensagem `UPDATE ... WHERE id = ? AND status = 'disponivel'` com retorno `count`, acompanhada de nota explicando por que não há leitura prévia; o `SELECT` posterior aparece apenas onde ele de fato ocorre — em `count = 0`, para montar a mensagem de erro. Acrescentamos o bloco de identificação (`pelaSessao` → tabela `sessoes` com `expira_em > agora`) e um `alt` com os quatro desfechos reais (401, 403, 400 id inválido, sucesso), com um `alt` aninhado para "não encontrada" × "já aceita por outra ONG". Cada desfecho cita o critério de aceite que o prova.

---

### Problema 3 (adicional) — "Sistema" como participante único

**Problema.** A v1 da sequência tem três participantes: `ONG`, `Sistema Prato Cheio` e `Banco de Dados`.

**Justificativa.** O Prato Cheio tem uma separação de camadas deliberada — `app.js` (rotas), `doacoes.js` (regras), `repositorio.js` (SQL) — e o próprio README diz que essa separação existe para que a troca de banco "fique contida e não vaze para as regras de negócio". Com um participante só, o diagrama não consegue responder *onde* mora a verificação de papel nem *onde* mora a garantia da RN-02, que é a pergunta de projeto que mais importa nesta operação.

**Correção.** A v2 usa um participante por módulo real, nomeado com o arquivo (`app.js`, `usuarios.js`, `doacoes.js`, `repositorio.js`), mais a interface e o PostgreSQL. Fica visível que a autorização acontece em `doacoes.js` (via `exigirPapel`) e que a RN-02 é garantida no banco, não na aplicação.

---

## 4. Versões finais

- `docs/diagramas/final/estados-doacao-v2.puml`
- `docs/diagramas/final/sequencia-aceite-v2.puml`

Ambos foram confrontados, linha a linha, com `prisma/schema.prisma`, `src/app.js`, `src/usuarios.js`, `src/doacoes.js`, `src/repositorio.js` e `docs/analise.md`. Onde o diagrama representa algo que **ainda não existe** no código (a RN-03), isso está dito em nota, e não desenhado como se estivesse pronto.

### Como renderizar

```bash
# opção 1 — servidor oficial, sem instalar nada: cole o conteúdo em
#           https://www.plantuml.com/plantuml/uml/

# opção 2 — VS Code: extensão "PlantUML" (jebbs) + Java + Graphviz
#           Alt+D para pré-visualizar

# opção 3 — linha de comando
java -jar plantuml.jar -tpng docs/diagramas/**/*.puml -o ../img
```

---

## 5. Reflexão final

**Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto?**

O **diagrama de estados**. O de sequência mostrou um erro da IA (o ler-depois-escrever), mas o código já estava certo — ele serviu para *documentar* uma decisão boa que já havia sido tomada. O de estados fez algo diferente: forçou uma decisão de projeto que ninguém no grupo tinha tomado explicitamente. Ao tentar desenhar a RN-03, apareceu a pergunta "`vencida` é um valor do enum ou é calculado?". As duas respostas são defensáveis — persistir o estado permite consultar o histórico e disparar notificação, mas exige uma rotina periódica rodando; derivar na consulta é mais simples e não tem processo para manter. Escolhemos derivar, e a justificativa está na nota do próprio diagrama.

Ou seja: o diagrama de sequência melhorou nossa *comunicação*, e o de estados melhorou nosso *projeto*. Foi também o de estados que nos obrigou a reencontrar a INC-05 e a recusar a transição `aceita → disponivel` que a IA tinha desenhado com naturalidade — um lembrete de que a IA preenche lacunas com o caso genérico, e o caso genérico não é o nosso.

---

## 6. Entrega

- **Repositório:** https://github.com/RodrigoKlappoth/Prato-Cheio
- **Pull Request revisado:** _(colar o link do PR aqui depois de abri-lo)_
- **Uso de IA:** a primeira versão dos dois diagramas foi gerada com Claude (Anthropic). O grupo revisou cada elemento contra o código e os documentos do repositório, identificou os três problemas acima e reescreveu os dois diagramas. Todo o conteúdo das seções 1, 3 e 5 foi discutido e redigido pelo grupo.

---

## 7. Atualização na entrega 2 (2026-10-27)

A entrega 2 implementou as regras RN-03, RN-04 e RN-05, e isso mexeu justamente no diagrama que havíamos escolhido por ser o do "coração do sistema". Criamos uma **v3 do diagrama de estados** e **mantivemos a v2 como está**: ela é a entrega desta atividade e registra o ciclo de vida de antes. Guardar as duas é o que mostra a evolução.

| Arquivo | O que é |
|---|---|
| `docs/diagramas/v1-ia/estados-doacao-v1-ia.puml` | Versão gerada pela IA, não editada (evidência da Parte 2) |
| `docs/diagramas/final/estados-doacao-v2.puml` | Versão revisada pelo grupo nesta atividade |
| `docs/diagramas/final/estados-doacao-v3.puml` | **Nova:** o ciclo de vida depois da entrega 2 |

O que mudou da v2 para a v3, e por quê:

| Mudança | Motivo |
|---|---|
| Estado **`retirada`** novo, terminal, gravando `retirada_em` | Decisão D2, [ADR 0008](../adr/0008-retirada-confirmada-e-cancelamento-do-aceite.md). A v2 tinha `Aceita --> [*] : retirada combinada fora do sistema (INC-05)`: a retirada entrou no sistema, e com ela a medida do OBJ-01 |
| Transição **`aceita → disponivel`** pelo cancelamento | A v2 tinha uma nota dizendo explicitamente que essa transição **não** existia, e remetendo à INC-05. Ela passou a existir, e a nota da v3 cita a da v2 |
| A transição para **`vencida`** deixou de ser "(RN-03, pendente)" | A RN-03 foi implementada ([ADR 0007](../adr/0007-agora-como-parametro-e-dia-de-sao-paulo.md)) |
| Guarda do aceite ganhou `situacao = aprovada` e `validade >= hoje` | RN-04 ([ADR 0006](../adr/0006-cadastro-de-ong-com-aprovacao-da-cidade.md)) e RN-03 |
| Autotransições novas para os erros de retirar e cancelar | CA-07.4 e CA-07.6 |

**A decisão de projeto da v2 se confirmou.** A reflexão da seção 5 dizia que o diagrama de estados nos obrigou a decidir se "vencida" seria um valor do enum ou algo calculado na consulta, e que escolhemos calcular. Ao implementar a RN-03 de verdade, mantivemos essa escolha: o `enum StatusDaDoacao` ganhou `retirada`, que é provocado por um evento do usuário, e **não** ganhou `vencida`, que só depende da passagem do tempo. O diagrama previu certo o critério: entra no enum o que alguém provoca.
