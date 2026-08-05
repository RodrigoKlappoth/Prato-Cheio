import * as repo from './repositorio.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function criarDoacao(dados = {}) {
  const doacao = {
    tipo: texto(dados.tipo),
    quantidade: texto(dados.quantidade),
    validade: texto(dados.validade)
  };

  const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !doacao[campo]);
  if (faltando.length > 0) {
    throw new Error(`campos obrigatórios não preenchidos: ${faltando.join(', ')}`);
  }

  return repo.inserir(doacao);
}

export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

export async function aceitar(id, ong) {
  const identificador = Number(id);
  if (!Number.isInteger(identificador) || identificador <= 0) {
    throw new Error('id de doação inválido');
  }

  const nomeDaOng = texto(ong);
  if (!nomeDaOng) {
    throw new Error('a ONG precisa se identificar para aceitar uma doação');
  }

  const aceita = await repo.aceitar(identificador, nomeDaOng);
  if (aceita) return aceita;

  const doacao = await repo.buscarPorId(identificador);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  throw new Error(`esta doação já foi aceita por ${doacao.ong}`);
}
