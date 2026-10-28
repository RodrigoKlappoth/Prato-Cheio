import { banco, encerrar } from '../src/db.js';
import { cadastrarPeloSite, cadastrarOng, cadastrarCoordenacao } from '../src/usuarios.js';
import { criarDoacao, aceitar, confirmarRetirada } from '../src/doacoes.js';
import { hojeNaRede } from '../src/regras.js';

// Deixa o banco num estado bom para demonstrar o sistema: apaga tudo e recria
// contas e doações previsíveis, com a senha 12345678 em todas.
//
// Tudo aqui passa pelas regras de src/usuarios.js e src/doacoes.js, e não por
// INSERT direto. Então o seed não consegue criar um estado que o sistema não
// produziria — e, de quebra, é um teste de fumaça contra o banco de verdade.

const SENHA = '12345678';
const ESTADO = 'SC';
const JOINVILLE = 'Joinville';
const BLUMENAU = 'Blumenau';

function dia(deslocamento) {
  const meioDia = new Date(`${hojeNaRede()}T12:00:00Z`);
  meioDia.setUTCDate(meioDia.getUTCDate() + deslocamento);
  return meioDia.toISOString().slice(0, 10);
}

async function apagarTudo() {
  const antes = {
    sessoes: await banco().sessao.count(),
    doacoes: await banco().doacao.count(),
    contas: await banco().usuario.count()
  };
  await banco().sessao.deleteMany();
  await banco().doacao.deleteMany();
  await banco().usuario.deleteMany();
  console.log(`Apagados: ${antes.contas} contas, ${antes.doacoes} doações, ${antes.sessoes} sessões.`);
}

async function semear() {
  const marta = await cadastrarCoordenacao({
    nome: 'Marta Coordenação',
    email: 'marta@pratocheio.org',
    senha: SENHA,
    estado: ESTADO,
    cidade: JOINVILLE
  });

  const { usuario: paulo } = await cadastrarPeloSite({
    nome: 'Padaria do Seu Paulo',
    email: 'paulo@padaria.com',
    senha: SENHA,
    estado: ESTADO,
    cidade: JOINVILLE
  });

  const { usuario: mercado } = await cadastrarPeloSite({
    nome: 'Mercado Central de Blumenau',
    email: 'mercado@blumenau.com',
    senha: SENHA,
    estado: ESTADO,
    cidade: BLUMENAU
  });

  // ONG criada pela coordenação no terminal: nasce aprovada (ADR 0003).
  const bancoDeAlimentos = await cadastrarOng({
    nome: 'Banco de Alimentos',
    email: 'contato@bancodealimentos.org',
    senha: SENHA,
    estado: ESTADO,
    cidade: JOINVILLE
  });

  // ONG que se cadastrou na tela: nasce pendente, esperando aprovação (ADR 0006).
  const { usuario: cozinha } = await cadastrarPeloSite({
    nome: 'Cozinha da Vila',
    email: 'contato@cozinhadavila.org',
    senha: SENHA,
    estado: ESTADO,
    cidade: JOINVILLE,
    papel: 'ong'
  });

  // Pendente em outra cidade: serve para mostrar que a coordenação aprova
  // qualquer cidade da rede, e não só a dela (ADR 0010).
  const { usuario: casaDeApoio } = await cadastrarPeloSite({
    nome: 'Casa de Apoio de Blumenau',
    email: 'contato@casadeapoio.org',
    senha: SENHA,
    estado: ESTADO,
    cidade: BLUMENAU,
    papel: 'ong'
  });

  const esperando = await criarDoacao(paulo, {
    tipo: 'Pães do dia',
    quantidade: '30 unidades',
    validade: dia(1)
  });

  const venceHoje = await criarDoacao(paulo, {
    tipo: 'Sopa de legumes',
    quantidade: '10 porções',
    validade: dia(0)
  });

  const emBlumenau = await criarDoacao(mercado, {
    tipo: 'Frutas',
    quantidade: '2 caixas',
    validade: dia(2)
  });

  const aceitaAgora = await criarDoacao(paulo, {
    tipo: 'Arroz cozido',
    quantidade: '8 porções',
    validade: dia(2)
  });
  await aceitar(bancoDeAlimentos, aceitaAgora.id);

  const jaRetirada = await criarDoacao(paulo, {
    tipo: 'Salada de frutas',
    quantidade: '5 porções',
    validade: dia(3)
  });
  await aceitar(bancoDeAlimentos, jaRetirada.id);
  await confirmarRetirada(bancoDeAlimentos, jaRetirada.id);

  // Publicada anteontem com prazo para ontem: hoje está vencida. Continua no
  // banco e não aparece na lista — é a RN-03 para mostrar na demonstração.
  const vencida = await criarDoacao(
    paulo,
    { tipo: 'Risoto', quantidade: '6 porções', validade: dia(-1) },
    new Date(`${dia(-2)}T12:00:00Z`)
  );

  return { marta, paulo, mercado, bancoDeAlimentos, cozinha, casaDeApoio, esperando, venceHoje, emBlumenau, aceitaAgora, jaRetirada, vencida };
}

if (!process.argv.includes('--confirmar')) {
  console.error('Este comando APAGA todas as contas e doações do banco que está no .env.');
  console.error('Se é isso que você quer: npm run semear -- --confirmar');
  process.exitCode = 1;
} else {
  try {
    await apagarTudo();
    const semeado = await semear();

    console.log(`\nSenha de todas as contas: ${SENHA}\n`);
    console.log('  coordenação (admin)  marta@pratocheio.org            Joinville/SC');
    console.log('  doador               paulo@padaria.com               Joinville/SC');
    console.log('  doador               mercado@blumenau.com            Blumenau/SC');
    console.log('  ONG aprovada         contato@bancodealimentos.org    Joinville/SC');
    console.log('  ONG pendente         contato@cozinhadavila.org       Joinville/SC');
    console.log('  ONG pendente         contato@casadeapoio.org         Blumenau/SC');
    console.log('\nDoações em Joinville:');
    console.log(`  nº ${semeado.esperando.id} esperando uma ONG, retirar até ${semeado.esperando.validade}`);
    console.log(`  nº ${semeado.venceHoje.id} esperando uma ONG, vence HOJE (${semeado.venceHoje.validade})`);
    console.log(`  nº ${semeado.aceitaAgora.id} aceita pelo Banco de Alimentos, esperando a retirada`);
    console.log(`  nº ${semeado.jaRetirada.id} retirada confirmada`);
    console.log(`  nº ${semeado.vencida.id} vencida: está no banco e NÃO aparece na lista (RN-03)`);
    console.log('\nDoação em Blumenau:');
    console.log(`  nº ${semeado.emBlumenau.id} só aparece para ONG de Blumenau (RN-06)`);
  } catch (erro) {
    console.error(`Não deu para semear: ${erro.message}`);
    process.exitCode = 1;
  } finally {
    await encerrar();
  }
}
