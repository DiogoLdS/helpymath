-- Simulados: "mapas" do Treino que só têm questões e são feitos como prova (corrige tudo no fim).
-- Os mapas que já existem continuam sendo mapas conceituais comuns.

-- AlterTable
ALTER TABLE "mapaconceitual" ADD COLUMN     "simulado" BOOLEAN NOT NULL DEFAULT false;
