import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

let prisma;

export function banco() {
  if (!prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada: copie o .env.example para .env e coloque o endereço do banco');
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }
  return prisma;
}

export function usarBanco(cliente) {
  prisma = cliente;
}

export async function encerrar() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
