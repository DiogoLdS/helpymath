/*
  Warnings:

  - The primary key for the `conteudo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `conteudo` table. All the data in the column will be lost.
  - The primary key for the `mapaconceitual` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `mapaconceitual` table. All the data in the column will be lost.
  - The primary key for the `questao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `questao` table. All the data in the column will be lost.
  - The primary key for the `usuario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `usuario` table. All the data in the column will be lost.
  - Added the required column `conteudoId` to the `Conteudo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mapaId` to the `MapaConceitual` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questaoId` to the `Questao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `alternativa` DROP FOREIGN KEY `Alternativa_questaoId_fkey`;

-- DropForeignKey
ALTER TABLE `mapaconteudo` DROP FOREIGN KEY `MapaConteudo_conteudoId_fkey`;

-- DropForeignKey
ALTER TABLE `mapaconteudo` DROP FOREIGN KEY `MapaConteudo_mapaId_fkey`;

-- DropForeignKey
ALTER TABLE `questao` DROP FOREIGN KEY `Questao_mapaId_fkey`;

-- DropForeignKey
ALTER TABLE `usuarioconteudo` DROP FOREIGN KEY `UsuarioConteudo_conteudoId_fkey`;

-- DropForeignKey
ALTER TABLE `usuarioconteudo` DROP FOREIGN KEY `UsuarioConteudo_usuarioId_fkey`;

-- DropIndex
DROP INDEX `Alternativa_questaoId_fkey` ON `alternativa`;

-- DropIndex
DROP INDEX `MapaConteudo_conteudoId_fkey` ON `mapaconteudo`;

-- DropIndex
DROP INDEX `Questao_mapaId_fkey` ON `questao`;

-- DropIndex
DROP INDEX `UsuarioConteudo_conteudoId_fkey` ON `usuarioconteudo`;

-- AlterTable
ALTER TABLE `conteudo` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `conteudoId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`conteudoId`);

-- AlterTable
ALTER TABLE `mapaconceitual` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `mapaId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`mapaId`);

-- AlterTable
ALTER TABLE `questao` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `questaoId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`questaoId`);

-- AlterTable
ALTER TABLE `usuario` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `usuarioId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`usuarioId`);

-- AddForeignKey
ALTER TABLE `UsuarioConteudo` ADD CONSTRAINT `UsuarioConteudo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioConteudo` ADD CONSTRAINT `UsuarioConteudo_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`conteudoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapaConteudo` ADD CONSTRAINT `MapaConteudo_mapaId_fkey` FOREIGN KEY (`mapaId`) REFERENCES `MapaConceitual`(`mapaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapaConteudo` ADD CONSTRAINT `MapaConteudo_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`conteudoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questao` ADD CONSTRAINT `Questao_mapaId_fkey` FOREIGN KEY (`mapaId`) REFERENCES `MapaConceitual`(`mapaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alternativa` ADD CONSTRAINT `Alternativa_questaoId_fkey` FOREIGN KEY (`questaoId`) REFERENCES `Questao`(`questaoId`) ON DELETE RESTRICT ON UPDATE CASCADE;
