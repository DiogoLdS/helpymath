import prisma from '../services/adapter.js';
import { progressoNoMapa, resultadoQuestoes, situacaoDosMapas, situacaoDoMapa } from '../services/progresso.js';

// Dificuldades possíveis de um mapa (as mesmas dos cards da página inicial)
const NIVEIS = ['basico', 'intermediario', 'avancado', 'treino'];

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // CU10 - Admin cria um novo mapa conceitual
        async criarMapa(req, res) {
            try {
                const { nome, nivel } = req.body;

                if (nivel !== undefined && !NIVEIS.includes(nivel)) {
                    return res.status(400).json("Nível inválido");
                }

                const novoMapa = await prisma.mapaconceitual.create({
                    // Sem nível informado, o banco usa "basico"
                    data: { nome: nome, ...(nivel !== undefined && { nivel }) }
                });

                res.status(201).json(novoMapa);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async listarMapas(req, res) {
            try {
                // Cada mapa vem com "liberado" e "concluido" pro usuário logado, na ordem da sequência
                const mapas = await situacaoDosMapas(req.usuario.usuarioId, req.usuario.admin);

                res.status(200).json(mapas);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async buscarMapa(req, res) {
            try {
                const { id } = req.params;

                const mapa = await prisma.mapaconceitual.findUnique({
                    where: { mapaId: parseInt(id) },
                    include: {
                        mapaconteudo: {
                            orderBy: { conteudoId: 'asc' },
                            include: {
                                conteudo: true
                            }
                        }
                    }
                });

                if (!mapa) {
                    return res.status(404).json("Mapa não encontrado");
                }

                // Mapa da sequência que o aluno ainda não liberou (precisa concluir o anterior do nível)
                const situacao = await situacaoDoMapa(mapa.mapaId, req.usuario.usuarioId, req.usuario.admin);
                if (!situacao.liberado) {
                    return res.status(403).json({
                        error: "Conclua o mapa anterior para liberar este",
                        bloqueado: true,
                        anterior: situacao.anterior
                    });
                }

                const mapaInfo = {
                    mapaId: mapa.mapaId,
                    nome: mapa.nome,
                    nivel: mapa.nivel,
                    conteudos: mapa.mapaconteudo.map((mc) => mc.conteudo)
                };

                res.status(200).json(mapaInfo);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Progresso do usuário logado nesse mapa: { concluidos, pendentes, total }
        async progressoMapa(req, res) {
            try {
                const mapaId = parseInt(req.params.id);
                const { usuarioId, admin } = req.usuario;

                const progresso = await progressoNoMapa(mapaId, usuarioId);
                const questoes = await resultadoQuestoes(mapaId, usuarioId);
                const situacao = await situacaoDoMapa(mapaId, usuarioId, admin);

                res.status(200).json({
                    ...progresso,
                    questoes,
                    concluido: situacao?.concluido ?? false,
                    proximo: situacao?.proximo ?? null,
                    // Mapa que vem antes na sequência do nível (null no primeiro): botão "Mapa anterior"
                    anterior: situacao?.anterior ?? null
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async atualizarMapa(req, res) {
            try {
                const { id } = req.params;
                const { nome, nivel } = req.body;

                if (nivel !== undefined && !NIVEIS.includes(nivel)) {
                    return res.status(400).json("Nível inválido");
                }

                // Só altera os campos enviados
                const mapaAtualizado = await prisma.mapaconceitual.update({
                    where: { mapaId: parseInt(id) },
                    data: {
                        ...(nome !== undefined && { nome }),
                        ...(nivel !== undefined && { nivel })
                    }
                });

                res.status(200).json(mapaAtualizado);
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Mapa não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },

        async deletarMapa(req, res) {
            try {
                const { id } = req.params;
                const mapaId = parseInt(id);

                // O banco não deixa apagar o mapa enquanto algo aponta pra ele (ON DELETE RESTRICT),
                // então apaga antes, na ordem certa: alternativas -> questões -> vínculos com conteúdos -> mapa.
                // Os conteúdos em si ficam, porque podem estar sendo usados em outros mapas.
                // A transação garante que, se algum passo falhar, nada é apagado.
                await prisma.$transaction([
                    prisma.alternativa.deleteMany({ where: { questao: { mapaId: mapaId } } }),
                    prisma.questao.deleteMany({ where: { mapaId: mapaId } }),
                    prisma.mapaconteudo.deleteMany({ where: { mapaId: mapaId } }),
                    prisma.mapaconceitual.delete({ where: { mapaId: mapaId } })
                ]);

                res.status(200).json("Mapa removido com sucesso");
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Mapa não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async adicionarConteudo(req, res) {
            try {
                const { id } = req.params;
                const { conteudoId } = req.body;

                const vinculo = await prisma.mapaconteudo.create({
                    data: {
                        mapaId: parseInt(id),
                        conteudoId: parseInt(conteudoId)
                    }
                });

                res.status(201).json(vinculo);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },

        async removerConteudo(req, res) {
            try {
                const { id, conteudoId } = req.params;

                await prisma.mapaconteudo.delete({
                    where: {
                        mapaId_conteudoId: {
                            mapaId: parseInt(id),
                            conteudoId: parseInt(conteudoId)
                        }
                    }
                });

                res.status(200).json("Conteúdo removido do mapa");
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Vínculo não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        }
    }
}

export default controller;