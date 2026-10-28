// A rede é de São Paulo e a função da Vercel roda em UTC (ADR 0002): às 23h de
// São Paulo já é o dia seguinte em UTC. Usar o relógio cru faria uma doação
// vencer três horas antes da meia-noite de quem a publicou (ADR 0007).
const FUSO_DA_REDE = 'America/Sao_Paulo';
const FORMATO_DO_DIA = /^\d{4}-\d{2}-\d{2}$/;

export function falha(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function identificador(valor, oQue) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw falha(`id de ${oQue} inválido`);
  }
  return numero;
}

// O dia de hoje na cidade da rede, no formato AAAA-MM-DD. Recebe o "agora"
// como parâmetro para que o teste possa fixar a data em vez de depender do dia
// em que ele roda (decisão D1, ADR 0007).
export function hojeNaRede(agora = new Date()) {
  return agora.toLocaleDateString('en-CA', { timeZone: FUSO_DA_REDE });
}

export function diaValido(valor) {
  if (!FORMATO_DO_DIA.test(valor)) return false;
  // O formato não basta: new Date('2026-02-31') não dá erro, vira 3 de março.
  // Só aceitamos o dia se ele voltar igual ao que entrou.
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function exigirCampos(dados, campos) {
  const faltando = campos.filter((campo) => !dados[campo]);
  if (faltando.length > 0) {
    throw falha(`campos obrigatórios não preenchidos: ${faltando.join(', ')}`);
  }
}
