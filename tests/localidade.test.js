import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { SOPA, SENHA, ESTADO, CIDADE, OUTRA_CIDADE, entrarComoDoador, entrarComoOng } from './apoio.js';

const app = criarApp();

const CONTA = { nome: 'Padaria do Seu Paulo', email: 'paulo@padaria.com', senha: SENHA };

beforeAll(criarBancoEmMemoria);

beforeEach(limparBanco);

afterAll(fecharBancoEmMemoria);

function cadastrar(dados) {
  return request(app).post('/api/cadastro').send(dados);
}

describe('a rede diz onde atende', () => {
  it('entrega a lista de estados e cidades sem exigir login, porque o cadastro precisa dela antes', async () => {
    const res = await request(app).get('/api/localidades');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ sigla: 'SC', nome: 'Santa Catarina' });
    expect(res.body[0].cidades).toContain(CIDADE);
    expect(res.body[0].cidades).toContain(OUTRA_CIDADE);
  });
});

describe('H-08 — toda conta tem estado e cidade, escolhidos na lista', () => {
  it('recusa o cadastro de doador sem estado e sem cidade', async () => {
    const res = await cadastrar(CONTA);

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/estado/);
    expect(res.body.erro).toMatch(/cidade/);
    expect(await banco().usuario.count()).toBe(0);
  });

  it('recusa cidade que não está na lista, mesmo com o estado certo', async () => {
    const res = await cadastrar({ ...CONTA, estado: ESTADO, cidade: 'Joinvile' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ainda não atende Joinvile/);
    expect(await banco().usuario.count()).toBe(0);
  });

  it('recusa estado que a rede não atende', async () => {
    const res = await cadastrar({ ...CONTA, estado: 'SP', cidade: 'São Paulo' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não atende o estado SP/);
    expect(await banco().usuario.count()).toBe(0);
  });

  it('recusa ONG sem cidade', async () => {
    const res = await cadastrar({ ...CONTA, email: 'ong@ong.org', papel: 'ong', estado: ESTADO });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/cidade/);
  });

  it('aceita a sigla do estado em minúsculo', async () => {
    const res = await cadastrar({ ...CONTA, estado: 'sc', cidade: CIDADE });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ estado: 'SC', cidade: CIDADE });
  });
});

describe('H-08 — a ONG vê só as doações da sua cidade (RN-06)', () => {
  it('separa as listas de duas ONGs em cidades diferentes', async () => {
    const daqui = await entrarComoDoador(app, { cidade: CIDADE });
    const dalaBlumenau = await entrarComoDoador(app, {
      nome: 'Mercado de Blumenau',
      email: 'contato@mercado.com',
      cidade: OUTRA_CIDADE
    });
    const { body: doacaoDaqui } = await daqui.post('/api/doacoes').send(SOPA);
    const { body: doacaoDeLa } = await dalaBlumenau.post('/api/doacoes').send({ ...SOPA, tipo: 'Pão' });

    const ongDaqui = await entrarComoOng(app, { cidade: CIDADE });
    const ongDeLa = await entrarComoOng(app, {
      nome: 'Casa de Apoio',
      email: 'contato@casadeapoio.org',
      cidade: OUTRA_CIDADE
    });

    expect((await ongDaqui.get('/api/doacoes')).body.map((d) => d.id)).toEqual([doacaoDaqui.id]);
    expect((await ongDeLa.get('/api/doacoes')).body.map((d) => d.id)).toEqual([doacaoDeLa.id]);
  });

  it('recusa o aceite de doação de outra cidade, mesmo sabendo o número dela', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ongDeLa = await entrarComoOng(app, {
      nome: 'Casa de Apoio',
      email: 'contato@casadeapoio.org',
      cidade: OUTRA_CIDADE
    });

    // A lista já esconde a doação, mas esconder não é proteger: a ONG pode
    // chamar a rota direto com o número que viu em qualquer lugar.
    const res = await ongDeLa.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(new RegExp(`é de ${CIDADE}`));
    expect(res.body.erro).toMatch(new RegExp(`atende ${OUTRA_CIDADE}`));
    expect((await banco().doacao.findUnique({ where: { id: doacao.id } })).status).toBe('disponivel');
  });

  it('o doador continua vendo o que publicou, porque o histórico é por conta e não por cidade', async () => {
    const doador = await entrarComoDoador(app, { cidade: OUTRA_CIDADE });
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);

    const res = await doador.get('/api/doacoes/recentes');

    expect(res.body.map((d) => d.id)).toEqual([doacao.id]);
  });
});
