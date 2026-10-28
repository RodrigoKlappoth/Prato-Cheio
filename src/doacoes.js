import * as repo from './repositorio.js';
import { falha, texto, identificador, exigirCampos } from './regras.js';
import { exigirLogin, exigirPapel, exigirOngAprovada } from './usuarios.js';

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
  exigirOngAprovada(usuario);

  const doacaoId = identificador(id, 'doação');

  const aceita = await repo.aceitar(doacaoId, usuario);
  if (aceita) return aceita;

  const doacao = await repo.buscarPorId(doacaoId);
  if (!doacao) {
    throw falha('doação não encontrada');
  }
  throw falha(`esta doação já foi aceita por ${doacao.ong}`);
}
