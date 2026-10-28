import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { criarApp } from '../src/app.js';
import { banco } from '../src/db.js';
import { criarDoacao } from '../src/doacoes.js';
import { hojeNaRede } from '../src/regras.js';
import { criarBancoEmMemoria, limparBanco, fecharBancoEmMemoria } from './banco-em-memoria.js';
import { SOPA, diaNaRede, entrarComoDoador, entrarComoOng } from './apoio.js';

const app = criarApp();

let doador;
let ong;

beforeAll(criarBancoEmMemoria);

beforeEach(async () => {
  await limparBanco();
  doador = await entrarComoDoador(app);
  ong = await entrarComoOng(app);
});

afterAll(fecharBancoEmMemoria);

function publicar(validade) {
  return doador.post('/api/doacoes').send({ ...SOPA, validade });
}

// Publica uma doação cujo prazo já venceu, com o "agora" de dois dias atrás:
// naquele dia, o prazo de ontem ainda era o de amanhã. É o parâmetro da decisão
// D1 que torna este cenário possível sem esperar o tempo passar nem gravar à mão
// um estado que o sistema não produziria (ADR 0007).
async function publicarJaVencida(validade = diaNaRede(-1)) {
  const paulo = await banco().usuario.findUnique({ where: { email: 'paulo@padaria.com' } });
  return criarDoacao(paulo, { ...SOPA, validade }, new Date(`${diaNaRede(-2)}T12:00:00Z`));
}

function statusNoBanco(id) {
  return banco().doacao.findUnique({ where: { id } }).then((doacao) => doacao.status);
}

describe('o "hoje" da regra é o de São Paulo, não o do servidor', () => {
  it('às 23h de São Paulo ainda é o dia anterior ao do relógio em UTC', () => {
    // A função da Vercel roda em UTC (ADR 0002): 2026-10-28T02:00Z é 23h do dia
    // 27 em São Paulo. Uma doação para retirar no dia 27 não está vencida ali.
    expect(hojeNaRede(new Date('2026-10-28T02:00:00Z'))).toBe('2026-10-27');
    expect(hojeNaRede(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-28');
  });
});

describe('H-03 — doação vencida não circula (RN-03)', () => {
  it('CA-03.1 — não mostra na lista a doação com prazo de ontem', async () => {
    const vencida = await publicarJaVencida();
    const { body: noPrazo } = await publicar(diaNaRede(1));

    const res = await ong.get('/api/doacoes');

    expect(res.body.map((doacao) => doacao.id)).toEqual([noPrazo.id]);
    // A doação não é apagada nem muda de estado: ela continua no banco, só
    // deixa de circular. A rastreabilidade prometida à vigilância depende disso.
    expect(await statusNoBanco(vencida.id)).toBe('disponivel');
  });

  it('CA-03.2 — recusa o aceite de uma doação com o prazo vencido', async () => {
    const vencida = await publicarJaVencida();

    const res = await ong.post(`/api/doacoes/${vencida.id}/aceitar`).send();

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/prazo de retirada vencido/);
    expect(await statusNoBanco(vencida.id)).toBe('disponivel');
  });

  it('CA-03.3 — o limite é hoje, inclusive: o que vence hoje aparece e é aceito', async () => {
    const { body: vencendoHoje } = await publicar(diaNaRede(0));

    const lista = await ong.get('/api/doacoes');
    const aceite = await ong.post(`/api/doacoes/${vencendoHoje.id}/aceitar`).send();

    expect(lista.body.map((doacao) => doacao.id)).toEqual([vencendoHoje.id]);
    expect(aceite.status).toBe(200);
    expect(aceite.body.status).toBe('aceita');
  });

  it('CA-03.3 — "vence hoje" e "venceu ontem" não viram a mesma coisa', async () => {
    const ontem = await publicarJaVencida(diaNaRede(-1));
    const { body: hoje } = await publicar(diaNaRede(0));

    expect((await ong.get('/api/doacoes')).body.map((doacao) => doacao.id)).toEqual([hoje.id]);
    expect((await ong.post(`/api/doacoes/${ontem.id}/aceitar`).send()).status).toBe(400);
  });

  it('CA-03.4 — recusa publicar com o prazo no passado', async () => {
    const res = await publicar(diaNaRede(-1));

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/prazo de retirada já vencido/);
    expect(await banco().doacao.count()).toBe(0);
  });

  it('CA-03.4 — recusa publicar com um prazo que não é um dia de verdade', async () => {
    // O 2026-02-31 é o caso que o formato não pega: new Date não reclama dele,
    // vira 3 de março. Por isso a validação confere se o dia volta igual.
    for (const validade of ['31/12/2026', '2026-13-01', '2026-02-31', 'amanhã', '2026-2-3']) {
      const res = await publicar(validade);

      expect(res.status, validade).toBe(400);
      expect(res.body.erro, validade).toMatch(/prazo de retirada inválido/);
    }
    expect(await banco().doacao.count()).toBe(0);
  });
});
