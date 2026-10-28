// Onde a rede atende. Hoje é Santa Catarina, e só (ADR 0009).
//
// Duas decisões moram neste arquivo:
//
// 1. A cidade é escolhida numa lista, e não digitada. Quando era texto livre,
//    "Joinville", "joinville" e "Joinvile" eram três cidades diferentes para o
//    sistema, porque a comparação é por igualdade exata — e uma ONG com um
//    deslize de digitação nunca apareceria para a coordenação nem veria as
//    doações da sua cidade.
// 2. A lista é curada e cresce por Pull Request. Ela não é a lista completa dos
//    295 municípios de SC: oferecer uma cidade onde a rede não tem doador nem
//    ONG só produz conta que não serve para nada. Acrescentar uma cidade é uma
//    linha aqui, e o PR fica como registro de "a rede chegou nesta cidade".
//
// O estado existe como campo próprio mesmo com um valor só, porque cidade sem
// estado é ambígua no Brasil: há município com o mesmo nome em estados
// diferentes. Quando a rede sair de SC, a mudança é acrescentar uma chave.

const REDE = {
  SC: {
    nome: 'Santa Catarina',
    cidades: [
      'Araquari',
      'Araranguá',
      'Balneário Camboriú',
      'Balneário Piçarras',
      'Barra Velha',
      'Biguaçu',
      'Blumenau',
      'Braço do Norte',
      'Brusque',
      'Caçador',
      'Camboriú',
      'Campos Novos',
      'Canoinhas',
      'Capivari de Baixo',
      'Chapecó',
      'Concórdia',
      'Corupá',
      'Criciúma',
      'Curitibanos',
      'Florianópolis',
      'Forquilhinha',
      'Fraiburgo',
      'Garopaba',
      'Garuva',
      'Gaspar',
      'Guaramirim',
      'Içara',
      'Imbituba',
      'Indaial',
      'Itajaí',
      'Itapema',
      'Ituporanga',
      'Jaraguá do Sul',
      'Joaçaba',
      'Joinville',
      'Lages',
      'Laguna',
      'Luiz Alves',
      'Mafra',
      'Massaranduba',
      'Navegantes',
      'Nova Veneza',
      'Orleans',
      'Palhoça',
      'Penha',
      'Pomerode',
      'Porto União',
      'Rio do Sul',
      'Rio Negrinho',
      'São Bento do Sul',
      'São Francisco do Sul',
      'São João Batista',
      'São José',
      'Schroeder',
      'Siderópolis',
      'Timbó',
      'Tijucas',
      'Tubarão',
      'Urussanga',
      'Videira',
      'Xanxerê'
    ]
  }
};

// Formato que a tela consome para montar os dois boxes.
export function localidades() {
  return Object.entries(REDE).map(([sigla, { nome, cidades }]) => ({ sigla, nome, cidades }));
}

export function estadoAtendido(estado) {
  return Object.hasOwn(REDE, estado);
}

export function cidadeAtendida(estado, cidade) {
  return estadoAtendido(estado) && REDE[estado].cidades.includes(cidade);
}
