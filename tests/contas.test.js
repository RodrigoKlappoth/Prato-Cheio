import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { cadastrarDoador, pelaSessao } from '../src/usuarios.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { entrarComoDoador, entrarComoOng } from './apoio.js';

const app = criarApp();

const SOPA = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' };
const PAULO = { nome: 'Padaria do Seu Paulo', email: 'paulo@padaria.com', senha: 'senha-segura' };
const TRINTA_E_UM_DIAS = 31 * 24 * 60 * 60 * 1000;

beforeAll(criarBancoEmMemoria);

beforeEach(limparBanco);

afterAll(fecharBancoEmMemoria);

describe('criar conta de doador', () => {
  it('cria a conta e já deixa o doador conectado', async () => {
    const doador = request.agent(app);

    const res = await doador.post('/api/cadastro').send(PAULO);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), nome: PAULO.nome, email: PAULO.email, papel: 'doador' });
    expect((await doador.get('/api/eu')).body).toMatchObject({ email: PAULO.email, papel: 'doador' });
  });

  it('cria sempre conta de doador, mesmo que o pedido diga ONG', async () => {
    const res = await request(app).post('/api/cadastro').send({ ...PAULO, papel: 'ong' });

    expect(res.status).toBe(201);
    expect(res.body.papel).toBe('doador');
  });

  it('recusa e-mail que já tem cadastro', async () => {
    await request(app).post('/api/cadastro').send(PAULO);

    const res = await request(app).post('/api/cadastro').send({ ...PAULO, nome: 'Outra Padaria' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/já tem cadastro/);
  });

  it('recusa senha com menos de 8 caracteres', async () => {
    const res = await request(app).post('/api/cadastro').send({ ...PAULO, senha: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/8 caracteres/);
  });

  it('guarda só o hash da senha, nunca a senha', async () => {
    await request(app).post('/api/cadastro').send(PAULO);

    const conta = await banco().usuario.findUnique({ where: { email: PAULO.email } });

    expect(conta.senha_hash).toBeTruthy();
    expect(conta.senha_hash).not.toContain(PAULO.senha);
  });
});

describe('entrar e sair', () => {
  it('recusa entrar com a senha errada', async () => {
    await request(app).post('/api/cadastro').send(PAULO);
    const visitante = request.agent(app);

    const res = await visitante.post('/api/login').send({ email: PAULO.email, senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.erro).toMatch(/e-mail ou senha incorretos/);
    expect((await visitante.get('/api/eu')).status).toBe(401);
  });

  it('sair encerra a sessão', async () => {
    const doador = await entrarComoDoador(app);

    await doador.post('/api/logout');

    expect((await doador.post('/api/doacoes').send(SOPA)).status).toBe(401);
  });

  it('a sessão expira depois de 30 dias', async () => {
    const { token } = await cadastrarDoador(PAULO);
    const daquiA31Dias = new Date(Date.now() + TRINTA_E_UM_DIAS);

    expect(await pelaSessao(token)).toMatchObject({ email: PAULO.email });
    expect(await pelaSessao(token, daquiA31Dias)).toBeUndefined();
  });
});

describe('cada um só faz a sua parte', () => {
  it('recusa publicar sem entrar', async () => {
    const res = await request(app).post('/api/doacoes').send(SOPA);

    expect(res.status).toBe(401);
  });

  it('recusa publicação feita por ONG', async () => {
    const ong = await entrarComoOng(app);

    const res = await ong.post('/api/doacoes').send(SOPA);

    expect(res.status).toBe(403);
  });

  it('recusa aceite feito por doador', async () => {
    const doador = await entrarComoDoador(app);
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);

    const res = await doador.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(res.status).toBe(403);
    expect((await doador.get('/api/doacoes')).body).toMatchObject([{ id: doacao.id, status: 'disponivel' }]);
  });

  it('registra quem publicou e quem aceitou', async () => {
    const doador = await entrarComoDoador(app);
    const ong = await entrarComoOng(app);
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);

    const lista = await ong.get('/api/doacoes');
    const aceite = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong: 'Nome Inventado' });

    expect(lista.body[0].doador).toBe('Padaria do Seu Paulo');
    expect(aceite.body.ong).toBe('Banco de Alimentos');
  });
});
