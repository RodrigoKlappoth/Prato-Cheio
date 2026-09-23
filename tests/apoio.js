import request from 'supertest';
import { expect } from 'vitest';
import { cadastrarOng } from '../src/usuarios.js';

export const SENHA = 'senha-segura';

export async function entrarComoDoador(app, { nome = 'Padaria do Seu Paulo', email = 'paulo@padaria.com' } = {}) {
  const doador = request.agent(app);
  const res = await doador.post('/api/cadastro').send({ nome, email, senha: SENHA });
  expect(res.status).toBe(201);
  return doador;
}

export async function entrarComoOng(app, { nome = 'Banco de Alimentos', email = 'contato@bancodealimentos.org' } = {}) {
  await cadastrarOng({ nome, email, senha: SENHA });
  const ong = request.agent(app);
  const res = await ong.post('/api/login').send({ email, senha: SENHA });
  expect(res.status).toBe(200);
  return ong;
}
