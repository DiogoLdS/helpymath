-- Perguntas de boas-vindas: nível do aluno (escolhido ou sugerido pelo teste diagnóstico)
-- e quando ele terminou as perguntas.

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "boasVindasEm" TIMESTAMP(3),
ADD COLUMN     "nivel" VARCHAR(20);
