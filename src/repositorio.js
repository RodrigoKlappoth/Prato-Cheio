import { banco } from './db.js';

export async function inserir({ tipo, quantidade, validade, doadorId }) {
  return banco().doacao.create({ data: { tipo, quantidade, validade, doador_id: doadorId } });
}

export async function listarDisponiveis() {
  const doacoes = await banco().doacao.findMany({
    where: { status: 'disponivel' },
    orderBy: { id: 'asc' },
    include: { publicada_por: { select: { nome: true } } }
  });
  return doacoes.map(({ publicada_por, ...doacao }) => ({ ...doacao, doador: publicada_por.nome }));
}

export async function buscarPorId(id) {
  return banco().doacao.findUnique({ where: { id } });
}

export async function aceitar(id, ong) {
  const { count } = await banco().doacao.updateMany({
    where: { id, status: 'disponivel' },
    data: { status: 'aceita', ong: ong.nome, ong_id: ong.id }
  });
  return count === 1 ? buscarPorId(id) : undefined;
}

export async function inserirUsuario({ nome, email, senhaHash, papel }) {
  return banco().usuario.create({ data: { nome, email, senha_hash: senhaHash, papel } });
}

export async function buscarUsuarioPorEmail(email) {
  return banco().usuario.findUnique({ where: { email } });
}

export async function inserirSessao({ token, usuarioId, expiraEm }) {
  await banco().sessao.create({ data: { token, usuario_id: usuarioId, expira_em: expiraEm } });
}

export async function buscarUsuarioPelaSessao(token, agora) {
  const sessao = await banco().sessao.findFirst({
    where: { token, expira_em: { gt: agora } },
    include: { usuario: true }
  });
  return sessao?.usuario;
}

export async function apagarSessao(token) {
  await banco().sessao.deleteMany({ where: { token } });
}
