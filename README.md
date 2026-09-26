# OLA — Organização da Vida Acadêmica

Plataforma web para estudantes universitários organizarem sua rotina acadêmica.
Projeto Final de Curso - Bacharelado em Engenharia de Software, Universidade de
Mogi das Cruzes (UMC).

Funcionalidades implementadas:

- **Calendário de provas e trabalhos**: cadastro, edição, exclusão e visualização
  de eventos acadêmicos vinculados a disciplinas.
- **Autenticação**: cadastro, login com senha e verificação em duas etapas
  (aplicativo autenticador ou código por e-mail), recuperação de senha e logout.
- **Controle de acesso**: todas as rotas do calendário exigem login, e cada
  usuário acessa somente as próprias disciplinas e eventos.
- **Auditoria**: registro de acessos e das ações realizadas no sistema.
- **LGPD**: Termos de Uso e Política de Privacidade, aceite registrado no
  cadastro, consulta, exportação, revogação do consentimento e exclusão da conta.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 19 + Vite + React Router |
| Back-end | Node.js + Express 5 + TypeScript |
| Banco de dados | PostgreSQL (ORM: Prisma 7) |
| API | REST (JSON) |
| Autenticação | JWT + verificação em duas etapas (TOTP e código por e-mail) |
| Segurança | Argon2id (senhas), AES-256-GCM (segredo 2FA), Helmet, limite de tentativas |
| E-mail | Nodemailer (SMTP do Gmail) |
| Testes | Jest + Supertest |
| Comunicação HTTP | axios |
| Validação | express-validator |

## Estrutura do projeto

```
docs/
└── integracao-api-externa.md    projeto lógico das integrações externas

OLA/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          histórico do banco
│   │   ├── schema.prisma        modelo de dados
│   │   └── seed.ts              usuário e dados de teste
│   ├── src/
│   │   ├── config/              conexão com o banco e variáveis de segurança
│   │   ├── controllers/         recebem a requisição e devolvem a resposta
│   │   ├── errors/              erro de negócio com código HTTP
│   │   ├── middlewares/         autenticação, limites, validação e erros
│   │   ├── models/              acesso ao banco via Prisma
│   │   ├── routes/              definição dos endpoints
│   │   ├── services/            regras de negócio, auditoria, LGPD e e-mail
│   │   ├── tests/               testes automatizados
│   │   ├── types/               tipos e constantes compartilhados
│   │   ├── utils/               senha, criptografia, códigos e tokens
│   │   ├── validators/          regras de validação dos campos
│   │   ├── app.ts               configuração do Express
│   │   └── server.ts            inicialização do servidor
│   ├── prisma.config.ts
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── public/                  logo
│   ├── src/
│   │   ├── components/          componentes de tela e rotas protegidas
│   │   ├── constants/           rótulos de tipo, status e auditoria
│   │   ├── contexts/            sessão do usuário
│   │   ├── hooks/               estado e comunicação com a API
│   │   ├── pages/               login, cadastro, 2FA, senha, calendário e privacidade
│   │   ├── services/            chamadas HTTP
│   │   └── styles/              identidade visual do OLA
│   ├── index.html
│   ├── vercel.json
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Modelo de dados

Um usuário possui várias disciplinas, e uma disciplina possui vários eventos.
Os registros de auditoria referenciam o usuário que realizou a ação.

**usuario**

| Campo | Tipo | Observação |
|---|---|---|
| id | SERIAL | chave primária |
| nome | VARCHAR(120) | obrigatório |
| email | VARCHAR(160) | único, obrigatório |
| senha_hash | TEXT | hash Argon2id |
| segredo_2fa | TEXT | segredo TOTP criptografado (AES-256-GCM) |
| versao_token | INTEGER | invalida os tokens no logout e na troca de senha |
| codigo_2fa_hash / codigo_2fa_expira_em | TEXT / TIMESTAMP | código 2FA por e-mail (hash SHA-256) |
| codigo_recuperacao_hash / codigo_recuperacao_expira_em | TEXT / TIMESTAMP | código de recuperação (hash SHA-256) |
| consentimento_em / consentimento_versao | TIMESTAMP / VARCHAR(10) | data e versão dos termos aceitos |
| consentimento_revogado_em | TIMESTAMP | preenchido na revogação |
| criado_em | TIMESTAMP | preenchido automaticamente |

**disciplina**

| Campo | Tipo | Observação |
|---|---|---|
| id | SERIAL | chave primária |
| nome | VARCHAR(120) | obrigatório, único por usuário |
| professor | VARCHAR(120) | opcional |
| usuario_id | INTEGER | chave estrangeira → usuario.id |
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

**log_auditoria**

| Campo | Tipo | Observação |
|---|---|---|
| id | SERIAL | chave primária |
| acao | VARCHAR(40) | ex.: LOGIN_SUCESSO, EVENTO_CRIADO |
| entidade / entidade_id | VARCHAR(40) / INTEGER | registro afetado, quando houver |
| detalhe | VARCHAR(255) | descrição da ação |
| ip | VARCHAR(45) | endereço de origem |
| usuario_id | INTEGER | chave estrangeira → usuario.id (fica nulo se a conta for excluída) |
| criado_em | TIMESTAMP | preenchido automaticamente |

Excluir um usuário exclui suas disciplinas e eventos (`ON DELETE CASCADE`). Os
registros de auditoria são apenas inseridos e consultados pela aplicação.

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
cd OLA/backend
npm install
cp .env.example .env
```

No Windows, troque a última linha por `copy .env.example .env`.

Edite o `.env`:

- `DATABASE_URL`: senha e porta do seu PostgreSQL (a porta padrão é 5432).
- `JWT_SECRET` e `ENCRYPTION_KEY`: gere valores com os comandos abaixo e cole no arquivo.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O primeiro resultado é o `JWT_SECRET`; o segundo (64 caracteres) é o `ENCRYPTION_KEY`.

- `GMAIL_USER` e `GMAIL_APP_PASSWORD` são opcionais em desenvolvimento. Sem eles, os
  códigos de verificação e de recuperação aparecem no terminal do back-end.

Crie as tabelas, os dados de teste e suba a API:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Se o banco já tiver disciplinas cadastradas antes da autenticação, a migration não
consegue vinculá-las a um usuário. Nesse caso, use `npx prisma migrate reset` (apaga
os dados locais e recria as tabelas) e depois `npx prisma db seed`.

A API responde em `http://localhost:3333`. Teste com
`http://localhost:3333/api/health`.

Para inspecionar os dados: `npx prisma studio`.

### 3. Front-end

Em outro terminal:

```bash
cd OLA/frontend
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.

> A porta 5173 precisa bater com o `CORS_ORIGIN` do back-end. Se o Vite subir em
> outra porta, o navegador bloqueia as requisições.

### 4. Usuário de teste

Criado pelo `npx prisma db seed`:

| Campo | Valor |
|---|---|
| E-mail | `estudante@example.com` |
| Senha | `Teste@2026` |

Na verificação em duas etapas, escolha **Receber por e-mail** e clique em
**Enviar Código**: sem Gmail configurado, o código aparece no terminal do back-end.
Para usar o aplicativo autenticador, cadastre a chave exibida pelo seed ou crie uma
conta nova e escaneie o QR Code.

O token de acesso fica apenas na memória da página: ao recarregar (F5), é preciso
entrar novamente.

## Rotas da API

Base: `http://localhost:3333/api`

**Autenticação (públicas)**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/cadastro` | Cadastra um usuário (exige `aceiteTermos: true`) |
| POST | `/auth/login` | Valida e-mail e senha e devolve o `tokenTemporario` |
| POST | `/auth/2fa/enviar-codigo` | Envia o código de verificação por e-mail |
| POST | `/auth/2fa/verificar` | Valida o código (`app` ou `email`) e devolve o token de acesso |
| POST | `/auth/recuperacao/solicitar` | Envia o código de recuperação |
| POST | `/auth/recuperacao/verificar` | Valida o código e devolve o `tokenRedefinicao` |
| POST | `/auth/recuperacao/redefinir` | Define a nova senha |

**Protegidas** (cabeçalho `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/logout` | Encerra a sessão |
| GET | `/disciplinas` | Lista as disciplinas do usuário em ordem alfabética |
| POST | `/disciplinas` | Cadastra uma disciplina |
| GET | `/eventos` | Lista os eventos do usuário ordenados por data |
| GET | `/eventos/:id` | Busca um evento |
| POST | `/eventos` | Cadastra um evento |
| PUT | `/eventos/:id` | Edita um evento |
| DELETE | `/eventos/:id` | Exclui um evento |
| GET | `/lgpd/dados` | Consulta os dados do titular |
| GET | `/lgpd/exportar` | Exporta os dados em JSON |
| GET | `/lgpd/logs` | Histórico de auditoria do usuário |
| POST | `/lgpd/revogar-consentimento` | Revoga o consentimento e encerra a sessão |
| DELETE | `/lgpd/conta` | Exclui a conta, as disciplinas e os eventos |

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

## Segurança e LGPD

- Senhas com hash Argon2id (64 MB de memória, 3 iterações, salt único).
- Segredo do aplicativo autenticador criptografado com AES-256-GCM.
- Códigos de 6 dígitos guardados como hash SHA-256, válidos por 15 minutos e de uso único.
- JWT assinado com HS256; o logout, a troca de senha e a revogação do consentimento
  invalidam os tokens já emitidos.
- Limite de tentativas por IP em login, verificação, recuperação e rotas LGPD.
- Cabeçalhos de segurança HTTP com Helmet e corpo das requisições limitado a 10 KB.
- Termos de Uso e Política de Privacidade exibidos no cadastro e na página
  **Privacidade e dados**, que reúne os direitos do titular (art. 18 da LGPD).

Ações registradas na auditoria: cadastro, tentativas de login, validação da senha,
falhas e sucesso da verificação em duas etapas, logout, etapas da recuperação de senha,
consulta e exportação de dados, revogação do consentimento, exclusão da conta, cadastro
de disciplina e cadastro, alteração e exclusão de eventos.

A documentação das integrações externas está em
[`docs/integracao-api-externa.md`](docs/integracao-api-externa.md).

## Testes

Os testes usam um banco separado para não afetar os dados de desenvolvimento.

```bash
cd OLA/backend
psql -U postgres -c "CREATE DATABASE ola_test;"
cp .env.test.example .env.test
npm run test:db
npm test
```

Relatório de cobertura: `npm run test:coverage`.

## Deploy

- Front-end (Vercel): definir `VITE_API_URL` com o endereço público da API. O
  `vercel.json` redireciona as rotas do React para o `index.html`.
- Back-end (Render): definir `DATABASE_URL`, `CORS_ORIGIN` (endereço do front-end),
  `JWT_SECRET`, `ENCRYPTION_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` e
  `NODE_ENV=production`, e executar `npx prisma migrate deploy` antes de iniciar.

## Escopo desta entrega

Implementado: cadastro de disciplinas, CRUD completo de eventos acadêmicos,
ordenação por data, autenticação com verificação em duas etapas, recuperação de
senha, controle de acesso por usuário, auditoria, funcionalidades da LGPD, validação
de campos e mensagens de erro e sucesso.

Previsto para as próximas etapas: controle de notas e frequência, dashboard e
assistente de preenchimento por chat.
