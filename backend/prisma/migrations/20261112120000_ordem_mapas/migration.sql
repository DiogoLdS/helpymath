-- Ordem dos mapas dentro do nível (o admin pode reordenar no painel).
-- Os mapas que já existem ficam na ordem em que foram criados (a mesma de antes).

-- AlterTable
ALTER TABLE "mapaconceitual" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

UPDATE "mapaconceitual" SET "ordem" = "mapaId";
