import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as moduloDoApp from '../src/app.js';

const PASTA_SRC = fileURLToPath(new URL('../src/', import.meta.url));

function importsDeArquivosTs() {
  return readdirSync(PASTA_SRC, { recursive: true })
    .filter((arquivo) => arquivo.endsWith('.js') && !arquivo.includes('generated'))
    .flatMap((arquivo) => {
      const codigo = readFileSync(join(PASTA_SRC, arquivo), 'utf8');
      return [...codigo.matchAll(/from\s+['"]([^'"]+\.ts)['"]/g)].map((achado) => `${arquivo}: ${achado[1]}`);
    });
}

describe('o que a Vercel exige para rodar o sistema', () => {
  it('o src/app.js exporta o app como padrão', () => {
    expect(typeof moduloDoApp.default).toBe('function');
    expect(typeof moduloDoApp.default.listen).toBe('function');
  });

  it('nenhum arquivo de src importa .ts, porque a Vercel troca .ts por .js no build', () => {
    expect(importsDeArquivosTs()).toEqual([]);
  });

  it('o próprio app entrega a página inicial, porque na Vercel o endereço / é sempre do Express', async () => {
    // Na Vercel, os arquivos de public/ vão para a CDN e o express.static da função não os encontra.
    // O teste sobe o app numa pasta vazia para ficar igual.
    const pastaDoProjeto = process.cwd();
    const pastaVazia = mkdtempSync(join(tmpdir(), 'como-na-vercel-'));
    process.chdir(pastaVazia);
    try {
      const resposta = await request(moduloDoApp.criarApp()).get('/');

      expect(resposta.status).toBe(200);
      expect(resposta.text).toContain('<html lang="pt-BR">');
    } finally {
      process.chdir(pastaDoProjeto);
      rmSync(pastaVazia, { recursive: true, force: true });
    }
  });
});
