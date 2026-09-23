import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
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
});
