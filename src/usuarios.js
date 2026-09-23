import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import * as repo from './repositorio.js';
import { falha, texto, exigirCampos } from './regras.js';

const derivarChave = promisify(scrypt);

export const DURACAO_DA_SESSAO = 30 * 24 * 60 * 60 * 1000;
const TAMANHO_MINIMO_DA_SENHA = 8;

function semSenha({ id, nome, email, papel }) {
  return { id, nome, email, papel };
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

async function cadastrar(dados, papel) {
  const conta = {
    nome: texto(dados.nome),
    email: texto(dados.email).toLowerCase(),
    senha: senhaDigitada(dados.senha)
  };
  exigirCampos(conta, ['nome', 'email', 'senha']);

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
    papel
  });
  return semSenha(usuario);
}

export async function cadastrarDoador(dados = {}) {
  const usuario = await cadastrar(dados, 'doador');
  return { usuario, token: await abrirSessao(usuario) };
}

export async function cadastrarOng(dados = {}) {
  return cadastrar(dados, 'ong');
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
