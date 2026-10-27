-- Respostas dos alunos às questões (usada pra saber se ele acertou 60% e liberar o próximo mapa)

-- CreateTable
CREATE TABLE `usuarioquestao` (
    `usuarioId` INTEGER NOT NULL,
    `questaoId` INTEGER NOT NULL,
    `alternativaId` INTEGER NOT NULL,
    `correta` BOOLEAN NOT NULL,
    `respondidaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UsuarioQuestao_questaoId_fkey`(`questaoId`),
    PRIMARY KEY (`usuarioId`, `questaoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarioquestao` ADD CONSTRAINT `UsuarioQuestao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarioquestao` ADD CONSTRAINT `UsuarioQuestao_questaoId_fkey` FOREIGN KEY (`questaoId`) REFERENCES `questao`(`questaoId`) ON DELETE CASCADE ON UPDATE CASCADE;

