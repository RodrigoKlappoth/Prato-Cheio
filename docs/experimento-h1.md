# Experimento H1 — o cadastro de três campos cabe nos 30 segundos do doador?

*Anexo do documento de análise. Fica fora de `analise.md` para respeitar o limite de 4 páginas.*

## 1. De onde vem

**Suposição (INC-01, decorrente de CONF-01):** assumimos que três campos obrigatórios — tipo, quantidade e prazo de retirada — são poucos o bastante para não afastar o doador. A base dessa decisão é uma frase de um único doador ("no fim do expediente eu tenho 30 segundos"). Nunca foi medida.

**Por que importa:** se a suposição estiver errada, a falha é silenciosa. O doador não abre chamado nem reclama no grupo — ele fecha o app e joga a comida no lixo. O produto perde exatamente aquilo que OBJ-02 mede, sem gerar nenhum sinal no sistema.

## 2. Hipótese

> **H1** — Com o cadastro reduzido a três campos obrigatórios, um doador consegue publicar uma doação sozinho, pelo celular, em até 30 segundos, e menos de 20% dos cadastros iniciados são abandonados antes da publicação.

**Forma testável:**

| Elemento | Valor |
|---|---|
| Métrica primária | Mediana do tempo entre o primeiro toque no formulário e a tela de confirmação |
| Limiar de sucesso | ≤ 30 s |
| Limiar de fracasso | > 60 s |
| Métrica secundária | Taxa de abandono = 1 − (doações publicadas ÷ formulários abertos) |
| Limiar | ≤ 20% (o mesmo já registrado em CONF-01 como "sinal de que erramos") |
| *Guardrail* | % de doações aceitas em que a ONG precisou ligar para o doador antes de decidir — deve ficar ≤ 15% |

O *guardrail* existe para impedir a vitória fácil: dá para zerar o tempo de cadastro removendo todos os campos e transferindo o trabalho para a ONG. Se as ligações de volta subirem, ganhamos no relógio e perdemos no produto.

## 3. Desenho

**Tipo:** teste de usabilidade moderado, cronometrado, em campo. Não é um teste A/B — não temos volume para isso, e a decisão que precisamos tomar (manter ou cortar um campo obrigatório) não exige significância estatística, exige evidência suficiente.

**Participantes:** 8 doadores reais da rede da Marta, com variedade de porte e de tipo — pelo menos 2 padarias, 2 restaurantes, 1 mercado, 1 cozinha industrial. Critério de inclusão: quem doa ou já doou pelo grupo do WhatsApp.

**Por que 8:** teste de usabilidade com 5 a 8 participantes revela a maior parte dos problemas de fluxo. Passar disso, nesta fase, só confirma o que já apareceu.

**Onde e quando:** no estabelecimento do participante, nos últimos 30 minutos do expediente — o momento real em que a decisão de doar ou descartar acontece. Não em sala, não em horário calmo.

**Aparelho:** o celular do próprio participante, com a interface aberta em `public/index.html`. Aparelho nosso mascararia problemas de tela pequena, teclado e conexão.

## 4. Roteiro

1. **Enquadramento (30 s, sem instrução de uso):** "Fechou a padaria e sobraram 10 porções de sopa que precisam sair até amanhã de manhã. Publique isso para as ONGs. Vou ficar quieto — se travar, faça o que faria se eu não estivesse aqui."
2. **Cronômetro:** inicia no primeiro toque na tela; para na confirmação de publicação, ou no momento em que o participante desiste.
3. **Sem ajuda.** Se pedir socorro, registra-se como abandono e o cronômetro para. Ajudar contamina a medida.
4. **Registro por participante:** tempo total; campo em que travou (se travou); publicou ou desistiu; falas espontâneas, transcritas literalmente.
5. **Duas perguntas ao final:** "O que você deixaria de preencher se pudesse?" e "Faria isso todo dia?"

**Quem faz:** dois integrantes — um conduz, outro anota e cronometra. Quem conduz não comenta a tela.

## 5. Instrumentação

O que já existe no repositório serve de apoio, mas não basta:

- `criada_em` na tabela `doacoes` dá o instante da publicação — só o fim do intervalo.
- Falta o começo. Registrar no front (`public/index.html`) o instante do primeiro toque no formulário e enviá-lo junto com a doação, ou logar o par `formulario_aberto` / `doacao_publicada` — é o mínimo para medir abandono sem alguém com cronômetro na mão, e é o que permite repetir a medição em operação real na Unidade 2.

O cronômetro manual é a medida deste experimento; a telemetria é o que torna a medição repetível depois.

## 6. Critérios de decisão

Definidos **antes** de coletar, para não ajustar a régua ao resultado.

| Resultado observado | Decisão |
|---|---|
| Mediana ≤ 30 s **e** abandono ≤ 20% **e** ligações de volta ≤ 15% | H1 confirmada. Mantemos os três campos, CONF-01 fecha e a análise segue sem mudança. |
| Mediana > 60 s **ou** abandono > 20% | H1 refutada. Quantidade sai dos obrigatórios (fica tipo + prazo), com estimativa opcional; reabrimos CONF-01 com a vigilância antes da Unidade 2, porque isso mexe na rastreabilidade. |
| Mediana entre 30 e 60 s, abandono entre 10% e 20% | Inconclusivo. Não mudamos o escopo por sensação: mantemos os três campos e re-medimos com telemetria nas duas primeiras semanas de operação real. |
| Ligações de volta > 15%, com qualquer tempo | Sinal oposto: cortamos informação demais. A revisão passa a ser sobre *quais* campos, não sobre *quantos*. |

## 7. Ameaças à validade

| Ameaça | Efeito | O que fazemos |
|---|---|---|
| Efeito do observador — o doador se esforça mais sendo observado | Tempo medido otimista; o número real em operação tende a ser pior | Tratamos a mediana obtida como **piso**, não como estimativa; confirmamos com telemetria na U2 |
| Viés de seleção — só medimos quem já doa pela rede da Marta | Nada diz sobre o doador que nunca entrou | Limitação declarada; recrutar doadores novos fica para a U2 |
| Tarefa única e ensaiada | Não captura o cansaço da repetição diária | A pergunta "faria isso todo dia?" é o sinal qualitativo disponível agora |
| n = 8 | Sem poder estatístico | A decisão é de produto, não inferência; os limiares são grosseiros de propósito e nenhum deles depende de diferença fina |
| Conexão ruim no estabelecimento | Inflaria o tempo por motivo alheio à hipótese | Registrar quando ocorrer e reportar as duas medianas, com e sem esses casos |

## 8. Custo e prazo

Duas tardes de coleta, cerca de 4 horas de duas pessoas, mais 1 hora de consolidação. Custo financeiro zero. Depende de a Marta abrir o contato com os 8 doadores — é a única dependência externa e o principal risco de prazo.

## 9. Registro dos resultados

*Preencher após a coleta.*

| Participante | Tipo de estabelecimento | Tempo (s) | Publicou? | Onde travou | Fala relevante |
|---|---|---|---|---|---|
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |
| P4 | | | | | |
| P5 | | | | | |
| P6 | | | | | |
| P7 | | | | | |
| P8 | | | | | |

**Mediana:** ___ s **Abandono:** ___% **Ligações de volta:** ___%
**Decisão tomada:** ___
**O que mudou no documento de análise por causa disso:** ___
