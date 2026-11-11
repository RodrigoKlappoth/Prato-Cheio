import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import * as repo from './repositorio.js';
import { falha, texto, identificador, exigirCampos, hojeNaRede } from './regras.js';
import { estadoAtendido, cidadeAtendida } from './localidades.js';

const derivarChave = promisify(scrypt);

export const DURACAO_DA_SESSAO = 30 * 24 * 60 * 60 * 1000;
const TAMANHO_MINIMO_DA_SENHA = 8;

const PORQUE_A_CONTA_NAO_ACEITA = {
  pendente: 'sua conta de ONG ainda aguarda a aprovação da coordenação',
  recusada: 'a coordenação não aprovou esta conta de ONG'
};

function semSenha({ id, nome, email, papel, estado, cidade, situacao }) {
  return { id, nome, email, papel, estado, cidade, situacao };
}

function senhaDigitada(valor) {
  return typeof valor === 'string' ? valor : '';
}

async function gerarHashDaSenha(senha) {
  const sal = randomBytes(16).toString('hex');
  const chave = await derivarChave(senha, sal, 64);
  return `${sal}:${chave.toString('hex')}`;
}

async function senhaConfere(senha, hashGuardado) {
  const [sal, chaveGuardada] = hashGuardado.split(':');
  const chave = await derivarChave(senha, sal, 64);
  return timingSafeEqual(chave, Buffer.from(chaveGuardada, 'hex'));
}

async function abrirSessao(usuario, agora = new Date()) {
  const token = randomBytes(32).toString('hex');
  const expiraEm = new Date(agora.getTime() + DURACAO_DA_SESSAO);
  await repo.inserirSessao({ token, usuarioId: usuario.id, expiraEm });
  return token;
}

// A localidade vem de uma lista curada, e o servidor confere contra ela: o box
// da tela evita o erro de digitação, mas a tela não é a única porta da API
// (RN-06, ADR 0009). Vale no cadastro e na correção da conta (RN-07).
function localidadeDaConta(dados) {
  const estado = texto(dados.estado).toUpperCase();
  const cidade = texto(dados.cidade);
  exigirCampos({ estado, cidade }, ['estado', 'cidade']);

  if (!estadoAtendido(estado)) {
    throw falha(`a rede ainda não atende o estado ${estado}`);
  }
  if (!cidadeAtendida(estado, cidade)) {
    throw falha(`a rede ainda não atende ${cidade} em ${estado}. Escolha uma cidade da lista`);
  }
  return { estado, cidade };
}

async function cadastrar(dados, papel, situacao = 'aprovada') {
  const conta = {
    nome: texto(dados.nome),
    email: texto(dados.email).toLowerCase(),
    senha: senhaDigitada(dados.senha)
  };
  exigirCampos(conta, ['nome', 'email', 'senha']);

  // Toda conta tem estado e cidade, inclusive a de doador: é a cidade do doador
  // que decide para quais ONGs a doação dele aparece (RN-06, ADR 0009).
  const { estado, cidade } = localidadeDaConta(dados);

  if (!conta.email.includes('@')) {
    throw falha('e-mail inválido');
  }
  if (conta.senha.length < TAMANHO_MINIMO_DA_SENHA) {
    throw falha(`a senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres`);
  }
  if (await repo.buscarUsuarioPorEmail(conta.email)) {
    throw falha('este e-mail já tem cadastro');
  }

  const usuario = await repo.inserirUsuario({
    nome: conta.nome,
    email: conta.email,
    senhaHash: await gerarHashDaSenha(conta.senha),
    papel,
    estado,
    cidade,
    situacao
  });
  return semSenha(usuario);
}

// Cadastro aberto na tela: o doador entra aprovado e a ONG entra pendente,
// esperando a coordenação da cidade dela (ADR 0006). Qualquer outro papel
// pedido no corpo da requisição vira doador.
export async function cadastrarPeloSite(dados = {}) {
  const usuario = texto(dados.papel) === 'ong'
    ? await cadastrar(dados, 'ong', 'pendente')
    : await cadastrar(dados, 'doador');
  return { usuario, token: await abrirSessao(usuario) };
}

// Usado pelo npm run ong:criar: a conta criada pela coordenação já nasce aprovada.
export async function cadastrarOng(dados = {}) {
  return cadastrar(dados, 'ong');
}

// Usado pelo npm run coordenacao:criar: é um comando por cidade, e não um por ONG.
export async function cadastrarCoordenacao(dados = {}) {
  return cadastrar(dados, 'coordenacao');
}

// Mudar de cidade com doação em circulação deixaria uma combinação pendente
// entre duas cidades: o doador esperando a ONG da cidade antiga, ou a ONG com
// uma comida aceita que está noutro lugar. A doação em circulação termina
// primeiro (RN-07, ADR 0011).
//
// "Em circulação" aqui é o mesmo que no resto do sistema: disponível e no prazo,
// ou aceita e não retirada. Doação com prazo vencido já saiu da lista (RN-03) e
// não prende ninguém.
async function exigirNadaEmCirculacao(usuario, agora) {
  if (usuario.papel === 'doador' && (await repo.contarEmCirculacaoDoDoador(usuario.id, hojeNaRede(agora))) > 0) {
    throw falha(
      `você tem doação em circulação em ${usuario.cidade}. Espere a ONG retirar, ou o prazo vencer, antes de mudar de cidade`
    );
  }
  if (usuario.papel === 'ong' && (await repo.contarAceitesEmAbertoDaOng(usuario.id)) > 0) {
    throw falha(
      `você tem doação aceita e não retirada em ${usuario.cidade}. Confirme a retirada ou cancele o aceite antes de mudar de cidade`
    );
  }
}

// A saída de quem escolheu a cidade errada no cadastro. Era a primeira dívida do
// [ADR 0009]: até aqui a conta não tinha como ser corrigida, e quem errava a
// cidade ficava preso — a saída era criar outra conta, ou alguém corrigir no
// banco (história H-09, RN-07, ADR 0011).
//
// Muda nome, estado e cidade, e nada mais: e-mail e senha são a identificação
// (ADR 0003), o papel define o que a conta pode fazer e a situação é decisão da
// coordenação (RN-04). Campo que não vem no pedido fica como está.
export async function editarConta(usuario, dados = {}, agora = new Date()) {
  exigirLogin(usuario);

  const nome = dados.nome === undefined ? usuario.nome : texto(dados.nome);
  exigirCampos({ nome }, ['nome']);

  const { estado, cidade } = localidadeDaConta({
    estado: dados.estado ?? usuario.estado,
    cidade: dados.cidade ?? usuario.cidade
  });

  if (estado !== usuario.estado || cidade !== usuario.cidade) {
    await exigirNadaEmCirculacao(usuario, agora);
  }

  return semSenha(await repo.atualizarConta({ id: usuario.id, nome, estado, cidade }));
}

export async function entrar(dados = {}) {
  const email = texto(dados.email).toLowerCase();
  const usuario = email ? await repo.buscarUsuarioPorEmail(email) : undefined;

  if (!usuario || !(await senhaConfere(senhaDigitada(dados.senha), usuario.senha_hash))) {
    throw falha('e-mail ou senha incorretos', 401);
  }

  return { usuario: semSenha(usuario), token: await abrirSessao(usuario) };
}

export async function sair(token) {
  if (token) await repo.apagarSessao(token);
}

export async function pelaSessao(token, agora = new Date()) {
  if (!token) return undefined;
  const usuario = await repo.buscarUsuarioPelaSessao(token, agora);
  return usuario ? semSenha(usuario) : undefined;
}

export function exigirLogin(usuario) {
  if (!usuario) {
    throw falha('entre com seu e-mail e senha para continuar', 401);
  }
  return usuario;
}

export function exigirPapel(usuario, papel, mensagem) {
  exigirLogin(usuario);
  if (usuario.papel !== papel) {
    throw falha(mensagem, 403);
  }
  return usuario;
}

// Aceitar é o ponto sensível: tira a doação da lista de todas as outras ONGs
// (RN-02). Por isso o aceite exige conta de ONG aprovada (RN-04, ADR 0006).
export function exigirOngAprovada(usuario) {
  exigirPapel(usuario, 'ong', 'só ONGs aceitam doações');
  if (usuario.situacao !== 'aprovada') {
    throw falha(PORQUE_A_CONTA_NAO_ACEITA[usuario.situacao], 403);
  }
  return usuario;
}

// A coordenação vê e decide os pedidos de qualquer cidade da rede, e não só os
// da cidade dela (ADR 0010, que substitui essa regra do ADR 0006). A cidade da
// conta de coordenação registra onde a pessoa está, e não o que ela pode.
export async function listarOngsPendentes(coordenador) {
  exigirPapel(coordenador, 'coordenacao', 'só a coordenação vê os pedidos de conta de ONG');
  return repo.listarOngsPorSituacao('pendente');
}

export async function avaliarOng(coordenador, id, situacao, agora = new Date()) {
  exigirPapel(coordenador, 'coordenacao', 'só a coordenação aprova ou recusa contas de ONG');

  const conta = await repo.buscarUsuarioPorId(identificador(id, 'conta'));
  if (!conta || conta.papel !== 'ong') {
    throw falha('conta de ONG não encontrada');
  }

  return semSenha(await repo.avaliarConta({
    id: conta.id,
    situacao,
    avaliadaEm: agora,
    avaliadaPorId: coordenador.id
  }));
}
