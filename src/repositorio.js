import { banco } from './db.js';

export async function inserir({ tipo, quantidade, validade, doadorId, estado, cidade }) {
  return banco().doacao.create({
    data: { tipo, quantidade, validade, doador_id: doadorId, estado, cidade }
  });
}

// A validade é texto no formato AAAA-MM-DD, e por isso comparar como texto dá a
// mesma ordem que comparar como data: '2026-10-09' < '2026-10-10' (ADR 0007).
//
// A localidade filtrada é a da própria doação, copiada da conta do doador na
// publicação (ADR 0011). Era a da conta, pela relação publicada_por: a conta
// passou a poder mudar de cidade (H-09), e ler pela relação moveria para a
// outra cidade a doação já publicada — e, no histórico, a já retirada.
export async function listarDisponiveis(hoje, { estado, cidade }) {
  const doacoes = await banco().doacao.findMany({
    where: {
      status: 'disponivel',
      validade: { gte: hoje },
      estado,
      cidade
    },
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

// Doação que a conta ainda está segurando: o doador publicou e ninguém retirou;
// a ONG aceitou e ainda não confirmou a retirada. É o que impede a conta de
// mudar de cidade no meio do caminho (RN-07, ADR 0011).
export async function contarEmCirculacaoDoDoador(doadorId, hoje) {
  return banco().doacao.count({
    where: {
      doador_id: doadorId,
      OR: [{ status: 'disponivel', validade: { gte: hoje } }, { status: 'aceita' }]
    }
  });
}

export async function contarAceitesEmAbertoDaOng(ongId) {
  return banco().doacao.count({ where: { ong_id: ongId, status: 'aceita' } });
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

export async function inserirUsuario({ nome, email, senhaHash, papel, estado, cidade, situacao }) {
  return banco().usuario.create({
    data: { nome, email, senha_hash: senhaHash, papel, estado, cidade, situacao }
  });
}

export async function buscarUsuarioPorEmail(email) {
  return banco().usuario.findUnique({ where: { email } });
}

export async function buscarUsuarioPorId(id) {
  return banco().usuario.findUnique({ where: { id } });
}

// Atualiza só o que a pessoa pode corrigir na própria conta (RN-07, ADR 0011):
// e-mail, senha, papel e situação não entram nesta instrução.
export async function atualizarConta({ id, nome, estado, cidade }) {
  return banco().usuario.update({ where: { id }, data: { nome, estado, cidade } });
}

// O rastro da mudança de localidade da conta (RN-08, ADR 0012). Fica ao lado da
// atualização da conta porque as duas escritas contam a mesma mudança por dois
// lados: onde a pessoa está agora, e de onde ela saiu.
export async function inserirMudancaDeLocalidade({ contaId, de, para, mudadaEm }) {
  return banco().mudancaDeLocalidade.create({
    data: {
      conta_id: contaId,
      estado_anterior: de.estado,
      cidade_anterior: de.cidade,
      estado_novo: para.estado,
      cidade_novo: para.cidade,
      mudada_em: mudadaEm
    }
  });
}

// Mudanças de localidade das contas de ONG aprovadas, da mais antiga para a mais
// nova, com a conta de cada uma. Quais delas são alerta para a coordenação é
// decisão da regra, e não desta consulta: "depois da aprovação" compara duas
// colunas de tabelas diferentes, e o banco não sabe o que a frase significa.
export async function listarMudancasDeOngsAprovadas() {
  return banco().mudancaDeLocalidade.findMany({
    where: { conta: { papel: 'ong', situacao: 'aprovada' } },
    orderBy: [{ mudada_em: 'asc' }, { id: 'asc' }],
    include: {
      conta: {
        select: { id: true, nome: true, email: true, estado: true, cidade: true, avaliada_em: true, criado_em: true }
      }
    }
  });
}

export async function listarOngsPorSituacao(situacao) {
  return banco().usuario.findMany({
    where: { papel: 'ong', situacao },
    // Mais antigo primeiro, dentro de cada cidade: quem está esperando há mais
    // tempo aparece antes, e os pedidos da mesma cidade ficam juntos na tela.
    orderBy: [{ estado: 'asc' }, { cidade: 'asc' }, { criado_em: 'asc' }],
    select: {
      id: true,
      nome: true,
      email: true,
      estado: true,
      cidade: true,
      situacao: true,
      criado_em: true
    }
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
