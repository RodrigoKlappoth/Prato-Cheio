import request from 'supertest';
import { expect } from 'vitest';
import { cadastrarOng, cadastrarCoordenacao } from '../src/usuarios.js';

export const SENHA = 'senha-segura';
export const CIDADE = 'Santo André';

async function entrar(app, email) {
  const agente = request.agent(app);
  const res = await agente.post('/api/login').send({ email, senha: SENHA });
  expect(res.status).toBe(200);
  return agente;
}

export async function entrarComoDoador(app, { nome = 'Padaria do Seu Paulo', email = 'paulo@padaria.com' } = {}) {
  const doador = request.agent(app);
  const res = await doador.post('/api/cadastro').send({ nome, email, senha: SENHA });
  expect(res.status).toBe(201);
  return doador;
}

// ONG criada pela coordenação, com npm run ong:criar: nasce aprovada (ADR 0003).
export async function entrarComoOng(app, { nome = 'Banco de Alimentos', email = 'contato@bancodealimentos.org', cidade = CIDADE } = {}) {
  await cadastrarOng({ nome, email, senha: SENHA, cidade });
  return entrar(app, email);
}

// ONG que se cadastrou na tela: nasce pendente e só aceita depois da aprovação (ADR 0006).
export async function cadastrarOngPelaTela(app, { nome = 'Cozinha da Vila', email = 'contato@cozinhadavila.org', cidade = CIDADE } = {}) {
  const ong = request.agent(app);
  const res = await ong.post('/api/cadastro').send({ nome, email, senha: SENHA, cidade, papel: 'ong' });
  expect(res.status).toBe(201);
  return { ong, conta: res.body };
}

export async function entrarComoCoordenacao(app, { nome = 'Marta', email = 'marta@pratocheio.org', cidade = CIDADE } = {}) {
  await cadastrarCoordenacao({ nome, email, senha: SENHA, cidade });
  return entrar(app, email);
}
