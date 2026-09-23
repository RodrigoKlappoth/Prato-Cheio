export default {
  test: {
    // Os testes usam um PostgreSQL em memória (PGlite), criado em tests/banco-em-memoria.js.
    // DATABASE_URL vazia garante que nenhum teste chegue ao banco de verdade no Neon.
    env: { DATABASE_URL: '' }
  }
};
