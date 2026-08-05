import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

const SOPA = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' };

beforeEach(async () => {
  await migrar();
  await limparBanco();
});

afterAll(async () => {
  await encerrar();
});

async function publicar(doacao = SOPA) {
  const res = await request(app).post('/api/doacoes').send(doacao);
  expect(res.status).toBe(201);
  return res.body;
}

function aceitar(id, ong) {
  return request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong });
}

function listarDisponiveis() {
  return request(app).get('/api/doacoes');
}

describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await publicar();

    const res = await listarDisponiveis();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: '2026-08-01',
      status: 'disponivel'
    });
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app).post('/api/doacoes').send({ tipo: 'Pão', quantidade: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/quantidade/);
    expect(res.body.erro).toMatch(/validade/);
    expect((await listarDisponiveis()).body).toHaveLength(0);
  });
});

describe('aceitar uma doação', () => {
  it('marca a doação como aceita pela ONG', async () => {
    const doacao = await publicar();

    const res = await aceitar(doacao.id, 'Banco de Alimentos');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: doacao.id,
      status: 'aceita',
      ong: 'Banco de Alimentos'
    });
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const aceitaPelaOng = await publicar();
    const continuaDisponivel = await publicar({ ...SOPA, tipo: 'Frutas' });

    await aceitar(aceitaPelaOng.id, 'Banco de Alimentos');

    const res = await listarDisponiveis();

    expect(res.body.map((doacao) => doacao.id)).toEqual([continuaDisponivel.id]);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const doacao = await publicar();
    await aceitar(doacao.id, 'Banco de Alimentos');

    const res = await aceitar(doacao.id, 'Casa de Apoio');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Banco de Alimentos/);
  });

  it('recusa aceitar uma doação que não existe', async () => {
    const res = await aceitar(999, 'Banco de Alimentos');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/);
  });
});
