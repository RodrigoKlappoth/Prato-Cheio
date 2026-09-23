import { encerrar } from '../src/db.js';
import { cadastrarOng } from '../src/usuarios.js';

const [nome, email, senha] = process.argv.slice(2);

try {
  const ong = await cadastrarOng({ nome, email, senha });
  console.log(`ONG criada: ${ong.nome} <${ong.email}>. Ela já pode entrar com esse e-mail e senha.`);
} catch (erro) {
  console.error(`Não deu para criar a ONG: ${erro.message}`);
  console.error('Uso: npm run ong:criar -- "Nome da ONG" email@da-ong.org senha-com-8-caracteres');
  process.exitCode = 1;
} finally {
  await encerrar();
}
