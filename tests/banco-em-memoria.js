import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { banco, usarBanco, encerrar } from '../src/db.js';

const MIGRATIONS = new URL('../prisma/migrations/', import.meta.url);

let pglite;

export async function criarBancoEmMemoria() {
  pglite = new PGlite();
  const pastas = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort();
  for (const pasta of pastas) {
    await pglite.exec(readFileSync(new URL(`${pasta}/migration.sql`, MIGRATIONS), 'utf8'));
  }
  usarBanco(new PrismaClient({ adapter: new PrismaPGlite(pglite) }));
}

export async function limparBanco() {
  await banco().sessao.deleteMany();
  await banco().doacao.deleteMany();
  await banco().usuario.deleteMany();
}

export async function fecharBancoEmMemoria() {
  await encerrar();
  await pglite.close();
}
