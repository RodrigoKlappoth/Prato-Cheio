const $ = (id) => document.getElementById(id);

const TELAS = ['tela-carregando', 'tela-entrar', 'tela-doador', 'tela-ong'];
const reduzirAnimacoes = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  const campos = [...formulario.querySelectorAll('input')];
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

function mostrarEntrada(mensagem = '') {
  $('conta').hidden = true;
  alternarCadastro(false);
  mostrarTela('tela-entrar');
  mostrarErro($('form-entrar'), mensagem);
}

function sessaoEncerrada() {
  mostrarEntrada('sua sessão terminou. Entre de novo');
}

function entrouComo(usuario) {
  $('conta-nome').textContent = usuario.nome;
  $('conta-papel').textContent = usuario.papel === 'ong' ? 'ONG' : 'Doador';
  $('conta').hidden = false;
  if (usuario.papel === 'ong') {
    mostrarTela('tela-ong');
    carregarDoacoes();
  } else {
    mostrarTela('tela-doador');
    prepararNovaDoacao();
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
      corpo: { nome: $('criar-nome').value, email: $('criar-email').value, senha: $('criar-senha').value }
    });
    if (!ok) return dados.erro;
    formulario.reset();
    entrouComo(dados);
  });
});

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

function listaVazia() {
  const item = elemento('li', 'vazio');
  item.append(
    elemento('p', 'vazio-titulo', 'Nenhuma doação esperando agora.'),
    elemento('p', null, 'Quando um doador publicar, ela aparece aqui. Toque em Atualizar para conferir.')
  );
  return item;
}

function comandaDaDoacao(doacao, ordem) {
  const comanda = elemento('li', 'comanda');
  comanda.style.setProperty('--ordem', ordem);

  const prazo = elemento('p', 'comanda-prazo', `Retirar até ${prazoLegivel(doacao.validade)}`);
  prazo.append(elemento('span', 'comanda-numero', `nº ${doacao.id}`));

  const botao = elemento('button', 'botao botao-cheio', 'Aceitar doação');
  botao.type = 'button';
  botao.addEventListener('click', () => aceitarDoacao(doacao, comanda, botao));

  const rodape = elemento('div', 'comanda-rodape');
  rodape.append(botao);

  const carimbo = elemento('span', 'carimbo', 'Aceita');
  carimbo.setAttribute('aria-hidden', 'true');

  comanda.append(
    prazo,
    elemento('h2', 'comanda-tipo', doacao.tipo),
    elemento('p', 'comanda-quantidade', doacao.quantidade),
    elemento('p', 'comanda-origem', doacao.doador ?? 'Doador sem cadastro'),
    rodape,
    carimbo
  );
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

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !$('tela-ong').hidden) carregarDoacoes();
});

async function iniciar() {
  const { ok, dados } = await chamarApi('/api/eu');
  if (ok) entrouComo(dados);
  else mostrarEntrada();
}

iniciar();
