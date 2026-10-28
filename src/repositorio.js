import { banco } from './db.js';

export async function inserir({ tipo, quantidade, validade, doadorId }) {
  return banco().doacao.create({ data: { tipo, quantidade, validade, doador_id: doadorId } });
}

// A validade é texto no formato AAAA-MM-DD, e por isso comparar como texto dá a
// mesma ordem que comparar como data: '2026-10-09' < '2026-10-10' (ADR 0007).
export async function listarDisponiveis(hoje) {
  const doacoes = await banco().doacao.findMany({
    where: { status: 'disponivel', validade: { gte: hoje } },
    orderBy: { id: 'asc' },
    include: { publicada_por: { select: { nome: true } } }
  });
  return doacoes.map(comNomeDoDoador);
}

export async function listarPublicadasPor(doadorId) {
  const doacoes = await banco().doacao.findMany({
    where: { doador_id: doadorId },
    orderBy: { id: 'desc' },
    include: { publicada_por: { select: { nome: true } } }
  });
  return doacoes.map(comNomeDoDoador);
}

export async function listarAceitasPor(ongId) {
  const doacoes = await banco().doacao.findMany({
    where: { ong_id: ongId },
    orderBy: { id: 'desc' },
    include: { publicada_por: { select: { nome: true } } }
  });
  return doacoes.map(comNomeDoDoador);
}

function comNomeDoDoador({ publicada_por, ...doacao }) {
  return { ...doacao, doador: publicada_por.nome };
}

export async function buscarPorId(id) {
  return banco().doacao.findUnique({ where: { id } });
}

export async function aceitar(id, ong, hoje, agora) {
  const { count } = await banco().doacao.updateMany({
    where: { id, status: 'disponivel', validade: { gte: hoje } },
    data: { status: 'aceita', ong: ong.nome, ong_id: ong.id, aceita_em: agora }
  });
  return count === 1 ? buscarPorId(id) : undefined;
}

export async function registrarRetirada(id, agora) {
  return banco().doacao.update({
    where: { id },
    data: { status: 'retirada', retirada_em: agora }
  });
}

export async function devolverParaDisponivel(id) {
  return banco().doacao.update({
    where: { id },
    data: { status: 'disponivel', ong: null, ong_id: null, aceita_em: null }
  });
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
