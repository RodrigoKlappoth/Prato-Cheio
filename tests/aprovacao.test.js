import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { SOPA, SENHA, CIDADE, entrarComoDoador, entrarComoOng, entrarComoCoordenacao, cadastrarOngPelaTela } from './apoio.js';

const app = criarApp();

const COZINHA = { nome: 'Cozinha da Vila', email: 'contato@cozinhadavila.org', senha: SENHA, cidade: CIDADE, papel: 'ong' };

beforeAll(criarBancoEmMemoria);

beforeEach(limparBanco);

afterAll(fecharBancoEmMemoria);

async function publicarDoacao() {
  const doador = await entrarComoDoador(app);
  const res = await doador.post('/api/doacoes').send(SOPA);
  expect(res.status).toBe(201);
  return res.body;
}

function listarDisponiveis(quem) {
  return quem.get('/api/doacoes');
}

describe('H-05 — a ONG cria a própria conta', () => {
  it('cria a conta pendente e já deixa a ONG entrar', async () => {
    const { ong, conta } = await cadastrarOngPelaTela(app);

    expect(conta).toMatchObject({ nome: COZINHA.nome, papel: 'ong', cidade: CIDADE, situacao: 'pendente' });
    expect((await ong.get('/api/eu')).body).toMatchObject({ papel: 'ong', situacao: 'pendente' });
  });

  it('recusa o cadastro de ONG sem cidade, porque a coordenação é por cidade', async () => {
    const res = await request(app).post('/api/cadastro').send({ ...COZINHA, cidade: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/cidade/);
    expect(await banco().usuario.count()).toBe(0);
  });

  it('deixa a ONG pendente ver a lista, mas recusa o aceite dela', async () => {
    const doacao = await publicarDoacao();
    const { ong } = await cadastrarOngPelaTela(app);

    const lista = await listarDisponiveis(ong);
    const aceite = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(lista.body).toMatchObject([{ id: doacao.id }]);
    expect(aceite.status).toBe(403);
    expect(aceite.body.erro).toMatch(/aguarda a aprovação/);
    expect((await banco().doacao.findUnique({ where: { id: doacao.id } })).status).toBe('disponivel');
  });

  it('recusa o aceite da ONG que a coordenação recusou', async () => {
    const doacao = await publicarDoacao();
    const { ong, conta } = await cadastrarOngPelaTela(app);
    const coordenacao = await entrarComoCoordenacao(app);
    await coordenacao.post(`/api/ongs/${conta.id}/recusar`).send();

    const res = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/não aprovou/);
  });
});

describe('H-06 — a coordenação da cidade aprova ou recusa', () => {
  it('mostra só os pedidos pendentes da cidade de quem coordena', async () => {
    await cadastrarOngPelaTela(app);
    await cadastrarOngPelaTela(app, { nome: 'Casa de Apoio', email: 'contato@casadeapoio.org', cidade: 'Diadema' });
    await entrarComoOng(app);
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await coordenacao.get('/api/ongs/pendentes');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject([{ nome: COZINHA.nome, email: COZINHA.email, cidade: CIDADE, situacao: 'pendente' }]);
    expect(res.body).toHaveLength(1);
  });

  it('aprovar deixa a ONG aceitar e registra quem aprovou e quando', async () => {
    const doacao = await publicarDoacao();
    const { ong, conta } = await cadastrarOngPelaTela(app);
    const coordenacao = await entrarComoCoordenacao(app);

    const aprovacao = await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send();
    const aceite = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(aprovacao.status).toBe(200);
    expect(aprovacao.body).toMatchObject({ id: conta.id, situacao: 'aprovada' });
    expect(aceite.status).toBe(200);
    expect(aceite.body).toMatchObject({ status: 'aceita', ong: COZINHA.nome });

    const guardada = await banco().usuario.findUnique({ where: { id: conta.id } });
    const marta = await banco().usuario.findUnique({ where: { email: 'marta@pratocheio.org' } });
    expect(guardada.avaliada_por_id).toBe(marta.id);
    expect(guardada.avaliada_em).toBeInstanceOf(Date);
  });

  it('desfaz uma aprovação, e a ONG volta a não aceitar', async () => {
    const doacao = await publicarDoacao();
    const { ong, conta } = await cadastrarOngPelaTela(app);
    const coordenacao = await entrarComoCoordenacao(app);
    await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send();

    await coordenacao.post(`/api/ongs/${conta.id}/recusar`).send();
    const res = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(res.status).toBe(403);
    expect((await banco().doacao.findUnique({ where: { id: doacao.id } })).status).toBe('disponivel');
  });

  it('recusa quem não é da coordenação, mesmo entrando como doador ou ONG', async () => {
    const { conta } = await cadastrarOngPelaTela(app);
    const doador = await entrarComoDoador(app, { nome: 'Mercado Central', email: 'contato@mercado.com' });
    const ong = await entrarComoOng(app);

    expect((await doador.post(`/api/ongs/${conta.id}/aprovar`).send()).status).toBe(403);
    expect((await ong.post(`/api/ongs/${conta.id}/aprovar`).send()).status).toBe(403);
    expect((await doador.get('/api/ongs/pendentes')).status).toBe(403);
    expect((await banco().usuario.findUnique({ where: { id: conta.id } })).situacao).toBe('pendente');
  });

  it('recusa aprovar uma ONG de outra cidade', async () => {
    const { conta } = await cadastrarOngPelaTela(app, { cidade: 'Diadema' });
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send();

    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/Diadema/);
    expect(res.body.erro).toMatch(/Santo André/);
    expect((await banco().usuario.findUnique({ where: { id: conta.id } })).situacao).toBe('pendente');
  });

  it('recusa aprovar uma conta que não é de ONG', async () => {
    await entrarComoDoador(app);
    const paulo = await banco().usuario.findUnique({ where: { email: 'paulo@padaria.com' } });
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await coordenacao.post(`/api/ongs/${paulo.id}/aprovar`).send();

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/);
    expect((await banco().usuario.findUnique({ where: { id: paulo.id } })).papel).toBe('doador');
  });

  it('recusa aprovar uma conta que não existe e um id que não é número', async () => {
    const coordenacao = await entrarComoCoordenacao(app);

    const inexistente = await coordenacao.post('/api/ongs/999/aprovar').send();
    const semNumero = await coordenacao.post('/api/ongs/abc/aprovar').send();

    expect(inexistente.status).toBe(400);
    expect(inexistente.body.erro).toMatch(/não encontrada/);
    expect(semNumero.status).toBe(400);
    expect(semNumero.body.erro).toMatch(/id de conta inválido/);
  });

  it('recusa aprovar e ver os pedidos sem entrar', async () => {
    const { conta } = await cadastrarOngPelaTela(app);

    expect((await request(app).get('/api/ongs/pendentes')).status).toBe(401);
    expect((await request(app).post(`/api/ongs/${conta.id}/aprovar`).send()).status).toBe(401);
  });
});

describe('a ONG criada pela coordenação no terminal', () => {
  it('nasce aprovada e aceita doações na hora', async () => {
    const doacao = await publicarDoacao();
    const ong = await entrarComoOng(app);

    const res = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect((await ong.get('/api/eu')).body).toMatchObject({ situacao: 'aprovada', cidade: CIDADE });
    expect(res.status).toBe(200);
  });
});
