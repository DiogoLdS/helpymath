import prisma from '../services/adapter.js';

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // CU10 - Admin cria um novo mapa conceitual
        async criarMapa(req, res) {
            try {
                const { nome } = req.body;

                const novoMapa = await prisma.mapaconceitual.create({
                    data: { nome: nome }
                });

                res.status(201).json(novoMapa);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async listarMapas(req, res) {
            try {
                const mapas = await prisma.mapaconceitual.findMany({
                    select: {
                        mapaId: true,
                        nome: true
                    }
                });

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

                const mapaInfo = {
                    mapaId: mapa.mapaId,
                    nome: mapa.nome,
                    conteudos: mapa.mapaconteudo.map((mc) => mc.conteudo)
                };

                res.status(200).json(mapaInfo);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async atualizarMapa(req, res) {
            try {
                const { id } = req.params;
                const { nome } = req.body;

                const mapaAtualizado = await prisma.mapaconceitual.update({
                    where: { mapaId: parseInt(id) },
                    data: { nome: nome }
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

                await prisma.mapaconceitual.delete({
                    where: { mapaId: parseInt(id) }
                });

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