import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import * as repo from './repositorio.js';
import { falha, texto, identificador, exigirCampos } from './regras.js';

const derivarChave = promisify(scrypt);

export const DURACAO_DA_SESSAO = 30 * 24 * 60 * 60 * 1000;
const TAMANHO_MINIMO_DA_SENHA = 8;

// Quem atua numa cidade precisa dizer qual é: a coordenação só decide sobre as
// ONGs da sua cidade (ADR 0006). O doador continua sem esse campo, porque cada
// campo a mais no cadastro dele aumenta a chance de desistir (CONF-01).
const PAPEIS_COM_CIDADE = ['ong', 'coordenacao'];

const PORQUE_A_CONTA_NAO_ACEITA = {
  pendente: 'sua conta de ONG ainda aguarda a aprovação da coordenação da sua cidade',
  recusada: 'a coordenação da sua cidade não aprovou esta conta de ONG'
};

function semSenha({ id, nome, email, papel, cidade, situacao }) {
  return { id, nome, email, papel, cidade, situacao };
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

async function cadastrar(dados, papel, situacao = 'aprovada') {
  const conta = {
    nome: texto(dados.nome),
    email: texto(dados.email).toLowerCase(),
    senha: senhaDigitada(dados.senha)
  };
  exigirCampos(conta, ['nome', 'email', 'senha']);

  const comCidade = PAPEIS_COM_CIDADE.includes(papel);
  const cidade = texto(dados.cidade);
  if (comCidade) {
    exigirCampos({ cidade }, ['cidade']);
  }

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
    cidade: comCidade ? cidade : null,
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

export async function listarOngsPendentes(coordenador) {
  exigirPapel(coordenador, 'coordenacao', 'só a coordenação vê os pedidos de conta de ONG');
  return repo.listarOngsPorSituacao('pendente', coordenador.cidade);
}

export async function avaliarOng(coordenador, id, situacao, agora = new Date()) {
  exigirPapel(coordenador, 'coordenacao', 'só a coordenação aprova ou recusa contas de ONG');

  const conta = await repo.buscarUsuarioPorId(identificador(id, 'conta'));
  if (!conta || conta.papel !== 'ong') {
    throw falha('conta de ONG não encontrada');
  }
  if (conta.cidade !== coordenador.cidade) {
    // Contas de ONG criadas antes desta mudança não têm cidade registrada, e a
    // mensagem não pode mostrar um "null" para quem coordena.
    const cidadeDaConta = conta.cidade ?? 'uma cidade que não foi registrada';
    throw falha(`esta conta é de ${cidadeDaConta}, e você coordena ${coordenador.cidade}`, 403);
  }

  return semSenha(await repo.avaliarConta({
    id: conta.id,
    situacao,
    avaliadaEm: agora,
    avaliadaPorId: coordenador.id
  }));
}
