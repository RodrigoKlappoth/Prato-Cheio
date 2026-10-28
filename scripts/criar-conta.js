import { encerrar } from '../src/db.js';

// Parte comum dos comandos que criam conta pelo terminal: ONG (ong:criar) e
// coordenação de uma cidade (coordenacao:criar). Quem roda precisa do .env com
// a senha do banco, e é justamente por isso que o cadastro de ONG saiu daqui e
// foi para a tela, com aprovação da coordenação da cidade (ADR 0006).
export async function criarContaPeloTerminal({ oQue, cadastrar, uso, aviso }) {
  const [nome, email, senha, cidade] = process.argv.slice(2);

  try {
    console.log(aviso(await cadastrar({ nome, email, senha, cidade })));
  } catch (erro) {
    console.error(`Não deu para criar ${oQue}: ${erro.message}`);
    console.error(`Uso: ${uso}`);
    process.exitCode = 1;
  } finally {
    await encerrar();
  }
}
