# ADR 0003 — Identificação de doador e ONG por e-mail e senha

- **Data:** 2026-09-23
- **Status:** aceito e implementado (história H-04)

## Contexto
A Unidade 1 ficou sem identificação, de propósito. O preço foi registrado na própria análise, na Decisão de análise: "qualquer pessoa aceita em nome de qualquer ONG e o campo `ong` é texto livre", aceitável só enquanto a rede fosse a da Marta, com ONGs conhecidas, "mas vira história obrigatória na U2". A análise também registrou que "o modelo não guarda o doador que publicou", o que limita a rastreabilidade prometida à vigilância. E a tela mandava sempre o nome fixo "Minha ONG".

Com o sistema num endereço público ([ADR 0002](0002-hospedagem-na-vercel.md)), qualquer visitante poderia aceitar todas as doações: elas sumiriam da lista das outras ONGs e venceriam (RN-02, OBJ-02).

O cuidado oposto também vem da análise: cada passo a mais antes de publicar aumenta a chance de o doador desistir (CONF-01).

## Alternativas consideradas
1. **E-mail e senha** — cada pessoa tem uma conta; o celular fica conectado por 30 dias.
2. **Link de acesso pessoal** — a Marta cadastra cada participante e o sistema gera um link único; quem abre o link fica identificado, sem senha.

A comparação critério a critério:

| Critério | De onde vem | A — E-mail e senha | B — Link de acesso pessoal |
|---|---|---|---|
| Ninguém aceita em nome de uma ONG | Decisão de análise (riscos e limitações); RN-02 | **Sim.** Só entra quem sabe a senha, e a conta de ONG é criada pela coordenação | **Em parte.** Quem recebe um link encaminhado vira aquela ONG, e a rede já vive de encaminhar mensagens no WhatsApp (problema central) |
| Atrito para o doador publicar | CONF-01; INC-01 e H1 (até 30 s) | **Médio.** Um login por celular; depois a sessão dura 30 dias e a publicação continua com três campos | **Nenhum.** O doador abre o link uma vez |
| Entrar na rede sem depender da Marta | Problema central (canal "dependente de uma pessoa"); a Marta quer "aceitar o máximo de doadores possível" | **Sim, para o doador**, que cria a conta sozinho | **Não.** Todo participante espera a Marta gerar o link |
| Saber quem publicou cada doação | Decisão de análise ("o modelo não guarda o doador que publicou"); a vigilância quer saber "por quem" | **Sim**, com o e-mail da conta como contato | **Sim**, mas o contato depende do cadastro feito pela Marta |
| Recuperar o acesso | CONF-01 (o doador desiste ao primeiro atrito) | **Pior.** Sem recuperação de senha na primeira versão | **Melhor.** A Marta gera outro link |
| Familiar para quem usa | Stakeholders: doadores querem publicar "sem burocracia" | **Sim.** Todo mundo já usou login com senha | **Não.** Um link que funciona como senha é incomum e fácil de repassar sem querer |
| Esforço para construir | Restrição do projeto: prazo da Unidade 2 | **Maior.** Senha guardada com hash, sessão, telas de entrar e de criar conta | **Menor.** Tabela de links e um cookie |

B ganha em atrito, em recuperação de acesso e em esforço. A ganha no critério que motivou a decisão, ninguém aceitar em nome de uma ONG, e também em independência da Marta e em familiaridade.

## Decisão
E-mail e senha, com duas regras de desenho:

- **O doador cria a própria conta**, na tela, em segundos. A Marta quer "aceitar o máximo de doadores possível", e a entrada de doadores não pode depender dela.
- **A conta de ONG é criada pela coordenação**, com `npm run ong:criar`. Aceitar é o ponto sensível: é o que tira a doação da lista de todas as outras (RN-02). Só ONGs conhecidas aceitam. O cadastro público sempre cria doador, mesmo que o pedido diga outra coisa.

Escolhemos senha, e não link, porque a rede vive de encaminhar mensagens no WhatsApp: um link de acesso encaminhado transforma quem o recebe naquela ONG. O atrito da senha é pago uma vez por celular, e não a cada doação: a sessão dura 30 dias e a publicação continua com os mesmos três campos.

## Consequências
- **Positivas:** ninguém aceita em nome de uma ONG sem a senha dela; cada doação registra quem publicou e quem aceitou; o nome da ONG vem da conta, e não da digitação; a lista mostra o doador, que é a "origem" que o CONF-01 previa preencher automaticamente para doador recorrente.
- **Como foi feito:** a senha é guardada só como resumo (hash `scrypt` do próprio Node, com sal), nunca como texto; a sessão fica numa tabela do banco, com cookie `HttpOnly` de 30 dias; nenhuma biblioteca nova de login. Doador que tenta aceitar e ONG que tenta publicar recebem `403`; quem não entrou recebe `401`.
- **Negativas / o que abrimos mão:** mais código que o link; o doador faz login na primeira vez; não há "esqueci minha senha" nesta versão.
- **Riscos e o que fazer:**
  - *Doador esquece a senha* → recuperação por e-mail entra no backlog; até lá, fala com a coordenação.
  - *Tentativas repetidas de adivinhar senha* → limite de tentativas entra no backlog antes de divulgar o endereço amplamente.
  - *A coordenação vira gargalo para ONGs novas* → as ONGs são poucas e conhecidas; se a rede crescer, trocar por cadastro de ONG com aprovação.
  - *No experimento H1, o login não pode entrar no cronômetro* → a conta é criada na preparação, antes da tarefa.

## Rastreabilidade
- Decisão de análise, "Riscos e limitações": identificação vira história obrigatória na U2 → **H-04** e critérios CA-04.1 a CA-04.8.
- RN-02 e CA-02.5: registrar qual ONG aceitou, sem texto livre.
- Risco "a vigilância exigir registro...": registrar quem publicou.
- CONF-01 e H1: o atrito do doador fica fora da publicação.
- Stakeholder Marta: "aceitar o máximo de doadores possível".
