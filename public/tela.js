const $ = (id) => document.getElementById(id);

const TELAS = ['tela-carregando', 'tela-entrar', 'tela-doador', 'tela-ong', 'tela-coordenacao'];
const reduzirAnimacoes = window.matchMedia('(prefers-reduced-motion: reduce)');

const PAPEL_NA_TELA = { doador: 'Doador', ong: 'ONG', coordenacao: 'Coordenação' };

const NOME_NO_CADASTRO = {
  doador: ['Nome do estabelecimento', 'Ex.: Padaria do Seu Paulo'],
  ong: ['Nome da ONG', 'Ex.: Banco de Alimentos']
};

let usuarioAtual;
let localidadesDaRede = [];

function mostrarTela(id) {
  for (const tela of TELAS) $(tela).hidden = tela !== id;
}

async function chamarApi(caminho, { metodo = 'GET', corpo } = {}) {
  try {
    const resposta = await fetch(caminho, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    const dados = await resposta.json().catch(() => ({}));
    return { ok: resposta.ok, status: resposta.status, dados };
  } catch {
    return { ok: false, status: 0, dados: { erro: 'sem conexão com o servidor. Confira a internet e tente de novo' } };
  }
}

function comoFrase(texto) {
  if (!texto) return '';
  const frase = texto.charAt(0).toUpperCase() + texto.slice(1);
  return /[.!?]$/.test(frase) ? frase : `${frase}.`;
}

function mostrarErro(formulario, texto) {
  const caixa = formulario.querySelector('.erro');
  caixa.textContent = comoFrase(texto);
  caixa.hidden = !texto;
}

function focarPrimeiroVazio(formulario) {
  // Fora os botões de escolha e os campos escondidos, como a cidade no cadastro
  // de doador: focar um campo invisível deixaria o teclado sem destino.
  const campos = [...formulario.querySelectorAll('input')]
    .filter((campo) => campo.type !== 'radio' && campo.offsetParent !== null);
  (campos.find((campo) => !campo.value.trim()) ?? campos[0]).focus();
}

let temporizadorDoAviso;

function avisar(texto, tipo = 'ok') {
  const aviso = $('aviso');
  aviso.textContent = comoFrase(texto);
  aviso.className = `aviso aviso-${tipo}`;
  aviso.hidden = false;
  clearTimeout(temporizadorDoAviso);
  temporizadorDoAviso = setTimeout(() => { aviso.hidden = true; }, 5000);
}

async function enviar(formulario, rotuloEnquantoEnvia, acao) {
  const botao = formulario.querySelector('button[type="submit"]');
  const rotulo = botao.textContent;
  mostrarErro(formulario, '');
  botao.disabled = true;
  botao.textContent = rotuloEnquantoEnvia;
  try {
    const erro = await acao();
    if (erro) {
      mostrarErro(formulario, erro);
      focarPrimeiroVazio(formulario);
    }
  } finally {
    botao.disabled = false;
    botao.textContent = rotulo;
  }
}

function dataLocal(diasAPartirDeHoje = 0) {
  const data = new Date();
  data.setDate(data.getDate() + diasAPartirDeHoje);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function prazoLegivel(validade) {
  if (validade === dataLocal(0)) return 'hoje';
  if (validade === dataLocal(1)) return 'amanhã';
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(validade);
  return partes ? `${partes[3]}/${partes[2]}` : validade;
}

function diaLegivel(momento) {
  const data = new Date(momento);
  return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function elemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function alternarCadastro(criandoConta) {
  $('form-entrar').hidden = criandoConta;
  $('form-criar').hidden = !criandoConta;
}

function papelEscolhido() {
  return document.querySelector('input[name="papel"]:checked').value;
}

function ajustarCadastro() {
  const ehOng = papelEscolhido() === 'ong';
  const [rotulo, exemplo] = NOME_NO_CADASTRO[ehOng ? 'ong' : 'doador'];
  $('rotulo-nome').textContent = rotulo;
  $('criar-nome').placeholder = exemplo;
  $('dica-ong').hidden = !ehOng;
}

function opcao(valor, texto) {
  const item = document.createElement('option');
  item.value = valor;
  item.textContent = texto;
  return item;
}

// Estado e cidade são escolhidos numa lista, e não digitados: quando era texto
// livre, "Joinville" e "Joinvile" eram cidades diferentes para o sistema, e a
// ONG com um deslize de digitação não via doação nenhuma (ADR 0009).
function mostrarCidadesDoEstado() {
  const estado = localidadesDaRede.find((uf) => uf.sigla === $('criar-estado').value);
  $('criar-cidade').replaceChildren(...(estado ? estado.cidades.map((c) => opcao(c, c)) : []));
}

async function carregarLocalidades() {
  const { ok, dados } = await chamarApi('/api/localidades');
  if (!ok || !Array.isArray(dados)) return;
  localidadesDaRede = dados;
  $('criar-estado').replaceChildren(...dados.map((uf) => opcao(uf.sigla, `${uf.sigla} — ${uf.nome}`)));
  mostrarCidadesDoEstado();
}

function mostrarEntrada(mensagem = '') {
  usuarioAtual = undefined;
  $('conta').hidden = true;
  $('form-criar').reset();
  ajustarCadastro();
  alternarCadastro(false);
  mostrarTela('tela-entrar');
  mostrarErro($('form-entrar'), mensagem);
}

function sessaoEncerrada() {
  mostrarEntrada('sua sessão terminou. Entre de novo');
}

function avisoDaConta({ situacao, cidade }) {
  if (situacao === 'pendente') {
    return `Sua conta aguarda a aprovação da coordenação. Você já vê as doações de ${cidade}; o aceite libera depois da aprovação.`;
  }
  if (situacao === 'recusada') {
    return 'A coordenação não aprovou esta conta. Fale com ela para entender o motivo.';
  }
  return '';
}

function entrouComo(usuario) {
  usuarioAtual = usuario;
  $('conta-nome').textContent = usuario.nome;
  $('conta-papel').textContent = PAPEL_NA_TELA[usuario.papel];
  $('conta').hidden = false;

  if (usuario.papel === 'coordenacao') {
    mostrarTela('tela-coordenacao');
    carregarPedidos();
  } else if (usuario.papel === 'ong') {
    const aviso = avisoDaConta(usuario);
    $('situacao-da-conta').textContent = aviso;
    $('situacao-da-conta').hidden = !aviso;
    mostrarTela('tela-ong');
    carregarDoacoes();
    carregarRecentes();
  } else {
    mostrarTela('tela-doador');
    prepararNovaDoacao();
    carregarRecentes();
  }
}

$('form-entrar').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  enviar(formulario, 'Entrando…', async () => {
    const { ok, dados } = await chamarApi('/api/login', {
      metodo: 'POST',
      corpo: { email: $('entrar-email').value, senha: $('entrar-senha').value }
    });
    if (!ok) return dados.erro;
    formulario.reset();
    entrouComo(dados);
  });
});

$('form-criar').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  enviar(formulario, 'Criando conta…', async () => {
    const { ok, dados } = await chamarApi('/api/cadastro', {
      metodo: 'POST',
      corpo: {
        nome: $('criar-nome').value,
        email: $('criar-email').value,
        senha: $('criar-senha').value,
        papel: papelEscolhido(),
        estado: $('criar-estado').value,
        cidade: $('criar-cidade').value
      }
    });
    if (!ok) return dados.erro;
    formulario.reset();
    ajustarCadastro();
    entrouComo(dados);
  });
});

for (const escolha of document.querySelectorAll('input[name="papel"]')) {
  escolha.addEventListener('change', ajustarCadastro);
}

$('criar-estado').addEventListener('change', mostrarCidadesDoEstado);

$('ir-para-cadastro').addEventListener('click', () => {
  alternarCadastro(true);
  $('criar-nome').focus();
});

$('ir-para-entrada').addEventListener('click', () => {
  alternarCadastro(false);
  $('entrar-email').focus();
});

$('sair').addEventListener('click', async () => {
  await chamarApi('/api/logout', { metodo: 'POST' });
  mostrarEntrada();
});

for (const alternador of document.querySelectorAll('[data-mostrar-senha]')) {
  alternador.addEventListener('click', () => {
    const campo = $(alternador.dataset.mostrarSenha);
    const vaiMostrar = campo.type === 'password';
    campo.type = vaiMostrar ? 'text' : 'password';
    alternador.textContent = vaiMostrar ? 'Ocultar' : 'Mostrar';
    alternador.setAttribute('aria-pressed', String(vaiMostrar));
  });
}

function prepararNovaDoacao() {
  const formulario = $('form-doacao');
  formulario.reset();
  mostrarErro(formulario, '');
  // Doação com prazo no passado é recusada pelo servidor (RN-03). O min deixa o
  // calendário do celular recusar antes, sem gastar uma viagem de ida e volta.
  $('validade').min = dataLocal(0);
  formulario.hidden = false;
  $('confirmacao').hidden = true;
  $('tipo').focus();
}

function mostrarConfirmacao(doacao) {
  $('confirmacao-resumo').textContent = `${doacao.tipo} · ${doacao.quantidade} · retirar até ${prazoLegivel(doacao.validade)}`;
  $('form-doacao').hidden = true;
  $('confirmacao').hidden = false;
  $('confirmacao-titulo').focus();
}

$('form-doacao').addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviar(evento.currentTarget, 'Publicando…', async () => {
    const { ok, status, dados } = await chamarApi('/api/doacoes', {
      metodo: 'POST',
      corpo: { tipo: $('tipo').value, quantidade: $('quantidade').value, validade: $('validade').value }
    });
    if (status === 401) return sessaoEncerrada();
    if (!ok) return dados.erro;
    mostrarConfirmacao(dados);
    carregarRecentes();
  });
});

for (const atalho of document.querySelectorAll('[data-dias]')) {
  atalho.addEventListener('click', () => {
    $('validade').value = dataLocal(Number(atalho.dataset.dias));
  });
}

$('publicar-outra').addEventListener('click', prepararNovaDoacao);

function atualizarContagem() {
  const total = $('lista').querySelectorAll('.comanda:not(.aceita)').length;
  $('contagem').textContent = total === 0 ? '' : `${total} ${total === 1 ? 'doação esperando' : 'doações esperando'} uma ONG.`;
}

function cartaoVazio(titulo, explicacao) {
  const item = elemento('li', 'vazio');
  item.append(elemento('p', 'vazio-titulo', titulo), elemento('p', null, explicacao));
  return item;
}

function listaVazia() {
  // A cidade aparece na mensagem de propósito: a lista mostra só as doações da
  // cidade da conta (RN-06), e lista vazia sem essa explicação parece defeito.
  return cartaoVazio(
    `Nenhuma doação esperando em ${usuarioAtual?.cidade ?? 'sua cidade'} agora.`,
    'Quando um doador da sua cidade publicar, ela aparece aqui. Toque em Atualizar para conferir.'
  );
}

function comandaDaDoacao(doacao, ordem) {
  const comanda = elemento('li', 'comanda');
  comanda.style.setProperty('--ordem', ordem);

  const prazo = elemento('p', 'comanda-prazo', `Retirar até ${prazoLegivel(doacao.validade)}`);
  prazo.append(elemento('span', 'comanda-numero', `nº ${doacao.id}`));

  const carimbo = elemento('span', 'carimbo', 'Aceita');
  carimbo.setAttribute('aria-hidden', 'true');

  comanda.append(
    prazo,
    elemento('h2', 'comanda-tipo', doacao.tipo),
    elemento('p', 'comanda-quantidade', doacao.quantidade),
    elemento('p', 'comanda-origem', doacao.doador ?? 'Doador sem cadastro')
  );

  // Conta de ONG ainda não aprovada vê a doação, mas não ganha o botão: a tela
  // não oferece o que a regra recusa (RN-04, ADR 0006).
  if (usuarioAtual?.situacao === 'aprovada') {
    const botao = elemento('button', 'botao botao-cheio', 'Aceitar doação');
    botao.type = 'button';
    botao.addEventListener('click', () => aceitarDoacao(doacao, comanda, botao));

    const rodape = elemento('div', 'comanda-rodape');
    rodape.append(botao);
    comanda.append(rodape);
  }

  comanda.append(carimbo);
  return comanda;
}

async function carregarDoacoes() {
  const { ok, status, dados } = await chamarApi('/api/doacoes');
  if (status === 401) return sessaoEncerrada();
  if (!ok) return avisar(dados.erro, 'erro');
  $('lista').replaceChildren(...(dados.length ? dados.map(comandaDaDoacao) : [listaVazia()]));
  atualizarContagem();
}

async function aceitarDoacao(doacao, comanda, botao) {
  botao.disabled = true;
  botao.textContent = 'Aceitando…';
  const { ok, status, dados } = await chamarApi(`/api/doacoes/${doacao.id}/aceitar`, { metodo: 'POST' });
  if (status === 401) return sessaoEncerrada();
  if (!ok) {
    avisar(dados.erro, 'erro');
    return carregarDoacoes();
  }
  botao.textContent = 'Aceita por você';
  comanda.classList.add('aceita');
  atualizarContagem();
  avisar(`você aceitou ${doacao.tipo} (${doacao.quantidade}). Ela saiu da lista das outras ONGs`);
  setTimeout(() => {
    comanda.remove();
    if (!$('lista').querySelector('.comanda')) $('lista').replaceChildren(listaVazia());
  }, reduzirAnimacoes.matches ? 0 : 900);
}

$('atualizar').addEventListener('click', carregarDoacoes);

function atualizarContagemDePedidos() {
  const total = $('pedidos').querySelectorAll('.comanda:not(.avaliada)').length;
  $('contagem-pedidos').textContent = total === 0
    ? ''
    : `${total} ${total === 1 ? 'ONG esperando' : 'ONGs esperando'} sua aprovação.`;
}

function semPedidos() {
  return cartaoVazio(
    'Nenhum pedido esperando.',
    'Quando uma ONG da sua cidade criar conta, o pedido aparece aqui.'
  );
}

function cartaoDoPedido(pedido, ordem) {
  const cartao = elemento('li', 'comanda');
  cartao.style.setProperty('--ordem', ordem);

  const quando = elemento('p', 'comanda-prazo', `Pedido de ${diaLegivel(pedido.criado_em)}`);
  quando.append(elemento('span', 'comanda-numero', `nº ${pedido.id}`));

  const aprovar = elemento('button', 'botao botao-cheio', 'Aprovar');
  aprovar.type = 'button';
  const recusar = elemento('button', 'botao botao-contorno', 'Recusar');
  recusar.type = 'button';

  const rodape = elemento('div', 'comanda-rodape duas-acoes');
  rodape.append(aprovar, recusar);
  for (const [acao, botao] of [['aprovar', aprovar], ['recusar', recusar]]) {
    botao.addEventListener('click', () => avaliarPedido(pedido, acao, cartao, [aprovar, recusar]));
  }

  cartao.append(
    quando,
    elemento('h2', 'comanda-tipo', pedido.nome),
    elemento('p', 'comanda-quantidade', pedido.email),
    elemento('p', 'comanda-origem', `${pedido.cidade}/${pedido.estado}`),
    rodape
  );
  return cartao;
}

async function carregarPedidos() {
  const { ok, status, dados } = await chamarApi('/api/ongs/pendentes');
  if (status === 401) return sessaoEncerrada();
  if (!ok) return avisar(dados.erro, 'erro');
  $('pedidos').replaceChildren(...(dados.length ? dados.map(cartaoDoPedido) : [semPedidos()]));
  atualizarContagemDePedidos();
}

async function avaliarPedido(pedido, acao, cartao, botoes) {
  for (const botao of botoes) botao.disabled = true;
  const { ok, status, dados } = await chamarApi(`/api/ongs/${pedido.id}/${acao}`, { metodo: 'POST' });
  if (status === 401) return sessaoEncerrada();
  if (!ok) {
    avisar(dados.erro, 'erro');
    return carregarPedidos();
  }
  cartao.classList.add('avaliada');
  atualizarContagemDePedidos();
  avisar(acao === 'aprovar'
    ? `${pedido.nome} já pode aceitar doações`
    : `${pedido.nome} continua sem poder aceitar doações`);
  setTimeout(() => {
    cartao.remove();
    if (!$('pedidos').querySelector('.comanda')) $('pedidos').replaceChildren(semPedidos());
  }, reduzirAnimacoes.matches ? 0 : 900);
}

$('atualizar-pedidos').addEventListener('click', carregarPedidos);

const HISTORICO = {
  doador: {
    lista: 'lista-minhas',
    vazio: ['Você ainda não publicou nada.', 'O que você publicar aparece aqui, com o que aconteceu com cada doação.']
  },
  ong: {
    lista: 'lista-aceitas',
    vazio: ['Você ainda não aceitou nenhuma doação.', 'O que você aceitar aparece aqui, para confirmar a retirada depois.']
  }
};

function estadoDaDoacao(doacao) {
  if (doacao.status === 'disponivel') return 'Esperando uma ONG';
  const quem = usuarioAtual.papel === 'doador' ? doacao.ong : 'você';
  return doacao.status === 'retirada' ? `Retirada por ${quem}` : `Aceita por ${quem}`;
}

function cartaoDoHistorico(doacao, ordem) {
  // Sem a classe "aceita": ela é a animação de sair da lista, e aqui o cartão
  // de uma doação aceita precisa ficar na tela.
  const cartao = elemento('li', 'comanda comanda-historico');
  cartao.style.setProperty('--ordem', ordem);
  cartao.dataset.estado = doacao.status;

  const prazo = elemento('p', 'comanda-prazo', `Retirar até ${prazoLegivel(doacao.validade)}`);
  prazo.append(elemento('span', 'comanda-numero', `nº ${doacao.id}`));

  cartao.append(
    prazo,
    elemento('h2', 'comanda-tipo', doacao.tipo),
    elemento('p', 'comanda-quantidade', doacao.quantidade),
    elemento('p', 'comanda-estado', estadoDaDoacao(doacao))
  );

  if (usuarioAtual.papel === 'ong' && doacao.status === 'aceita') {
    const retirar = elemento('button', 'botao botao-cheio', 'Confirmar retirada');
    retirar.type = 'button';
    const cancelar = elemento('button', 'botao botao-contorno', 'Cancelar aceite');
    cancelar.type = 'button';

    const rodape = elemento('div', 'comanda-rodape duas-acoes');
    rodape.append(retirar, cancelar);
    for (const [acao, botao] of [['retirar', retirar], ['cancelar', cancelar]]) {
      botao.addEventListener('click', () => mudarAceite(doacao, acao, [retirar, cancelar]));
    }
    cartao.append(rodape);
  }

  return cartao;
}

async function carregarRecentes() {
  const historico = HISTORICO[usuarioAtual?.papel];
  if (!historico) return;

  const { ok, status, dados } = await chamarApi('/api/doacoes/recentes');
  if (status === 401) return sessaoEncerrada();
  if (!ok) return avisar(dados.erro, 'erro');
  $(historico.lista).replaceChildren(
    ...(dados.length ? dados.map(cartaoDoHistorico) : [cartaoVazio(...historico.vazio)])
  );
}

async function mudarAceite(doacao, acao, botoes) {
  for (const botao of botoes) botao.disabled = true;
  const { ok, status, dados } = await chamarApi(`/api/doacoes/${doacao.id}/${acao}`, { metodo: 'POST' });
  if (status === 401) return sessaoEncerrada();

  if (!ok) avisar(dados.erro, 'erro');
  else if (acao === 'retirar') avisar(`retirada de ${doacao.tipo} confirmada`);
  else avisar(`${doacao.tipo} voltou para a lista das ONGs da rede`);

  // O cancelamento devolve a doação para a lista de disponíveis, então as duas
  // listas da tela mudam juntas.
  await carregarDoacoes();
  await carregarRecentes();
}

$('atualizar-minhas').addEventListener('click', carregarRecentes);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (!$('tela-ong').hidden) {
    carregarDoacoes();
    carregarRecentes();
  }
  if (!$('tela-coordenacao').hidden) carregarPedidos();
});

async function iniciar() {
  // A lista de localidades vem antes de qualquer tela: ela monta os dois boxes
  // do cadastro, e o cadastro acontece sem login.
  await carregarLocalidades();
  const { ok, dados } = await chamarApi('/api/eu');
  if (ok) entrouComo(dados);
  else mostrarEntrada();
}

iniciar();
