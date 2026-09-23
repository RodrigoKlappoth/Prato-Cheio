import express from 'express';
import { fileURLToPath } from 'node:url';
import * as doacoes from './doacoes.js';
import * as usuarios from './usuarios.js';

const COOKIE_DA_SESSAO = 'sessao';
const PAGINA_INICIAL = fileURLToPath(new URL('../public/index.html', import.meta.url));

function lerSessao(req) {
  const cookie = (req.headers.cookie ?? '')
    .split(';')
    .map((trecho) => trecho.trim())
    .find((trecho) => trecho.startsWith(`${COOKIE_DA_SESSAO}=`));
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_DA_SESSAO.length + 1)) : undefined;
}

function gravarSessao(res, token) {
  res.cookie(COOKIE_DA_SESSAO, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: usuarios.DURACAO_DA_SESSAO
  });
}

function responder(acao, statusDeSucesso = 200) {
  return async (req, res) => {
    try {
      res.status(statusDeSucesso).json(await acao(req, res));
    } catch (erro) {
      res.status(erro.status ?? 400).json({ erro: erro.message });
    }
  };
}

export function criarApp() {
  const app = express();
  app.use(express.json());

  // Na Vercel, o endereço / é sempre do Express, então a página inicial sai daqui.
  // O resto de public/ sai da CDN da Vercel e, localmente, do express.static.
  app.get('/', (req, res) => res.sendFile(PAGINA_INICIAL));
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.use('/api', async (req, res, next) => {
    try {
      req.usuario = await usuarios.pelaSessao(lerSessao(req));
      next();
    } catch (erro) {
      next(erro);
    }
  });

  app.post('/api/cadastro', responder(async (req, res) => {
    const { usuario, token } = await usuarios.cadastrarDoador(req.body);
    gravarSessao(res, token);
    return usuario;
  }, 201));

  app.post('/api/login', responder(async (req, res) => {
    const { usuario, token } = await usuarios.entrar(req.body);
    gravarSessao(res, token);
    return usuario;
  }));

  app.post('/api/logout', responder(async (req, res) => {
    await usuarios.sair(lerSessao(req));
    res.clearCookie(COOKIE_DA_SESSAO);
    return { ok: true };
  }));

  app.get('/api/eu', responder((req) => usuarios.exigirLogin(req.usuario)));

  app.get('/api/doacoes', responder((req) => doacoes.listarDisponiveis(req.usuario)));

  app.post('/api/doacoes', responder((req) => doacoes.criarDoacao(req.usuario, req.body), 201));

  app.post('/api/doacoes/:id/aceitar', responder((req) => doacoes.aceitar(req.usuario, req.params.id)));

  return app;
}

export default criarApp();
