import request from 'supertest';
import { expect } from 'vitest';
import { cadastrarOng, cadastrarCoordenacao } from '../src/usuarios.js';
import { hojeNaRede } from '../src/regras.js';

export const SENHA = 'senha-segura';
// A rede atende Santa Catarina (ADR 0009), e estas duas cidades estão na lista
// de src/localidades.js. OUTRA_CIDADE serve aos testes da RN-06.
export const ESTADO = 'SC';
export const CIDADE = 'Joinville';
export const OUTRA_CIDADE = 'Blumenau';

// Prazo de retirada contado a partir do dia de hoje em São Paulo, para o teste
// não depender do dia em que roda (decisão D1, ADR 0007). Era a dívida que a
// análise registrou na nota de implementação da H-03: o fixture usava uma data
// fixa que, com a RN-03 implementada, nasceria vencida.
export function diaNaRede(deslocamentoEmDias = 0) {
  const meioDia = new Date(`${hojeNaRede()}T12:00:00Z`);
  meioDia.setUTCDate(meioDia.getUTCDate() + deslocamentoEmDias);
  return meioDia.toISOString().slice(0, 10);
}

export const SOPA = { tipo: 'Sopa', quantidade: '10 porções', validade: diaNaRede(1) };

async function entrar(app, email) {
  const agente = request.agent(app);
  const res = await agente.post('/api/login').send({ email, senha: SENHA });
  expect(res.status).toBe(200);
  return agente;
}

export async function entrarComoDoador(
  app,
  { nome = 'Padaria do Seu Paulo', email = 'paulo@padaria.com', estado = ESTADO, cidade = CIDADE } = {}
) {
  const doador = request.agent(app);
  const res = await doador.post('/api/cadastro').send({ nome, email, senha: SENHA, estado, cidade });
  expect(res.status).toBe(201);
  return doador;
}

// ONG criada pela coordenação, com npm run ong:criar: nasce aprovada (ADR 0003).
export async function entrarComoOng(
  app,
  { nome = 'Banco de Alimentos', email = 'contato@bancodealimentos.org', estado = ESTADO, cidade = CIDADE } = {}
) {
  await cadastrarOng({ nome, email, senha: SENHA, estado, cidade });
  return entrar(app, email);
}

// ONG que se cadastrou na tela: nasce pendente e só aceita depois da aprovação (ADR 0006).
export async function cadastrarOngPelaTela(
  app,
  { nome = 'Cozinha da Vila', email = 'contato@cozinhadavila.org', estado = ESTADO, cidade = CIDADE } = {}
) {
  const ong = request.agent(app);
  const res = await ong.post('/api/cadastro').send({ nome, email, senha: SENHA, estado, cidade, papel: 'ong' });
  expect(res.status).toBe(201);
  return { ong, conta: res.body };
}

export async function entrarComoCoordenacao(
  app,
  { nome = 'Marta', email = 'marta@pratocheio.org', estado = ESTADO, cidade = CIDADE } = {}
) {
  await cadastrarCoordenacao({ nome, email, senha: SENHA, estado, cidade });
  return entrar(app, email);
}
