-- Dificuldade do mapa: basico, intermediario, avancado ou treino.
-- Mapas que já existem ficam como "basico".

-- AlterTable
ALTER TABLE `mapaconceitual` ADD COLUMN `nivel` VARCHAR(20) NOT NULL DEFAULT 'basico';
