import { criarApp } from './app.js';

const porta = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.warn('Aviso: DATABASE_URL não configurada. Só a rota de saúde vai funcionar. Veja o .env.example.');
}

criarApp().listen(porta, () => {
  console.log(`Prato Cheio rodando em http://localhost:${porta}`);
});
