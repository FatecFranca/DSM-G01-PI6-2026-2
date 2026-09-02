# SportArena 🏃‍♂️

E-commerce de artigos esportivos — NestJS + Prisma + Next.js.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js 15, TailwindCSS 4, TanStack Query, Zustand |
| API | NestJS, Prisma, JWT, Swagger |
| Banco | PostgreSQL |

## Estrutura

```
SportArena/
├── apps/
│   ├── web/     # Next.js — loja, carrinho, compras
│   └── api/     # NestJS + Swagger
├── packages/
│   ├── database/
│   ├── types/
│   └── utils/
```

## Setup

```bash
cd SportArena
npm install

# Copie os arquivos de exemplo e ajuste a senha do Postgres
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm run db:generate
npm run db:push
npm run db:seed

npm run dev
```

## URLs

- Web: http://localhost:3003
- API: http://localhost:3002/api
- Swagger: http://localhost:3002/api/docs

## Portas

- Web: **3003**
- API: **3002**
