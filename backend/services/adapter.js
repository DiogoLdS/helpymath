import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Banco PostgreSQL no Neon. Os nomes das variáveis são os mesmos que o Neon entrega:
// - DATABASE_URL_POOLED: conexão "pooled" (host com "-pooler"), que aguenta melhor muitas conexões do servidor
// - DATABASE_URL: conexão direta (usada aqui só se a pooled não existir, ex: banco local)
// As URLs já trazem "sslmode=require", então o SSL vem da própria URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
