# ADR 0009 — Toda conta tem estado e cidade, escolhidos numa lista

- **Data:** 2026-10-27
- **Status:** aceito e implementado (história H-08, regra RN-06)

## Contexto

O [ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md) trouxe a cidade para a conta de ONG e de coordenação, como **texto digitado**. Usar o sistema por algumas horas mostrou dois problemas, um de dado e um de produto.

**O problema de dado.** A cidade é comparada por igualdade exata: é assim que a coordenação encontra os pedidos da sua cidade. Com texto livre, "Joinville", "joinville" e "Joinvile" são três cidades diferentes para o sistema. Uma ONG que erra uma letra no cadastro desaparece: não aparece para ninguém aprovar e, depois da RN-06, não veria doação nenhuma. O erro é silencioso — ninguém recebe mensagem de erro, a conta simplesmente não encontra a rede dela.

**O problema de produto.** O doador não tinha cidade. Sem ela, a doação não tem cidade, e a lista de disponíveis é uma só para toda a rede. Com a rede em mais de uma cidade, uma ONG de Joinville vê uma sopa publicada em Blumenau e desloca voluntário para 130 km de distância — exatamente o desperdício que o OBJ-01 e o OBJ-02 existem para evitar.

**Uma premissa nossa que estava errada.** Quando implementamos o ADR 0006, escrevemos que o doador não informa cidade "porque cada campo a mais no cadastro dele aumenta a chance de desistir (CONF-01)". Fomos reler a análise: o CONF-01 decide os campos obrigatórios **da doação** ("o cadastro fica com três campos obrigatórios — tipo, quantidade e prazo de retirada"), e a hipótese H1 cronometra "o tempo entre o primeiro toque no formulário e a tela de confirmação" da **publicação**. O formulário de **conta** é preenchido uma vez por estabelecimento e está fora do caminho que a H1 mede. Tínhamos esticado o CONF-01 para onde ele não vale, e usado isso como justificativa. Registramos o erro em vez de apagá-lo.

## Alternativas consideradas

1. **Manter texto digitado**, só acrescentando o campo ao cadastro do doador.
   - Prós: nada a construir além do campo.
   - Contras: o erro de digitação continua partindo a rede em silêncio, e agora com mais gente digitando, porque o doador também passa a informar. Não há lista contra a qual validar.
2. **Dois boxes de escolha — estado e depois cidade — com a lista curada no código.**
   - Prós: erro de digitação deixa de existir; no celular, escolher é mais rápido que digitar; a lista é a resposta explícita à pergunta "onde a rede atende?"; validação no servidor contra a mesma lista.
   - Contras: a lista é trabalho nosso para manter; quem está numa cidade fora dela não consegue se cadastrar.
3. **Lista completa dos municípios**, pelo IBGE: embutida no repositório (~5.570 cidades) ou consultada na API em tempo de execução.
   - Prós: ninguém fica fora.
   - Contras: embutida, são 150 KB enviados ao celular do doador por uma informação que ele usa uma vez. Por API, o cadastro passa a depender de um serviço externo estar no ar. E as duas oferecem cidades onde a rede não tem doador nem ONG: a conta é criada e não serve para nada, porque não há do outro lado quem publique ou quem retire.

## Decisão

Alternativa **2**, com estas regras:

- **Toda conta tem estado e cidade, obrigatórios**: doador, ONG e coordenação. Sem exceção, e as colunas são `NOT NULL` no banco.
- **A lista é de Santa Catarina, e só.** É onde a rede atende. Quando ela chegar a outro estado, a mudança é acrescentar uma chave em `src/localidades.js`.
- **A lista é curada, e cresce por Pull Request.** Ela tem 61 cidades, e não os 295 municípios de SC: entra cidade onde a rede atende ou pretende atender. O PR que acrescenta uma cidade fica como registro de "a rede chegou aqui".
- **O estado é campo próprio, mesmo com um valor só.** Cidade sem estado é ambígua no Brasil, onde o mesmo nome se repete em estados diferentes, e a estrutura já está pronta para o segundo estado.
- **O servidor valida contra a lista.** O box da tela evita o erro; a validação no servidor é o que garante a regra, porque a tela não é a única porta da API.
- **A ONG vê e aceita só as doações da cidade dela** — é a regra **RN-06**, história H-08. Vale nas duas pontas: a lista filtra, e o aceite recusa com `403` quem tenta aceitar doação de outra cidade sabendo o número. Esconder não é proteger.
- **A doação não guarda cidade própria:** ela herda a de quem publicou, pela relação com a conta do doador. A conta não pode mudar de cidade hoje, então a relação dá sempre a resposta certa, e uma cópia seria dado duplicado sem ganho nenhum.

**O que não usamos como motivo:** "assim fica mais rápido". A filtragem entra na mesma consulta que já buscava as doações disponíveis.

## Consequências

- **Positivas:**
  - O erro de digitação na cidade deixou de ser possível, e com ele o pior tipo de defeito: o que não dá mensagem nenhuma.
  - A doação passou a ter cidade, e o voluntário não é mais mandado para outra cidade.
  - O cadastro ficou mais rápido no celular, apesar de ter dois campos a mais: escolher numa lista é menos trabalho que digitar o nome de uma cidade com acento.
  - A pergunta "onde a rede atende?" tem uma resposta num arquivo, em vez de ser o conjunto do que as pessoas digitaram.
- **Negativas / o que abrimos mão:**
  - **Dois campos a mais no cadastro do doador.** Pagos uma vez, fora do caminho que a H1 mede — mas são dois campos a mais, e isso não é zero.
  - **Quem está numa cidade fora da lista não se cadastra.** É intencional, e é uma porta fechada: a ONG de uma cidade onde a rede não atua recebe "a rede ainda não atende" em vez de uma conta inútil. Mas depende de nós abrirmos a porta, e isso é um pedido que chega por fora do sistema.
  - **A lista não cobre SC inteiro:** 61 das 295 cidades. É uma decisão, não um descuido, mas quem mora nas outras 234 está fora até alguém abrir um PR.
  - **Não existe jeito de corrigir a cidade de uma conta.** O sistema não tem edição de conta, nem nesta entrega nem antes. Quem escolher a cidade errada precisa de outra conta, ou que a equipe corrija no banco. Isso entra no backlog como a primeira dívida desta decisão.
- **Riscos e o que fazer:**
  - *A lista ficar desatualizada enquanto a rede cresce* → o pedido chega pela coordenação e vira um PR de uma linha; é rápido, mas não é automático.
  - *Alguém assumir que a lista é a lista do IBGE* → o comentário no topo de `src/localidades.js` diz o contrário, com o motivo.
  - *Uma conta antiga ficar com cidade fora da lista* → a migration avisa sobre isso no comentário e preenche só as nulas; corrigir valor existente é trabalho manual, porque o sistema não tem como adivinhar a cidade certa.

## Rastreabilidade

- **CONF-01 e H1:** a correção da premissa. O CONF-01 trata dos campos da **doação**, e não dos da conta.
- **OBJ-01 e OBJ-02:** doação vista pela ONG errada é voluntário deslocado e comida que vence.
- **Problema central:** "a rede já funciona por WhatsApp". O grupo de WhatsApp é de uma cidade; a lista de doações precisava ser também.
- **RN-06** e história **H-08**, com os critérios CA-08.1 a CA-08.5.
- **[ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md):** trouxe a cidade para a conta de ONG; este ADR a leva para todas as contas e troca o texto livre pela lista.
- **[ADR 0010](0010-aprovacao-central-da-conta-de-ong.md):** decidido junto com este, sobre quem aprova a conta de ONG.
