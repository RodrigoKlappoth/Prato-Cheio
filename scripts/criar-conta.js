import { encerrar } from '../src/db.js';

// Parte comum dos comandos que criam conta pelo terminal: ONG já aprovada
// (ong:criar) e coordenação (coordenacao:criar). Quem roda precisa do .env com
// a senha do banco, e é justamente por isso que o cadastro de ONG saiu daqui e
// foi para a tela, com aprovação da coordenação (ADR 0006 e ADR 0010).
export async function criarContaPeloTerminal({ oQue, cadastrar, uso, aviso }) {
  const [nome, email, senha, estado, cidade] = process.argv.slice(2);

  try {
    console.log(aviso(await cadastrar({ nome, email, senha, estado, cidade })));
  } catch (erro) {
    console.error(`Não deu para criar ${oQue}: ${erro.message}`);
    console.error(`Uso: ${uso}`);
    process.exitCode = 1;
  } finally {
    await encerrar();
  }
}
