import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { SOPA, SENHA, ESTADO, CIDADE, OUTRA_CIDADE, entrarComoDoador, entrarComoOng, entrarComoCoordenacao, cadastrarOngPelaTela } from './apoio.js';

const app = criarApp();

const COZINHA = { nome: 'Cozinha da Vila', email: 'contato@cozinhadavila.org', senha: SENHA, estado: ESTADO, cidade: CIDADE, papel: 'ong' };

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
  // Este teste já existiu ao contrário: na primeira versão da H-06 ele se
  // chamava "mostra só os pedidos pendentes da cidade de quem coordena". O
  // ADR 0010 substituiu essa regra, e o teste virou com ela.
  it('mostra os pedidos pendentes de todas as cidades da rede', async () => {
    await cadastrarOngPelaTela(app);
    await cadastrarOngPelaTela(app, {
      nome: 'Casa de Apoio',
      email: 'contato@casadeapoio.org',
      cidade: OUTRA_CIDADE
    });
    await entrarComoOng(app);
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await coordenacao.get('/api/ongs/pendentes');

    expect(res.status).toBe(200);
    // As duas pendentes, de cidades diferentes. A ONG já aprovada fica fora.
    expect(res.body.map((pedido) => pedido.cidade)).toEqual([OUTRA_CIDADE, CIDADE]);
    expect(res.body[1]).toMatchObject({ nome: COZINHA.nome, email: COZINHA.email, situacao: 'pendente' });
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

  // O oposto do que a H-06 fazia na primeira versão, quando este teste se
  // chamava "recusa aprovar uma ONG de outra cidade" e esperava 403. A regra
  // mudou no ADR 0010, e o teste prova a regra nova.
  it('aprova uma ONG de outra cidade, porque a coordenação atende a rede toda', async () => {
    const { conta } = await cadastrarOngPelaTela(app, { cidade: OUTRA_CIDADE });
    const coordenacao = await entrarComoCoordenacao(app, { cidade: CIDADE });

    const res = await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ situacao: 'aprovada', cidade: OUTRA_CIDADE });
    expect((await banco().usuario.findUnique({ where: { id: conta.id } })).situacao).toBe('aprovada');
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
