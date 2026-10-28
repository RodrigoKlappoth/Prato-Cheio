import * as repo from './repositorio.js';
import { falha, texto, identificador, exigirCampos, hojeNaRede, diaValido } from './regras.js';
import { exigirLogin, exigirPapel, exigirOngAprovada } from './usuarios.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

// Todas as funções recebem o "agora" como parâmetro, com o relógio do servidor
// como valor padrão (decisão D1, ADR 0007). É o que deixa a RN-03 testável sem
// que o teste dependa do dia em que ele roda.
export async function criarDoacao(usuario, dados = {}, agora = new Date()) {
  exigirPapel(usuario, 'doador', 'só doadores publicam doações');

  const doacao = {
    tipo: texto(dados.tipo),
    quantidade: texto(dados.quantidade),
    validade: texto(dados.validade)
  };
  exigirCampos(doacao, CAMPOS_OBRIGATORIOS);

  if (!diaValido(doacao.validade)) {
    throw falha('prazo de retirada inválido: informe um dia, como 2026-10-28');
  }
  if (doacao.validade < hojeNaRede(agora)) {
    throw falha('prazo de retirada já vencido');
  }

  return repo.inserir({ ...doacao, doadorId: usuario.id });
}

export async function listarDisponiveis(usuario, agora = new Date()) {
  exigirLogin(usuario);
  return repo.listarDisponiveis(hojeNaRede(agora));
}

// O que já aconteceu: o doador vê o que publicou e quem levou; a ONG vê o que
// aceitou e o que já retirou (H-07).
export async function listarRecentes(usuario) {
  exigirLogin(usuario);
  if (usuario.papel === 'doador') return repo.listarPublicadasPor(usuario.id);
  if (usuario.papel === 'ong') return repo.listarAceitasPor(usuario.id);
  throw falha('só doador e ONG têm histórico de doações', 403);
}

export async function aceitar(usuario, id, agora = new Date()) {
  exigirOngAprovada(usuario);
  const doacaoId = identificador(id, 'doação');

  const aceita = await repo.aceitar(doacaoId, usuario, hojeNaRede(agora), agora);
  if (aceita) return aceita;

  // O aceite é uma única instrução, que só altera a doação se ela ainda estiver
  // disponível e no prazo (RN-02, RN-03). Se não alterou nada, descobrimos por quê.
  const doacao = await repo.buscarPorId(doacaoId);
  if (!doacao) {
    throw falha('doação não encontrada');
  }
  if (doacao.status === 'aceita') {
    throw falha(`esta doação já foi aceita por ${doacao.ong}`);
  }
  if (doacao.status === 'retirada') {
    throw falha(`esta doação já foi retirada por ${doacao.ong}`);
  }
  throw falha('prazo de retirada vencido');
}

// A ordem destas três verificações importa. A doação disponível vem primeiro
// porque ela não tem ONG nenhuma, e cair na verificação de dono daria a mensagem
// errada; depois vem o dono, para não contar a uma ONG o que aconteceu com a
// doação de outra; e só então o estado.
async function exigirDoacaoAceitaPor(ong, id) {
  const doacao = await repo.buscarPorId(identificador(id, 'doação'));
  if (!doacao) {
    throw falha('doação não encontrada');
  }
  if (doacao.status === 'disponivel') {
    throw falha('esta doação não está aceita por ninguém');
  }
  if (doacao.ong_id !== ong.id) {
    throw falha('esta doação não foi aceita por você', 403);
  }
  if (doacao.status === 'retirada') {
    throw falha('esta retirada já foi confirmada');
  }
  return doacao;
}

// Confirmar a retirada fecha a conta do OBJ-01: é dela que sai a mediana de
// horas entre a publicação e a comida sair da porta do doador (ADR 0008).
export async function confirmarRetirada(usuario, id, agora = new Date()) {
  exigirOngAprovada(usuario);
  const doacao = await exigirDoacaoAceitaPor(usuario, id);
  return repo.registrarRetirada(doacao.id, agora);
}

// A saída para a ONG que aceitou e não vai buscar: a doação volta para a lista
// das outras em vez de vencer reservada (risco da análise, INC-05).
// Aqui basta ser a ONG que aceitou, sem exigir conta aprovada: se a coordenação
// desaprovar a conta depois do aceite, ela ainda precisa poder devolver a
// comida para a lista, que é o que interessa ao OBJ-02.
export async function cancelarAceite(usuario, id) {
  exigirPapel(usuario, 'ong', 'só a ONG que aceitou cancela o aceite');
  const doacao = await exigirDoacaoAceitaPor(usuario, id);
  return repo.devolverParaDisponivel(doacao.id);
}
