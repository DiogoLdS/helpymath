-- Enunciado e texto das alternativas passam de VARCHAR(191) para TEXT (até ~65 mil caracteres),
-- porque questões do ENEM costumam ter enunciados maiores que 191 caracteres.

-- AlterTable
ALTER TABLE `questao` MODIFY `enunciado` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `alternativa` MODIFY `texto` TEXT NOT NULL;
