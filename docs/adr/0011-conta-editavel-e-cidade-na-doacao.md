# ADR 0011 — A conta é editável, e a doação guarda a cidade em que foi publicada

- **Data:** 2026-11-11
- **Status:** aceito e implementado (história H-09, regra RN-07)

## Contexto

O [ADR 0009](0009-estado-e-cidade-escolhidos-em-lista.md) fechou o erro de digitação na cidade, mas deixou uma porta trancada, e nós escrevemos isso lá, na lista de consequências negativas:

> **Não existe jeito de corrigir a cidade de uma conta.** (…) Quem escolher a cidade errada precisa de outra conta, ou que a equipe corrija no banco.

É a pior forma de ficar preso que o sistema tem hoje. A conta funciona — entra, vê a tela, não dá erro nenhum —, só não encontra a rede: a ONG cadastrada na cidade errada vê a lista vazia de uma cidade que não é a dela, e o doador publica para ONGs que não vão buscar. Nada quebra, ninguém recebe mensagem de erro, e a única saída está fora do sistema.

**O que a história H-09 obrigou a decidir.** O mesmo ADR 0009 justificou um atalho com uma premissa que a edição de conta derruba:

> **A doação não guarda cidade própria:** ela herda a de quem publicou (…). A conta não pode mudar de cidade hoje, então a relação dá sempre a resposta certa.

A premissa era verdadeira quando foi escrita, e deixa de ser no momento em que a conta passa a poder mudar de cidade. Com a herança, corrigir a cidade do doador **reescreve o passado**: a doação retirada em Joinville na semana passada passa a constar como de Blumenau, no histórico do doador, no da ONG que foi buscar, e em qualquer número que a gente venha a calcular por cidade (OBJ-01 e OBJ-02). O dado não fica errado aos poucos: ele muda de lugar de uma vez, em silêncio, e sem nada no banco que registre que mudou.

## Alternativas consideradas

Duas perguntas, cada uma com as suas alternativas.

**(a) Quem corrige a conta?**

1. **A própria pessoa, na tela.**
   - Prós: resolve no momento em que o erro é percebido, que é o cadastro; não cria trabalho para a coordenação.
   - Contras: é uma rota nova que escreve na conta, e tudo que ela não deve mudar — e-mail, senha, papel, situação — precisa ficar de fora de propósito, não por esquecimento.
2. **Só a coordenação corrige, pela tela de pedidos.**
   - Prós: uma porta menos; a coordenação já decide sobre contas de ONG.
   - Contras: para o **doador** não existe ninguém olhando — ele não passa por aprovação. E transforma um erro de digitação do próprio usuário em pedido para outra pessoa, que pode demorar: a conta fica inútil nesse meio-tempo, que é exatamente o problema que estamos resolvendo.
3. **Deixar como está** e corrigir no banco quando alguém pedir.
   - Prós: zero código.
   - Contras: é o que já temos, e é a dívida que estamos pagando. Depende de um de nós dois estar disponível com acesso ao banco de produção.

**(b) O que acontece com as doações quando a cidade da conta muda?**

1. **A doação guarda a própria localidade, copiada na publicação.**
   - Prós: a doação fica onde a comida estava; nenhum registro antigo muda de cidade; a consulta da lista deixa de passar pela conta do doador.
   - Contras: um dado em dois lugares — a localidade da conta e a da doação; migration com preenchimento retroativo.
2. **Manter a herança pela conta** e aceitar que a cidade das doações antigas acompanhe o doador.
   - Prós: nada a construir; nenhum dado duplicado.
   - Contras: reescreve o histórico, como descrito acima. E o pior efeito é o que ninguém vê: as listas da semana passada passam a ter sido outras.
3. **Manter a herança** e, para proteger o histórico, **proibir a conta de mudar de cidade** depois da primeira doação.
   - Prós: o histórico fica certo, sem migration.
   - Contras: fecha a porta justamente para quem mais precisa dela — o doador que descobriu o erro depois de publicar. A primeira doação prenderia a conta para sempre.

## Decisão

**(a) alternativa 1** e **(b) alternativa 1**, com estas regras:

- **A pessoa corrige o nome, o estado e a cidade da própria conta**, em `PATCH /api/eu`. A rota não recebe id: ela mexe na conta da sessão, e em nenhuma outra.
- **E-mail, senha, papel e situação não mudam por aí.** E-mail e senha são a identificação ([ADR 0003](0003-identificacao-por-email-e-senha.md)), o papel define o que a conta pode fazer, e a situação da conta de ONG é decisão da coordenação (RN-04): se ela virasse campo de formulário, a aprovação não valeria nada. Enviar esses campos no corpo do pedido não dá erro — o pedido é atendido e eles são ignorados.
- **A cidade nova passa pela mesma lista do cadastro**, pela mesma função. Uma lista que vale numa porta e não vale na outra não é uma regra.
- **O campo que não vem no pedido fica como está.** É por isso `PATCH`, e não `POST`: quem corrige só o nome não precisa reenviar a cidade.
- **A cidade não muda com doação em circulação.** Para o doador, doação dele ainda `disponivel` e no prazo; para a ONG, aceite ainda sem retirada confirmada. "Em circulação" é o mesmo que no resto do sistema, inclusive no prazo (RN-03): doação vencida já saiu da lista e não prende ninguém. Corrigir o **nome** continua liberado sempre.
- **A doação guarda `estado` e `cidade` próprios**, copiados da conta do doador no instante da publicação. A lista de disponíveis e o aceite passam a comparar a localidade da doação, e não a da conta de quem publicou.
- **A migration preenche o passado pela relação**, doação por doação, com a localidade atual da conta de cada doador — o mesmo valor que o sistema usava para ela até agora. Nenhuma lista muda ao aplicar a mudança.

**Por que as duas regras, e não só uma.** A cópia sozinha resolveria o histórico, mas deixaria uma comida esperando em Joinville publicada por um doador que o sistema agora diz estar em Blumenau: a ONG vai buscar onde? O bloqueio sozinho resolveria a combinação pendente, mas não o histórico — a doação retirada no mês passado continuaria viajando junto com a conta. Cada uma cobre o que a outra deixa.

**O que não usamos como motivo:** "é mais fácil guardar a cidade na doação". A consulta ficou um pouco mais simples, sim, e isso é consequência, não justificativa.

## Consequências

- **Positivas:**
  - A primeira dívida do ADR 0009 está paga: quem erra a cidade corrige em dois toques, sem criar outra conta e sem ninguém mexer no banco.
  - O histórico passou a ser história: a doação registra onde a comida estava, e isso não muda mais depois.
  - O OBJ-01 e o OBJ-02 ficaram calculáveis **por cidade** sem depender do cadastro de hoje.
  - `src/repositorio.js` deixou de precisar de uma função só para descobrir a cidade da doação pela conta do doador: a doação responde por si.
- **Negativas / o que abrimos mão:**
  - **A localidade existe em dois lugares.** Na conta, é onde a pessoa está; na doação, onde a comida estava. São duas coisas diferentes com o mesmo nome, e alguém vai confundir — por isso está escrito no `schema.prisma`, ao lado dos dois campos.
  - **O doador com doação em circulação espera para mudar de cidade.** A espera é curta (até a retirada ou o fim do prazo), mas existe, e ele não tem como cancelar a própria doação para sair dela mais rápido — a RN-05 dá o cancelamento só à ONG que aceitou.
  - **A troca de e-mail e de senha continuam fora do sistema.** A senha depende da recuperação por e-mail, que o [ADR 0003](0003-identificacao-por-email-e-senha.md) deixou no backlog; o e-mail é a identificação, e trocá-lo mexe em sessão e em unicidade. Nenhum dos dois entra nesta história.
  - ~~**Nada guarda o histórico da própria conta.**~~ **Dívida paga em 2026-11-12, pelo [ADR 0012](0012-rastro-da-mudanca-de-localidade.md) (história H-11, regra RN-08).** O texto original era: *"Depois da correção, não sobra registro de que a conta era de outra cidade. Para a conta de ONG isso é mais relevante do que parece: a coordenação aprovou uma ONG que dizia ser de uma cidade, e ela pode estar em outra."* Toda mudança de estado ou cidade passou a ficar gravada, e a coordenação vê as contas de ONG que mudaram depois da aprovação. Nenhuma premissa deste ADR caiu: a conta continua editável pela própria pessoa, e a doação continua guardando a cidade em que foi publicada.
- **Riscos e o que fazer:**
  - *A ONG mudar de cidade para alcançar doações de outra cidade* → o bloqueio por doação em circulação limita o estrago a doações futuras, e a aprovação da conta continua valendo. Se virar problema real, a saída é a mesma do risco acima: gravar a mudança de cidade com data, e avisar a coordenação. Fica registrado aqui, sem código. **Implementado em 2026-11-12 ([ADR 0012](0012-rastro-da-mudanca-de-localidade.md)):** a mudança fica gravada e a coordenação a vê na tela. Decidimos implementar antes de "virar problema real", porque perceber que virou dependia justamente do dado que não existia.
  - *Uma doação nascer com a localidade errada por bug na cópia* → é o que o CA-09.9 cobre nas duas pontas: a lista da cidade nova mostra só a doação nova, e a antiga continua na cidade antiga.
  - *Alguém reintroduzir a leitura da cidade pela relação `publicada_por`* → o comentário na consulta de disponíveis diz por que ela não usa mais a conta do doador.

## Rastreabilidade

- **[ADR 0009](0009-estado-e-cidade-escolhidos-em-lista.md):** este ADR paga a primeira dívida que ele registrou e **substitui a premissa** de que a doação pode herdar a cidade pela conta.
- **[ADR 0003](0003-identificacao-por-email-e-senha.md):** e-mail e senha continuam fora da edição de conta; a recuperação de senha segue no backlog.
- **RN-04 ([ADR 0006](0006-cadastro-de-ong-com-aprovacao-da-cidade.md) e [ADR 0010](0010-aprovacao-central-da-conta-de-ong.md)):** a situação da conta de ONG não é editável pela própria ONG — é o que mantém a aprovação valendo.
- **RN-06, RN-07** e história **H-09**, com os critérios CA-09.1 a CA-09.9.
- **OBJ-01 e OBJ-02:** medir por cidade exige que a cidade da doação não mude depois do fato.
- **Problema central:** conta que não encontra a rede é doador fora da rede, e comida no lixo.
