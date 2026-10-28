import { cadastrarCoordenacao } from '../src/usuarios.js';
import { criarContaPeloTerminal } from './criar-conta.js';

await criarContaPeloTerminal({
  oQue: 'a conta de coordenação',
  cadastrar: cadastrarCoordenacao,
  uso: 'npm run coordenacao:criar -- "Nome de quem coordena" email@pessoa.org senha-com-8-caracteres "Cidade"',
  aviso: (conta) =>
    `Coordenação de ${conta.cidade} criada: ${conta.nome} <${conta.email}>. Ela já pode aprovar as ONGs dessa cidade.`
});
