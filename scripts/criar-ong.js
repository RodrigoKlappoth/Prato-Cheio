import { cadastrarOng } from '../src/usuarios.js';
import { criarContaPeloTerminal } from './criar-conta.js';

await criarContaPeloTerminal({
  oQue: 'a ONG',
  cadastrar: cadastrarOng,
  uso: 'npm run ong:criar -- "Nome da ONG" email@da-ong.org senha-com-8-caracteres SC "Joinville"',
  aviso: (ong) =>
    `ONG criada e já aprovada em ${ong.cidade}/${ong.estado}: ${ong.nome} <${ong.email}>. Ela já pode entrar e aceitar doações.`
});
