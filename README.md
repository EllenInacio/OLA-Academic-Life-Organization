# OLA — Organização da Vida Acadêmica

Plataforma web para estudantes universitários organizarem sua rotina acadêmica.
Projeto Final de Curso - Bacharelado em Engenharia de Software, Universidade de
Mogi das Cruzes (UMC).

Esta entrega implementa a primeira funcionalidade: **calendário de provas e
trabalhos**, com cadastro, edição, exclusão e visualização de eventos acadêmicos
vinculados a disciplinas.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 19 + Vite |
| Back-end | Node.js + Express 5 + TypeScript |
| Banco de dados | PostgreSQL (ORM: Prisma 7) |
| API | REST (JSON) |
| Testes | Jest + Supertest |
| Comunicação HTTP | axios |
| Validação | express-validator |

## Estrutura do projeto

```
OLA/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        modelo de dados
│   ├── src/
│   │   ├── config/              conexão com o banco
│   │   ├── controllers/         recebem a requisição e devolvem a resposta
│   │   ├── errors/              erro de negócio com código HTTP
│   │   ├── middlewares/         validação e tratamento de erros
│   │   ├── models/              acesso ao banco via Prisma
│   │   ├── routes/              definição dos endpoints
│   │   ├── services/            regras de negócio
│   │   ├── tests/               testes de integração da API
│   │   ├── types/               tipos compartilhados
│   │   ├── validators/          regras de validação dos campos
│   │   ├── app.ts               configuração do Express
│   │   └── server.ts            inicialização do servidor
│   ├── prisma.config.ts
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          componentes de tela
│   │   ├── constants/           rótulos de tipo e status
│   │   ├── hooks/               estado e comunicação com a API
│   │   ├── pages/               tela do calendário
│   │   ├── services/            chamadas HTTP
│   │   └── styles/              identidade visual do OLA
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Modelo de dados

Duas tabelas com relacionamento 1:N — uma disciplina possui vários eventos.

**disciplina**

| Campo | Tipo | Observação |
|---|---|---|
| id | SERIAL | chave primária |
| nome | VARCHAR(120) | único, obrigatório |
| professor | VARCHAR(120) | opcional |
| criado_em | TIMESTAMP | preenchido automaticamente |

**evento**

| Campo | Tipo | Observação |
|---|---|---|
| id | SERIAL | chave primária |
| titulo | VARCHAR(150) | obrigatório |
| tipo | ENUM | PROVA, TRABALHO ou ENTREGA |
| data | DATE | obrigatório |
| peso | DECIMAL(5,2) | obrigatório |
| status | ENUM | PENDENTE, EM_ANDAMENTO ou CONCLUIDO |
| disciplina_id | INTEGER | chave estrangeira → disciplina.id |
| criado_em | TIMESTAMP | preenchido automaticamente |
| atualizado_em | TIMESTAMP | atualizado automaticamente |

A chave estrangeira usa `ON DELETE CASCADE`: excluir uma disciplina exclui seus
eventos.

## Pré-requisitos

- Node.js 20 ou superior
- PostgreSQL 14 ou superior
- Git

## Como executar

### 1. Banco de dados

```bash
psql -U postgres -c "CREATE DATABASE ola;"
```

### 2. Back-end

```bash
cd backend
npm install
cp .env.example .env
```

No Windows, troque a última linha por `copy .env.example .env`.

Edite o `.env` com a senha do seu PostgreSQL:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5436/ola?schema=public"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

Crie as tabelas e suba a API:

```bash
npx prisma migrate dev --name init
npm run dev
```

A API responde em `http://localhost:3333`. Teste com
`http://localhost:3333/api/health`.

Para inspecionar os dados: `npx prisma studio`.

### 3. Front-end

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.

> A porta 5173 precisa bater com o `CORS_ORIGIN` do back-end. Se o Vite subir em
> outra porta, o navegador bloqueia as requisições.

## Rotas da API

Base: `http://localhost:3333/api`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/disciplinas` | Lista as disciplinas em ordem alfabética |
| POST | `/disciplinas` | Cadastra uma disciplina |
| GET | `/eventos` | Lista os eventos ordenados por data |
| GET | `/eventos/:id` | Busca um evento |
| POST | `/eventos` | Cadastra um evento |
| PUT | `/eventos/:id` | Edita um evento |
| DELETE | `/eventos/:id` | Exclui um evento |

Exemplo de corpo para criar um evento:

```json
{
  "titulo": "Prova 1",
  "tipo": "PROVA",
  "data": "2026-10-15",
  "peso": 3,
  "status": "PENDENTE",
  "disciplinaId": 1
}
```

Erros são devolvidos no formato `{ "erro": "mensagem" }`.

## Testes

Os testes usam um banco separado para não afetar os dados de desenvolvimento.

```bash
cd backend
psql -U postgres -c "CREATE DATABASE ola_test;"
cp .env.test.example .env.test
npm run test:db
npm test
```

Relatório de cobertura: `npm run test:coverage`.

## Escopo desta entrega

Implementado: cadastro de disciplinas, CRUD completo de eventos acadêmicos,
ordenação por data, validação de campos e mensagens de erro e sucesso.

Previsto para as próximas etapas: autenticação, controle de notas e frequência,
dashboard, auditoria e assistente de preenchimento por chat.
