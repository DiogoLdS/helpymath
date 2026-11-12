-- Resolução comentada e fonte (ex: "ENEM 2023") de cada questão.
-- resolucaoVistaEm: quando o aluno abriu a resolução depois de errar. Por 24 horas ele não pode
-- refazer essa questão (senão bastaria ler a resposta e responder de novo para bater a meta do mapa);
-- depois disso ela volta a valer, pela página das questões ou pela Revisar.

-- AlterTable
ALTER TABLE "questao" ADD COLUMN     "resolucao" TEXT,
ADD COLUMN     "fonte" VARCHAR(60);

-- AlterTable
ALTER TABLE "usuarioquestao" ADD COLUMN     "resolucaoVistaEm" TIMESTAMP(3);
