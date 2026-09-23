import * as repo from './repositorio.js';
import { falha, texto, exigirCampos } from './regras.js';
import { exigirLogin, exigirPapel } from './usuarios.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

export async function criarDoacao(usuario, dados = {}) {
  exigirPapel(usuario, 'doador', 'só doadores publicam doações');

  const doacao = {
    tipo: texto(dados.tipo),
    quantidade: texto(dados.quantidade),
    validade: texto(dados.validade)
  };
  exigirCampos(doacao, CAMPOS_OBRIGATORIOS);

  return repo.inserir({ ...doacao, doadorId: usuario.id });
}

export async function listarDisponiveis(usuario) {
  exigirLogin(usuario);
  return repo.listarDisponiveis();
}

export async function aceitar(usuario, id) {
  exigirPapel(usuario, 'ong', 'só ONGs aceitam doações');

  const identificador = Number(id);
  if (!Number.isInteger(identificador) || identificador <= 0) {
    throw falha('id de doação inválido');
  }

  const aceita = await repo.aceitar(identificador, usuario);
  if (aceita) return aceita;

  const doacao = await repo.buscarPorId(identificador);
  if (!doacao) {
    throw falha('doação não encontrada');
  }
  throw falha(`esta doação já foi aceita por ${doacao.ong}`);
}
