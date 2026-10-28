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

export async function inserirUsuario({ nome, email, senhaHash, papel, cidade, situacao }) {
  return banco().usuario.create({
    data: { nome, email, senha_hash: senhaHash, papel, cidade, situacao }
  });
}

export async function buscarUsuarioPorEmail(email) {
  return banco().usuario.findUnique({ where: { email } });
}

export async function buscarUsuarioPorId(id) {
  return banco().usuario.findUnique({ where: { id } });
}

export async function listarOngsPorSituacao(situacao, cidade) {
  return banco().usuario.findMany({
    // O ?? null é proteção, não enfeite: no Prisma, uma cidade `undefined`
    // apagaria o filtro e devolveria os pedidos de todas as cidades.
    where: { papel: 'ong', situacao, cidade: cidade ?? null },
    orderBy: { criado_em: 'asc' },
    select: { id: true, nome: true, email: true, cidade: true, situacao: true, criado_em: true }
  });
}

export async function avaliarConta({ id, situacao, avaliadaEm, avaliadaPorId }) {
  return banco().usuario.update({
    where: { id },
    data: { situacao, avaliada_em: avaliadaEm, avaliada_por_id: avaliadaPorId }
  });
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
