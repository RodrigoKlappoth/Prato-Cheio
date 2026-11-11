import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import {
  SOPA,
  SENHA,
  ESTADO,
  CIDADE,
  OUTRA_CIDADE,
  entrarComoDoador,
  entrarComoOng,
  entrarComoCoordenacao,
  cadastrarOngPelaTela
} from './apoio.js';

const app = criarApp();

beforeAll(criarBancoEmMemoria);

beforeEach(limparBanco);

afterAll(fecharBancoEmMemoria);

function corrigir(agente, dados) {
  return agente.patch('/api/eu').send(dados);
}

describe('H-09 — a pessoa corrige a própria conta (RN-07)', () => {
  it('CA-09.1 — corrige a cidade escolhida errada no cadastro', async () => {
    const doador = await entrarComoDoador(app, { cidade: OUTRA_CIDADE });

    const res = await corrigir(doador, { estado: ESTADO, cidade: CIDADE });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: ESTADO, cidade: CIDADE });
    // A conta continua a mesma, e não outra: o id não muda e a sessão segue de pé.
    expect((await doador.get('/api/eu')).body).toMatchObject({ id: res.body.id, cidade: CIDADE });
  });

  it('CA-09.1 — depois da correção, o doador publica para as ONGs da cidade certa', async () => {
    const doador = await entrarComoDoador(app, { cidade: OUTRA_CIDADE });
    await corrigir(doador, { estado: ESTADO, cidade: CIDADE });
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);

    const ongDaCidadeCerta = await entrarComoOng(app, { cidade: CIDADE });
    const ongDaCidadeErrada = await entrarComoOng(app, {
      nome: 'Casa de Apoio',
      email: 'contato@casadeapoio.org',
      cidade: OUTRA_CIDADE
    });

    expect((await ongDaCidadeCerta.get('/api/doacoes')).body.map((d) => d.id)).toEqual([doacao.id]);
    expect((await ongDaCidadeErrada.get('/api/doacoes')).body).toEqual([]);
  });

  it('CA-09.2 — corrige o nome do estabelecimento, e ele aparece na doação publicada', async () => {
    const doador = await entrarComoDoador(app, { nome: 'Padaria do Seu Paulo' });

    const res = await corrigir(doador, { nome: 'Panificadora do Seu Paulo' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Panificadora do Seu Paulo');
    await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app);
    expect((await ong.get('/api/doacoes')).body[0].doador).toBe('Panificadora do Seu Paulo');
  });

  it('CA-09.2 — muda só o que vem no pedido: corrigir o nome não apaga a cidade', async () => {
    const doador = await entrarComoDoador(app, { cidade: OUTRA_CIDADE });

    const res = await corrigir(doador, { nome: 'Mercado da Praça' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Mercado da Praça', estado: ESTADO, cidade: OUTRA_CIDADE });
  });

  it('CA-09.3 — recusa cidade que não está na lista da rede', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });

    const res = await corrigir(doador, { estado: ESTADO, cidade: 'Joinvile' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ainda não atende Joinvile/);
    expect((await doador.get('/api/eu')).body.cidade).toBe(CIDADE);
  });

  it('CA-09.3 — recusa estado que a rede não atende', async () => {
    const doador = await entrarComoDoador(app);

    const res = await corrigir(doador, { estado: 'SP', cidade: 'São Paulo' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não atende o estado SP/);
  });

  it('CA-09.3 — recusa nome em branco', async () => {
    const doador = await entrarComoDoador(app);

    const res = await corrigir(doador, { nome: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/nome/);
    expect((await doador.get('/api/eu')).body.nome).toBe('Padaria do Seu Paulo');
  });

  it('CA-09.4 — recusa corrigir conta sem estar logado', async () => {
    await entrarComoDoador(app);

    const res = await request(app).patch('/api/eu').send({ cidade: OUTRA_CIDADE });

    expect(res.status).toBe(401);
    expect(await banco().usuario.count({ where: { cidade: OUTRA_CIDADE } })).toBe(0);
  });

  // O que esta rota não muda é tão importante quanto o que ela muda: e-mail e
  // senha são a identificação (ADR 0003) e o papel define o que a conta pode.
  it('CA-09.5 — ignora e-mail, senha, papel e situação vindos no corpo do pedido', async () => {
    const { ong, conta } = await cadastrarOngPelaTela(app);

    const res = await corrigir(ong, {
      cidade: OUTRA_CIDADE,
      email: 'outro@email.org',
      senha: 'senha-nova-1234',
      papel: 'coordenacao',
      situacao: 'aprovada'
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: conta.email,
      papel: 'ong',
      situacao: 'pendente',
      cidade: OUTRA_CIDADE
    });
    // A senha antiga continua valendo, então ela não foi trocada por aqui.
    const outraJanela = request.agent(app);
    expect((await outraJanela.post('/api/login').send({ email: conta.email, senha: SENHA })).status).toBe(200);
  });

  it('CA-09.5 — a conta de ONG pendente corrige a cidade sem virar aprovada', async () => {
    const { ong } = await cadastrarOngPelaTela(app);

    const res = await corrigir(ong, { estado: ESTADO, cidade: OUTRA_CIDADE });

    expect(res.body.situacao).toBe('pendente');
    const coordenacao = await entrarComoCoordenacao(app);
    const pedidos = (await coordenacao.get('/api/ongs/pendentes')).body;
    // O pedido continua na fila, e já na cidade corrigida.
    expect(pedidos.map((p) => p.cidade)).toEqual([OUTRA_CIDADE]);
  });

  it('a coordenação também corrige a própria conta', async () => {
    const coordenacao = await entrarComoCoordenacao(app);

    const res = await corrigir(coordenacao, { estado: ESTADO, cidade: OUTRA_CIDADE });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ papel: 'coordenacao', cidade: OUTRA_CIDADE });
  });
});

describe('H-09 — a cidade não muda com doação em circulação (RN-07)', () => {
  it('CA-09.6 — recusa a mudança de cidade do doador com doação esperando uma ONG', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });
    await doador.post('/api/doacoes').send(SOPA);

    const res = await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/doação em circulação/);
    expect((await doador.get('/api/eu')).body.cidade).toBe(CIDADE);
  });

  it('CA-09.6 — deixa o doador corrigir o nome mesmo com doação em circulação', async () => {
    const doador = await entrarComoDoador(app);
    await doador.post('/api/doacoes').send(SOPA);

    const res = await corrigir(doador, { nome: 'Padaria Central' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Padaria Central');
  });

  it('CA-09.7 — recusa a mudança de cidade da ONG com aceite em aberto', async () => {
    const doador = await entrarComoDoador(app);
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app, { cidade: CIDADE });
    await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    const res = await corrigir(ong, { estado: ESTADO, cidade: OUTRA_CIDADE });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/aceita e não retirada/);
  });

  it('CA-09.8 — libera a mudança de cidade depois da retirada confirmada', async () => {
    const doador = await entrarComoDoador(app);
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app, { cidade: CIDADE });
    await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();
    await ong.post(`/api/doacoes/${doacao.id}/retirar`).send();

    expect((await corrigir(ong, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);
    expect((await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);
  });

  it('CA-09.8 — libera a mudança de cidade depois de a ONG cancelar o aceite e o prazo vencer', async () => {
    const doador = await entrarComoDoador(app);
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app);
    await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();
    await ong.post(`/api/doacoes/${doacao.id}/cancelar`).send();

    // A doação voltou para a lista: o doador continua preso a ela.
    expect((await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(400);

    // Com o prazo vencido ela saiu da lista (RN-03) e não prende mais ninguém.
    await banco().doacao.update({ where: { id: doacao.id }, data: { validade: '2020-01-01' } });
    expect((await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);
  });
});

describe('H-09 — a doação guarda a cidade em que foi publicada (ADR 0011)', () => {
  it('CA-09.9 — a doação já retirada mantém a cidade de origem no histórico', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app, { cidade: CIDADE });
    await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();
    await ong.post(`/api/doacoes/${doacao.id}/retirar`).send();

    expect((await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);

    const guardada = await banco().doacao.findUnique({ where: { id: doacao.id } });
    expect(guardada).toMatchObject({ estado: ESTADO, cidade: CIDADE });
    // E a ONG que retirou continua vendo a doação no histórico dela.
    expect((await ong.get('/api/doacoes/recentes')).body.map((d) => d.id)).toEqual([doacao.id]);
  });

  it('CA-09.9 — a doação esperando continua na lista da cidade em que foi publicada', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });
    const { body: doacao } = await doador.post('/api/doacoes').send(SOPA);
    const ong = await entrarComoOng(app, { cidade: CIDADE });
    await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();
    await ong.post(`/api/doacoes/${doacao.id}/retirar`).send();

    // Com a doação fora de circulação, o doador muda de cidade e publica de novo.
    await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE });
    const { body: aNova } = await doador.post('/api/doacoes').send({ ...SOPA, tipo: 'Pão' });

    // A antiga ficou em Joinville; só a nova aparece para a ONG de Blumenau.
    const ongDeLa = await entrarComoOng(app, {
      nome: 'Casa de Apoio',
      email: 'contato@casadeapoio.org',
      cidade: OUTRA_CIDADE
    });
    expect((await ongDeLa.get('/api/doacoes')).body.map((d) => d.id)).toEqual([aNova.id]);
    expect((await ong.get('/api/doacoes')).body).toEqual([]);
  });
});
