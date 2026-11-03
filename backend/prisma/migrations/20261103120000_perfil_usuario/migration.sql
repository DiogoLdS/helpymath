-- Perfil do usuário: data de cadastro, objetivo, meta semanal, anotações e cronograma,
-- e a data em que cada conteúdo foi concluído (histórico de estudos).

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "anotacoes" TEXT,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cronograma" JSONB,
ADD COLUMN     "metaSemanal" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "objetivo" VARCHAR(30);

-- AlterTable
ALTER TABLE "usuarioconteudo" ADD COLUMN     "concluidoEm" TIMESTAMP(3);

