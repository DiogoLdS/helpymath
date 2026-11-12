import prisma from '../services/adapter.js';
import { progressoNoMapa, resultadoQuestoes, situacaoDoMapa } from '../services/progresso.js';
import { liberadaEm, mensagemEspera, validarCamposQuestao } from '../services/resolucao.js';
import { ErroIA, gerarResolucao, registrarPedido, validarPedido } from '../services/iaResolucao.js';

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        async criarQuestao(req, res) {
            try {
                const { mapaId, data, enunciado, resolucao, fonte } = req.body;

                const campos = validarCamposQuestao({ resolucao, fonte });
                if (campos.erro) return res.status(400).json({ error: campos.erro });

                const novaQuestao = await prisma.questao.create({
                    data: {
                        mapaId: parseInt(mapaId),
                        data: new Date(data),
                        enunciado: enunciado,
                        ...campos.dados
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
                const { enunciado, data, resolucao, fonte } = req.body;

                const campos = validarCamposQuestao({ resolucao, fonte });
                if (campos.erro) return res.status(400).json({ error: campos.erro });

                const questaoAtualizada = await prisma.questao.update({
                    where: { questaoId: parseInt(id) },
                    data: {
                        ...(enunciado !== undefined && { enunciado }),
                        ...(data !== undefined && { data: new Date(data) }),
                        ...campos.dados
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
                // Visitante (sem conta) vê as questões direto: não há conteúdos concluídos pra conferir
                if (req.usuario && !req.usuario.admin) {
                    const situacao = await situacaoDoMapa(parseInt(mapaId), req.usuario.usuarioId, false);
                    if (!situacao || !situacao.liberado) {
                        return res.status(403).json({ error: "Este mapa ainda está bloqueado", bloqueado: true });
                    }

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
                        fonte: true,
                        resolucao: true,
                        alternativa: {
                            select: {
                                id: true,
                                texto: true,
                                letra: true
                            }
                        }
                    }
                });

                // A resolução não vai junto (entregaria a resposta): só se a questão tem uma
                res.status(200).json(questoes.map(({ resolucao, ...questao }) => ({
                    ...questao,
                    temResolucao: Boolean(resolucao)
                })));
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
                        resolucao: true,
                        fonte: true,
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

                const questaoId = parseInt(id);

                // Visitante: só corrige, sem salvar nada (não há conta pra guardar a resposta)
                if (!req.usuario) {
                    const correta = alternativaEscolhida.correta
                        ? await prisma.alternativa.findFirst({ where: { questaoId, correta: true } })
                        : null;
                    const questaoVisitante = alternativaEscolhida.correta
                        ? await prisma.questao.findUnique({ where: { questaoId }, select: { resolucao: true } })
                        : null;
                    return res.status(200).json({
                        correto: alternativaEscolhida.correta,
                        letraCorreta: correta ? correta.letra : null,
                        resolucao: questaoVisitante?.resolucao ?? null,
                        resultado: null,
                        mapaConcluido: false,
                        proximo: null,
                        visitante: true
                    });
                }

                const { usuarioId, admin } = req.usuario;
                const questao = await prisma.questao.findUnique({
                    where: { questaoId },
                    select: { mapaId: true, resolucao: true }
                });

                // Quem viu a resolução depois de errar espera um pouco antes de refazer (ver services/resolucao.js)
                const anterior = await prisma.usuarioquestao.findUnique({
                    where: { usuarioId_questaoId: { usuarioId, questaoId } },
                    select: { resolucaoVistaEm: true }
                });
                const libera = liberadaEm(anterior?.resolucaoVistaEm);
                if (libera && !admin) {
                    return res.status(409).json({ error: mensagemEspera(libera), liberadaEm: libera });
                }

                // Só responde quem já concluiu os conteúdos do mapa (admin passa direto)
                if (!admin) {
                    const { pendentes } = await progressoNoMapa(questao.mapaId, usuarioId);
                    if (pendentes.length > 0) {
                        return res.status(403).json({ error: "Conclua todos os conteúdos do mapa antes de responder" });
                    }
                }

                // Guarda a tentativa; refazer a questão substitui a resposta anterior
                const correto = alternativaEscolhida.correta;
                await prisma.usuarioquestao.upsert({
                    where: { usuarioId_questaoId: { usuarioId, questaoId } },
                    update: { alternativaId: alternativaEscolhida.id, correta: correto, respondidaEm: new Date(), resolucaoVistaEm: null },
                    create: { usuarioId, questaoId, alternativaId: alternativaEscolhida.id, correta: correto }
                });

                const alternativaCorreta = await prisma.alternativa.findFirst({
                    where: { questaoId, correta: true }
                });

                const resultado = await resultadoQuestoes(questao.mapaId, usuarioId);
                const situacao = await situacaoDoMapa(questao.mapaId, usuarioId, admin);

                res.status(200).json({
                    correto,
                    // Se errou, não entrega a resposta certa: o aluno pode refazer a questão
                    letraCorreta: correto && alternativaCorreta ? alternativaCorreta.letra : null,
                    // Acertou: a resolução já vem junto, pra conferir o raciocínio
                    resolucao: correto ? questao.resolucao : null,
                    resultado,
                    mapaConcluido: situacao?.concluido ?? false,
                    proximo: situacao?.proximo ?? null
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Mostra a resposta certa e a resolução de uma questão que o aluno já respondeu.
        // Se ele tinha errado, a questão fica um tempo sem poder ser refeita (ver services/resolucao.js).
        // Visitante e admin veem direto (nada fica salvo / o admin precisa conferir).
        async verResolucao(req, res) {
            try {
                const questaoId = parseInt(req.params.id);
                if (Number.isNaN(questaoId)) return res.status(400).json({ error: "Questão inválida" });

                const questao = await prisma.questao.findUnique({
                    where: { questaoId },
                    select: {
                        resolucao: true,
                        alternativa: { where: { correta: true }, select: { letra: true }, take: 1 }
                    }
                });
                if (!questao) return res.status(404).json({ error: "Questão não encontrada" });

                let liberada = null;
                if (req.usuario && !req.usuario.admin) {
                    const { usuarioId } = req.usuario;
                    const resposta = await prisma.usuarioquestao.findUnique({
                        where: { usuarioId_questaoId: { usuarioId, questaoId } },
                        select: { correta: true, resolucaoVistaEm: true }
                    });
                    if (!resposta) {
                        return res.status(403).json({ error: "Responda a questão antes de ver a resolução" });
                    }
                    // Só conta a primeira vez (abrir de novo não empurra o prazo pra frente)
                    if (!resposta.correta && !resposta.resolucaoVistaEm) {
                        const agora = new Date();
                        await prisma.usuarioquestao.update({
                            where: { usuarioId_questaoId: { usuarioId, questaoId } },
                            data: { resolucaoVistaEm: agora }
                        });
                        liberada = liberadaEm(agora);
                    } else if (!resposta.correta) {
                        liberada = liberadaEm(resposta.resolucaoVistaEm);
                    }
                }

                res.status(200).json({
                    resolucao: questao.resolucao,
                    letraCorreta: questao.alternativa[0]?.letra ?? null,
                    liberadaEm: liberada
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Rascunho da resolução comentada feito por IA (só admin, no editor do mapa).
        // Recebe a questão como está no formulário (pode ainda nem estar salva) e devolve o texto
        // pro admin revisar: nada é gravado no banco aqui.
        async gerarResolucaoIA(req, res) {
            const pedido = validarPedido(req.body ?? {});
            if (pedido.erro) return res.status(400).json({ error: pedido.erro });

            const minutos = registrarPedido(req.usuario.usuarioId);
            if (minutos > 0) {
                return res.status(429).json({ error: `Você já pediu muitas resoluções nesta hora. Tente de novo em ${minutos} min.` });
            }

            try {
                const resultado = await gerarResolucao(pedido.dados);
                res.status(200).json(resultado);
            } catch (error) {
                if (error instanceof ErroIA) {
                    // O detalhe técnico (resposta da OpenRouter) fica só no log, não vai pro navegador
                    console.log('[resolucao-ia]', error.message, error.detalhe);
                    return res.status(error.status).json({ error: error.message });
                }
                console.log('[resolucao-ia]', error.message);
                res.status(500).json({ error: 'Não foi possível gerar a resolução agora.' });
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