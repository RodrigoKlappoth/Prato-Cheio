import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { SOPA, entrarComoDoador, entrarComoOng, entrarComoCoordenacao } from './apoio.js';

const app = criarApp();

const CASA_DE_APOIO = { nome: 'Casa de Apoio', email: 'contato@casadeapoio.org' };

let doador;
let ong;

beforeAll(criarBancoEmMemoria);

beforeEach(async () => {
  await limparBanco();
  doador = await entrarComoDoador(app);
  ong = await entrarComoOng(app);
});

afterAll(fecharBancoEmMemoria);

async function publicar(doacao = SOPA) {
  const res = await doador.post('/api/doacoes').send(doacao);
  expect(res.status).toBe(201);
  return res.body;
}

async function publicarEAceitar(quem = ong) {
  const doacao = await publicar();
  const res = await quem.post(`/api/doacoes/${doacao.id}/aceitar`).send();
  expect(res.status).toBe(200);
  return res.body;
}

function doacaoNoBanco(id) {
  return banco().doacao.findUnique({ where: { id } });
}

describe('H-07 — cada um vê as suas doações recentes', () => {
  it('o doador vê o que publicou, com o estado e quem levou', async () => {
    const aceita = await publicarEAceitar();
    const esperando = await publicar({ ...SOPA, tipo: 'Frutas' });

    const res = await doador.get('/api/doacoes/recentes');

    expect(res.status).toBe(200);
    // A mais recente primeiro: quem publica no fim do expediente quer ver o que acabou de mandar.
    expect(res.body.map((doacao) => doacao.id)).toEqual([esperando.id, aceita.id]);
    expect(res.body[1]).toMatchObject({ status: 'aceita', ong: 'Banco de Alimentos' });
    expect(res.body[0]).toMatchObject({ status: 'disponivel', ong: null });
  });

  it('a ONG vê só o que ela mesma aceitou', async () => {
    const minha = await publicarEAceitar();
    const casaDeApoio = await entrarComoOng(app, CASA_DE_APOIO);
    const daOutra = await publicarEAceitar(casaDeApoio);

    expect((await ong.get('/api/doacoes/recentes')).body.map((d) => d.id)).toEqual([minha.id]);
    expect((await casaDeApoio.get('/api/doacoes/recentes')).body.map((d) => d.id)).toEqual([daOutra.id]);
  });

  it('a coordenação não tem histórico de doações, porque a doação não tem cidade', async () => {
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await coordenacao.get('/api/doacoes/recentes');

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/histórico/);
  });

  it('recusa o histórico de quem não entrou', async () => {
    expect((await request(app).get('/api/doacoes/recentes')).status).toBe(401);
  });
});

describe('H-07 — a ONG confirma a retirada', () => {
  it('registra a retirada com a hora, que é o que o OBJ-01 mede', async () => {
    const aceita = await publicarEAceitar();

    const res = await ong.post(`/api/doacoes/${aceita.id}/retirar`).send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('retirada');

    const guardada = await doacaoNoBanco(aceita.id);
    expect(guardada.aceita_em).toBeInstanceOf(Date);
    expect(guardada.retirada_em).toBeInstanceOf(Date);
    expect(guardada.retirada_em.getTime()).toBeGreaterThanOrEqual(guardada.criada_em.getTime());
  });

  it('a doação retirada não volta para a lista nem pode ser aceita por outra ONG', async () => {
    const aceita = await publicarEAceitar();
    await ong.post(`/api/doacoes/${aceita.id}/retirar`).send();
    const casaDeApoio = await entrarComoOng(app, CASA_DE_APOIO);

    const lista = await casaDeApoio.get('/api/doacoes');
    const aceite = await casaDeApoio.post(`/api/doacoes/${aceita.id}/aceitar`).send();

    expect(lista.body).toHaveLength(0);
    expect(aceite.status).toBe(400);
    expect(aceite.body.erro).toMatch(/já foi retirada por Banco de Alimentos/);
  });

  it('recusa confirmar a retirada de uma doação que não é sua', async () => {
    const aceita = await publicarEAceitar();
    const casaDeApoio = await entrarComoOng(app, CASA_DE_APOIO);

    const res = await casaDeApoio.post(`/api/doacoes/${aceita.id}/retirar`).send();

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/não foi aceita por você/);
    expect((await doacaoNoBanco(aceita.id)).status).toBe('aceita');
  });

  it('recusa confirmar a retirada de uma doação que ninguém aceitou', async () => {
    const disponivel = await publicar();

    const res = await ong.post(`/api/doacoes/${disponivel.id}/retirar`).send();

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não está aceita por ninguém/);
    expect((await doacaoNoBanco(disponivel.id)).status).toBe('disponivel');
  });

  it('recusa confirmar a mesma retirada duas vezes', async () => {
    const aceita = await publicarEAceitar();
    await ong.post(`/api/doacoes/${aceita.id}/retirar`).send();

    const res = await ong.post(`/api/doacoes/${aceita.id}/retirar`).send();

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/já foi confirmada/);
  });

  it('recusa o doador confirmar a retirada da própria doação', async () => {
    const aceita = await publicarEAceitar();

    const res = await doador.post(`/api/doacoes/${aceita.id}/retirar`).send();

    expect(res.status).toBe(403);
    expect((await doacaoNoBanco(aceita.id)).status).toBe('aceita');
  });
});

describe('H-07 — a ONG cancela o aceite', () => {
  it('devolve a doação para a lista das outras ONGs, sem rastro do aceite', async () => {
    const aceita = await publicarEAceitar();
    const casaDeApoio = await entrarComoOng(app, CASA_DE_APOIO);
    expect((await casaDeApoio.get('/api/doacoes')).body).toHaveLength(0);

    const cancelamento = await ong.post(`/api/doacoes/${aceita.id}/cancelar`).send();

    expect(cancelamento.status).toBe(200);
    expect(cancelamento.body).toMatchObject({ status: 'disponivel', ong: null, ong_id: null, aceita_em: null });
    expect((await casaDeApoio.get('/api/doacoes')).body.map((d) => d.id)).toEqual([aceita.id]);
    expect((await casaDeApoio.post(`/api/doacoes/${aceita.id}/aceitar`).send()).status).toBe(200);
  });

  it('recusa cancelar o aceite de outra ONG', async () => {
    const aceita = await publicarEAceitar();
    const casaDeApoio = await entrarComoOng(app, CASA_DE_APOIO);

    const res = await casaDeApoio.post(`/api/doacoes/${aceita.id}/cancelar`).send();

    expect(res.status).toBe(403);
    expect((await doacaoNoBanco(aceita.id)).ong).toBe('Banco de Alimentos');
  });

  it('recusa cancelar depois de a retirada estar confirmada', async () => {
    const aceita = await publicarEAceitar();
    await ong.post(`/api/doacoes/${aceita.id}/retirar`).send();

    const res = await ong.post(`/api/doacoes/${aceita.id}/cancelar`).send();

    expect(res.status).toBe(400);
    expect((await doacaoNoBanco(aceita.id)).status).toBe('retirada');
  });

  it('recusa cancelar e confirmar uma doação que não existe, e com id que não é número', async () => {
    expect((await ong.post('/api/doacoes/999/cancelar').send()).body.erro).toMatch(/não encontrada/);
    expect((await ong.post('/api/doacoes/abc/retirar').send()).body.erro).toMatch(/id de doação inválido/);
    expect((await request(app).post('/api/doacoes/1/cancelar').send()).status).toBe(401);
  });
});
