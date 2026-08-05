import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Os testes usam o banco — que na Unidade 1 é SQLite em memória (ver
// vitest.config.js): nada a instalar, nada a subir, e o dados.sqlite de
// desenvolvimento não é tocado.
beforeEach(async () => {
  await migrar();
  await limparBanco();
});

afterAll(async () => {
  await encerrar();
});

const SOPA = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' };

/** Atalho: publica uma doação e devolve a linha criada. */
async function publicar(doacao = SOPA) {
  const res = await request(app).post('/api/doacoes').send(doacao);
  expect(res.status).toBe(201);
  return res.body;
}

// Este teste não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  // Dado que um doador publicou uma doação
  // Quando uma ONG consulta as doações disponíveis
  // Então a doação aparece na lista
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await publicar();

    const res = await request(app).get('/api/doacoes');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: '2026-08-01',
      status: 'disponivel'
    });
  });

  // Dado um doador preenchendo o formulário
  // Quando ele deixa um campo obrigatório em branco
  // Então a doação é recusada e nada é gravado
  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/quantidade/);
    expect(res.body.erro).toMatch(/validade/);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});

describe('aceitar uma doação', () => {
  // Dado que existe uma doação disponível
  // Quando uma ONG a aceita
  // Então a doação passa a constar como aceita por aquela ONG
  it('marca a doação como aceita pela ONG', async () => {
    const doacao = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'Banco de Alimentos' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: doacao.id,
      status: 'aceita',
      ong: 'Banco de Alimentos'
    });
  });

  // Dado que uma ONG aceitou uma doação
  // Quando outra ONG consulta as doações disponíveis
  // Então aquela doação não aparece mais
  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const aceita = await publicar();
    const continua = await publicar({ ...SOPA, tipo: 'Frutas' });

    await request(app)
      .post(`/api/doacoes/${aceita.id}/aceitar`)
      .send({ ong: 'Banco de Alimentos' });

    const res = await request(app).get('/api/doacoes');
    expect(res.body.map((d) => d.id)).toEqual([continua.id]);
  });

  // Dado que uma ONG já aceitou a doação
  // Quando uma segunda ONG tenta aceitar a mesma doação
  // Então a tentativa é recusada e a primeira ONG continua com a doação
  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const doacao = await publicar();

    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'Banco de Alimentos' });

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'Casa de Apoio' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Banco de Alimentos/);
  });

  // Uma ONG não pode aceitar uma doação que nunca existiu.
  it('recusa aceitar uma doação inexistente', async () => {
    const res = await request(app)
      .post('/api/doacoes/999/aceitar')
      .send({ ong: 'Banco de Alimentos' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/);
  });
});
