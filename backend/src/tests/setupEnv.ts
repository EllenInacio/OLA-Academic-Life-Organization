import dotenv from "dotenv";

// Executa antes dos testes e aponta a conexao para o banco de teste.
dotenv.config({ path: ".env.test", override: true });
