import prisma from '../services/adapter.js';
import { progressoNoMapa } from '../services/progresso.js';

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        async criarQuestao(req, res) {
            try {
                const { mapaId, data, enunciado } = req.body;

                const novaQuestao = await prisma.questao.create({
                    data: {
                        mapaId: parseInt(mapaId),
                        data: new Date(data),
                        enunciado: enunciado
                    }
                });

                res.status(201).json(novaQuestao);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async atualizarQuestao(req, res) {
            try {
                const { id } = req.params;
                const { enunciado, data } = req.body;

                const questaoAtualizada = await prisma.questao.update({
                    where: { questaoId: parseInt(id) },
                    data: {
                        ...(enunciado !== undefined && { enunciado }),
                        ...(data !== undefined && { data: new Date(data) })
                    }
                });

                res.status(200).json(questaoAtualizada);
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Questão não encontrada");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async criarAlternativa(req, res) {
            try {
                const { id } = req.params;
                const { texto, letra, correta } = req.body;

                const novaAlternativa = await prisma.alternativa.create({
                    data: {
                        questaoId: parseInt(id),
                        texto: texto,
                        letra: letra,
                        correta: correta
                    }
                });

                res.status(201).json(novaAlternativa);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async listarQuestoesPorMapa(req, res) {
            try {
                const { mapaId } = req.params;

                // O aluno só vê as questões depois de concluir todos os conteúdos interativos do mapa.
                // Admin passa direto (precisa conferir as questões que cadastrou).
                if (!req.usuario.admin) {
                    const { pendentes } = await progressoNoMapa(parseInt(mapaId), req.usuario.usuarioId);

                    if (pendentes.length > 0) {
                        return res.status(403).json({
                            error: "Conclua todos os conteúdos do mapa antes de fazer as questões",
                            pendentes
                        });
                    }
                }

                const questoes = await prisma.questao.findMany({
                    where: { mapaId: parseInt(mapaId) },
                    select: {
                        questaoId: true,
                        enunciado: true,
                        data: true,
                        alternativa: {
                            select: {
                                id: true,
                                texto: true,
                                letra: true
                            }
                        }
                    }
                });

                res.status(200).json(questoes);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Versão do admin (tela de editar mapa): igual à listagem do aluno, mas também diz
        // qual alternativa é a correta. A do aluno esconde isso pra não entregar a resposta.
        async listarQuestoesAdmin(req, res) {
            try {
                const { mapaId } = req.params;

                const questoes = await prisma.questao.findMany({
                    where: { mapaId: parseInt(mapaId) },
                    orderBy: { questaoId: 'asc' },
                    select: {
                        questaoId: true,
                        enunciado: true,
                        data: true,
                        alternativa: {
                            orderBy: { letra: 'asc' },
                            select: {
                                id: true,
                                texto: true,
                                letra: true,
                                correta: true
                            }
                        }
                    }
                });

                res.status(200).json(questoes);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async deletarQuestao(req, res) {
            try {
                const { id } = req.params;
                const questaoId = parseInt(id);

                // O banco não deixa apagar a questão com alternativas ligadas (ON DELETE RESTRICT),
                // então apaga as alternativas antes. A transação garante que é tudo ou nada.
                await prisma.$transaction([
                    prisma.alternativa.deleteMany({ where: { questaoId: questaoId } }),
                    prisma.questao.delete({ where: { questaoId: questaoId } })
                ]);

                res.status(200).json("Questão removida com sucesso");
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Questão não encontrada");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async responderQuestao(req, res) {
            try {
                const { id } = req.params;
                const { alternativaId } = req.body;

                const alternativaEscolhida = await prisma.alternativa.findUnique({
                    where: { id: parseInt(alternativaId) }
                });

                if (!alternativaEscolhida || alternativaEscolhida.questaoId !== parseInt(id)) {
                    return res.status(404).json("Alternativa não encontrada para essa questão");
                }

                const alternativaCorreta = await prisma.alternativa.findFirst({
                    where: {
                        questaoId: parseInt(id),
                        correta: true
                    }
                });

                res.status(200).json({
                    correto: alternativaEscolhida.correta,
                    letraCorreta: alternativaCorreta ? alternativaCorreta.letra : null
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async atualizarAlternativa(req, res) {
            try {
                const { id } = req.params;
                const { texto, letra, correta } = req.body;

                const alternativaAtualizada = await prisma.alternativa.update({
                    where: { id: parseInt(id) },
                    data: {
                        ...(texto !== undefined && { texto }),
                        ...(letra !== undefined && { letra }),
                        ...(correta !== undefined && { correta })
                    }
                });

                res.status(200).json(alternativaAtualizada);
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Alternativa não encontrada");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async deletarAlternativa(req, res) {
            try {
                const { id } = req.params;

                await prisma.alternativa.delete({
                    where: { id: parseInt(id) }
                });

                res.status(200).json("Alternativa removida com sucesso");
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Alternativa não encontrada");
                }

                res.status(500).json("Internal server error!");
            }
        }
    }
}

export default controller;