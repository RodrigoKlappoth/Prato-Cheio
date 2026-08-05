// Camada de dados do Prato Cheio — acesso ao banco.
// Só SQL aqui: nenhuma regra de negócio, nenhuma validação. Assim, quando a
// Unidade 3 trocar o SQLite pelo PostgreSQL, a mudança fica contida neste
// arquivo e no src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

/** Insere a doação e devolve a linha criada (com id e criada_em preenchidos pelo banco). */
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade)
          VALUES (?, ?, ?)
       RETURNING *`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}

/** Devolve apenas as doações ainda disponíveis, na ordem em que foram publicadas. */
export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT *
       FROM doacoes
      WHERE status = 'disponivel'
      ORDER BY id`
  );
  return rows;
}

/** Busca uma doação pelo id. Devolve undefined se não existir. */
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

/**
 * Marca a doação como aceita pela ONG e devolve a linha atualizada.
 * Devolve undefined se a doação não existe OU se já não estava disponível.
 *
 * O `AND status = 'disponivel'` é o que impede duas ONGs de aceitarem a mesma
 * doação: quem chega em segundo lugar não casa com o WHERE, o UPDATE não
 * altera nada e o RETURNING volta vazio. A decisão é do banco, em uma única
 * instrução atômica — não há janela entre "ler" e "escrever" para a corrida
 * acontecer, como haveria se fizéssemos SELECT e depois UPDATE.
 */
export async function aceitar(id, ong) {
  const { rows } = await query(
    `UPDATE doacoes
        SET status = 'aceita',
            ong    = ?
      WHERE id = ?
        AND status = 'disponivel'
  RETURNING *`,
    [ong, id]
  );
  return rows[0];
}
