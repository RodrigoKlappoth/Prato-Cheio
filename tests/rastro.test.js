import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import {
  SOPA,
  ESTADO,
  CIDADE,
  OUTRA_CIDADE,
  TERCEIRA_CIDADE,
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

function mudancas(agente) {
  return agente.get('/api/ongs/mudancas-de-cidade');
}

function rastroNoBanco() {
  return banco().mudancaDeLocalidade.findMany({ orderBy: { id: 'asc' } });
}

// A ONG que passou pela fila: cadastro na tela, aprovação da coordenação e só
// então a mudança de cidade. É o caso que a história existe para mostrar.
//
// O arranjo confere que o alerta apareceu antes de devolver o controle ao
// teste. Sem isso, um teste que espera a lista vazia no fim passa também quando
// a lista nunca encheu — foi o que a inversão da regra mostrou nos dois testes
// do CA-11.5, que ficavam verdes com o rastro desligado.
async function ongAprovadaEDepoisMudadaDeCidade(coordenacao, { para = OUTRA_CIDADE } = {}) {
  const { ong, conta } = await cadastrarOngPelaTela(app);
  expect((await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send()).status).toBe(200);
  expect((await corrigir(ong, { estado: ESTADO, cidade: para })).status).toBe(200);
  expect((await mudancas(coordenacao)).body.map((alerta) => alerta.id)).toEqual([conta.id]);
  return { ong, conta };
}

describe('H-11 — o rastro da mudança de localidade da conta (RN-08)', () => {
  it('CA-11.1 — grava de onde, para onde e quando a conta muda de localidade', async () => {
    const doador = await entrarComoDoador(app, { cidade: OUTRA_CIDADE });
    const antesDoPedido = Date.now();

    const res = await corrigir(doador, { estado: ESTADO, cidade: CIDADE });

    expect(res.status).toBe(200);
    const [mudanca, ...outras] = await rastroNoBanco();
    expect(outras).toEqual([]);
    expect(mudanca).toMatchObject({
      conta_id: res.body.id,
      estado_anterior: ESTADO,
      cidade_anterior: OUTRA_CIDADE,
      estado_novo: ESTADO,
      cidade_novo: CIDADE
    });
    // O "quando" é o instante do pedido, e não um valor qualquer: sem ele a
    // coordenação vê que a conta mudou, mas não se foi hoje ou no mês passado.
    expect(mudanca.mudada_em.getTime()).toBeGreaterThanOrEqual(antesDoPedido);
    expect(mudanca.mudada_em.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('CA-11.2 — corrigir só o nome não grava mudança de localidade', async () => {
    const doador = await entrarComoDoador(app, { nome: 'Padaria do Seu Paulo' });

    const res = await corrigir(doador, { nome: 'Panificadora do Seu Paulo' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Panificadora do Seu Paulo');
    expect(await rastroNoBanco()).toEqual([]);
  });

  it('CA-11.2 — reenviar a mesma cidade não grava mudança de localidade', async () => {
    const doador = await entrarComoDoador(app, { cidade: CIDADE });

    // A tela manda sempre os três campos, com os boxes já preenchidos: quem
    // corrige só o nome reenvia a cidade que já está gravada (public/tela.js).
    const res = await corrigir(doador, { nome: 'Padaria Central', estado: ESTADO, cidade: CIDADE });

    expect(res.status).toBe(200);
    expect(await rastroNoBanco()).toEqual([]);
  });
});

describe('H-11 — a coordenação vê quem mudou de cidade depois de aprovada (RN-08)', () => {
  it('CA-11.3 — mostra a ONG aprovada que mudou de cidade, com de onde e para onde', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    const { conta } = await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    const res = await mudancas(coordenacao);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: conta.id,
      nome: conta.nome,
      email: conta.email,
      estado_anterior: ESTADO,
      cidade_anterior: CIDADE,
      estado: ESTADO,
      cidade: OUTRA_CIDADE,
      mudancas: 1
    });
    expect(Date.parse(res.body[0].mudada_em)).not.toBeNaN();
  });

  it('CA-11.3 — deixa fora a ONG que não mudou e o doador que mudou', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    await entrarComoOng(app, { cidade: CIDADE });
    const doador = await entrarComoDoador(app, { cidade: CIDADE });
    expect((await corrigir(doador, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);

    expect((await mudancas(coordenacao)).body).toEqual([]);
    // A mudança do doador está gravada: o que a lista faz é escolher o que a
    // coordenação decide, e ela não decide sobre conta de doador (RN-04).
    expect(await rastroNoBanco()).toHaveLength(1);
  });

  it('CA-11.4 — a ONG que mudou de cidade antes da aprovação não entra na lista', async () => {
    const { ong, conta } = await cadastrarOngPelaTela(app);
    expect((await corrigir(ong, { estado: ESTADO, cidade: OUTRA_CIDADE })).status).toBe(200);

    const coordenacao = await entrarComoCoordenacao(app);
    expect((await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send()).status).toBe(200);

    // A coordenação aprovou a conta já dizendo Blumenau: não há nada aqui que
    // ela não tenha visto. O rastro guarda a mudança de qualquer forma.
    expect((await mudancas(coordenacao)).body).toEqual([]);
    expect(await rastroNoBanco()).toHaveLength(1);
  });

  it('CA-11.5 — manter aprovada regrava a aprovação e tira a conta da lista', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    const { ong, conta } = await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    const res = await coordenacao.post(`/api/ongs/${conta.id}/aprovar`).send();

    expect(res.status).toBe(200);
    expect(res.body.situacao).toBe('aprovada');
    expect((await mudancas(coordenacao)).body).toEqual([]);

    // E a ONG continua aceitando, agora na cidade nova (RN-06).
    const doadorDeLa = await entrarComoDoador(app, {
      nome: 'Mercado Central',
      email: 'mercado@blumenau.com',
      cidade: OUTRA_CIDADE
    });
    const { body: doacao } = await doadorDeLa.post('/api/doacoes').send(SOPA);
    expect((await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send()).status).toBe(200);
  });

  it('CA-11.5 — recusar tira a conta da lista e barra o aceite', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    const { ong, conta } = await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    const res = await coordenacao.post(`/api/ongs/${conta.id}/recusar`).send();

    expect(res.status).toBe(200);
    expect(res.body.situacao).toBe('recusada');
    expect((await mudancas(coordenacao)).body).toEqual([]);

    const doadorDeLa = await entrarComoDoador(app, {
      nome: 'Mercado Central',
      email: 'mercado@blumenau.com',
      cidade: OUTRA_CIDADE
    });
    const { body: doacao } = await doadorDeLa.post('/api/doacoes').send(SOPA);
    const tentativa = await ong.post(`/api/doacoes/${doacao.id}/aceitar`).send();

    expect(tentativa.status).toBe(403);
    expect((await banco().doacao.findUnique({ where: { id: doacao.id } })).status).toBe('disponivel');
  });

  it('CA-11.6 — recusa a lista de mudanças a quem não é da coordenação', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    const doador = await entrarComoDoador(app);
    const ong = await entrarComoOng(app, { nome: 'Casa de Apoio', email: 'contato@casadeapoio.org' });

    for (const agente of [doador, ong]) {
      const res = await mudancas(agente);
      expect(res.status).toBe(403);
      expect(res.body.erro).toMatch(/só a coordenação/);
      expect(Array.isArray(res.body)).toBe(false);
    }
  });

  it('CA-11.6 — recusa a lista de mudanças sem login', async () => {
    const res = await request(app).get('/api/ongs/mudancas-de-cidade');

    expect(res.status).toBe(401);
    expect(Array.isArray(res.body)).toBe(false);
  });
});

// Os dois casos abaixo não estavam nos critérios CA-11.1 a CA-11.6: apareceram
// ao escrever os testes, perguntando o que a lista faz com uma conta que mexeu
// na cidade mais de uma vez. Os critérios CA-11.7 e CA-11.8 nasceram daqui.
describe('H-11 — mais de uma mudança na mesma conta (RN-08)', () => {
  it('CA-11.7 — a conta que volta para a cidade da aprovação sai da lista, e o rastro guarda as duas viagens', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    const { ong } = await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    expect((await corrigir(ong, { estado: ESTADO, cidade: CIDADE })).status).toBe(200);

    // A conta está onde a coordenação aprovou: não sobrou decisão para tomar.
    expect((await mudancas(coordenacao)).body).toEqual([]);
    // Mas o rastro não apaga a ida: as duas mudanças continuam gravadas.
    expect((await rastroNoBanco()).map((m) => [m.cidade_anterior, m.cidade_novo])).toEqual([
      [CIDADE, OUTRA_CIDADE],
      [OUTRA_CIDADE, CIDADE]
    ]);
  });

  it('CA-11.8 — a ONG que mudou duas vezes aparece uma vez, de onde foi aprovada para onde está', async () => {
    const coordenacao = await entrarComoCoordenacao(app);
    const { ong } = await ongAprovadaEDepoisMudadaDeCidade(coordenacao);

    expect((await corrigir(ong, { estado: ESTADO, cidade: TERCEIRA_CIDADE })).status).toBe(200);

    const res = await mudancas(coordenacao);

    // Uma linha, e não duas: a coordenação decide sobre a conta, e decidir duas
    // vezes sobre a mesma ONG é o jeito mais fácil de aprovar sem ler.
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      cidade_anterior: CIDADE,
      cidade: TERCEIRA_CIDADE,
      mudancas: 2
    });
    // O "quando" é o da mudança mais recente, que é a que ainda surpreende.
    const [, ultima] = await rastroNoBanco();
    expect(Date.parse(res.body[0].mudada_em)).toBe(ultima.mudada_em.getTime());
  });
});
