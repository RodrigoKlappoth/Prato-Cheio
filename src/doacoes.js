// Regras de negócio das doações.
// Este arquivo não conhece SQL nem HTTP: recebe dados, aplica as regras do caso
// e delega a persistência ao repositório. Erros de regra são lançados como
// Error e viram 400 na camada de rotas (src/app.js).
import * as repo from './repositorio.js';

const OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

/** Normaliza um campo de texto vindo do formulário: sem espaços nas pontas. */
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao(dados = {}) {
  const doacao = {
    tipo: texto(dados.tipo),
    quantidade: texto(dados.quantidade),
    validade: texto(dados.validade)
  };

  const faltando = OBRIGATORIOS.filter((campo) => !doacao[campo]);
  if (faltando.length > 0) {
    throw new Error(`campos obrigatórios não preenchidos: ${faltando.join(', ')}`);
  }

  return repo.inserir(doacao);
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong) {
  const identificador = Number(id);
  if (!Number.isInteger(identificador) || identificador <= 0) {
    throw new Error('id de doação inválido');
  }

  const nome = texto(ong);
  if (!nome) {
    throw new Error('a ONG precisa se identificar para aceitar uma doação');
  }

  const aceita = await repo.aceitar(identificador, nome);
  if (aceita) return aceita;

  // Não atualizou nada. Duas causas possíveis — e o doador merece saber qual.
  const doacao = await repo.buscarPorId(identificador);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  throw new Error(`esta doação já foi aceita por ${doacao.ong}`);
}
