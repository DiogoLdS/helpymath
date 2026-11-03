-- Banco inicial do HelpyMath no PostgreSQL (Neon).
-- Substitui as migrations antigas, que eram de MySQL (continuam no histórico do git).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "alternativa" (
    "id" SERIAL NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,

    CONSTRAINT "alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudo" (
    "titulo" TEXT NOT NULL,
    "tipo" INTEGER NOT NULL,
    "explicacao" TEXT,
    "conteudoId" SERIAL NOT NULL,

    CONSTRAINT "conteudo_pkey" PRIMARY KEY ("conteudoId")
);

-- CreateTable
CREATE TABLE "mapaconceitual" (
    "nome" TEXT NOT NULL,
    "nivel" VARCHAR(20) NOT NULL DEFAULT 'basico',
    "mapaId" SERIAL NOT NULL,

    CONSTRAINT "mapaconceitual_pkey" PRIMARY KEY ("mapaId")
);

-- CreateTable
CREATE TABLE "mapaconteudo" (
    "mapaId" INTEGER NOT NULL,
    "conteudoId" INTEGER NOT NULL,

    CONSTRAINT "mapaconteudo_pkey" PRIMARY KEY ("mapaId","conteudoId")
);

-- CreateTable
CREATE TABLE "questao" (
    "mapaId" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "enunciado" TEXT NOT NULL,
    "questaoId" SERIAL NOT NULL,

    CONSTRAINT "questao_pkey" PRIMARY KEY ("questaoId")
);

-- CreateTable
CREATE TABLE "usuario" (
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "usuarioId" SERIAL NOT NULL,
    "admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuarioId")
);

-- CreateTable
CREATE TABLE "usuarioconteudo" (
    "usuarioId" INTEGER NOT NULL,
    "conteudoId" INTEGER NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuarioconteudo_pkey" PRIMARY KEY ("usuarioId","conteudoId")
);

-- CreateTable
CREATE TABLE "usuarioquestao" (
    "usuarioId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "alternativaId" INTEGER NOT NULL,
    "correta" BOOLEAN NOT NULL,
    "respondidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarioquestao_pkey" PRIMARY KEY ("usuarioId","questaoId")
);

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_idx" ON "alternativa"("questaoId");

-- CreateIndex
CREATE INDEX "MapaConteudo_conteudoId_idx" ON "mapaconteudo"("conteudoId");

-- CreateIndex
CREATE INDEX "Questao_mapaId_idx" ON "questao"("mapaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "UsuarioConteudo_conteudoId_idx" ON "usuarioconteudo"("conteudoId");

-- CreateIndex
CREATE INDEX "UsuarioQuestao_questaoId_idx" ON "usuarioquestao"("questaoId");

-- AddForeignKey
ALTER TABLE "alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questao"("questaoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapaconteudo" ADD CONSTRAINT "MapaConteudo_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "conteudo"("conteudoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapaconteudo" ADD CONSTRAINT "MapaConteudo_mapaId_fkey" FOREIGN KEY ("mapaId") REFERENCES "mapaconceitual"("mapaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questao" ADD CONSTRAINT "Questao_mapaId_fkey" FOREIGN KEY ("mapaId") REFERENCES "mapaconceitual"("mapaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioconteudo" ADD CONSTRAINT "UsuarioConteudo_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "conteudo"("conteudoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioconteudo" ADD CONSTRAINT "UsuarioConteudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioquestao" ADD CONSTRAINT "UsuarioQuestao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarioquestao" ADD CONSTRAINT "UsuarioQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "questao"("questaoId") ON DELETE CASCADE ON UPDATE CASCADE;

