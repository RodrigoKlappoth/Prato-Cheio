export function falha(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

export function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function exigirCampos(dados, campos) {
  const faltando = campos.filter((campo) => !dados[campo]);
  if (faltando.length > 0) {
    throw falha(`campos obrigatórios não preenchidos: ${faltando.join(', ')}`);
  }
}
