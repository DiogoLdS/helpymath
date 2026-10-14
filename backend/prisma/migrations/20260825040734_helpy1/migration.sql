/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conteudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `tipo` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MapaConceitual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioConteudo` (
    `usuarioId` INTEGER NOT NULL,
    `conteudoId` INTEGER NOT NULL,
    `concluido` BOOLEAN NOT NULL,

    PRIMARY KEY (`usuarioId`, `conteudoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MapaConteudo` (
    `mapaId` INTEGER NOT NULL,
    `conteudoId` INTEGER NOT NULL,

    PRIMARY KEY (`mapaId`, `conteudoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Questao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mapaId` INTEGER NOT NULL,
    `data` DATE NOT NULL,
    `enunciado` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alternativa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questaoId` INTEGER NOT NULL,
    `texto` VARCHAR(191) NOT NULL,
    `letra` VARCHAR(191) NOT NULL,
    `correta` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UsuarioConteudo` ADD CONSTRAINT `UsuarioConteudo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioConteudo` ADD CONSTRAINT `UsuarioConteudo_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapaConteudo` ADD CONSTRAINT `MapaConteudo_mapaId_fkey` FOREIGN KEY (`mapaId`) REFERENCES `MapaConceitual`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MapaConteudo` ADD CONSTRAINT `MapaConteudo_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questao` ADD CONSTRAINT `Questao_mapaId_fkey` FOREIGN KEY (`mapaId`) REFERENCES `MapaConceitual`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alternativa` ADD CONSTRAINT `Alternativa_questaoId_fkey` FOREIGN KEY (`questaoId`) REFERENCES `Questao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
