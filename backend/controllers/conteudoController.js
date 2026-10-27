import prisma from '../services/adapter.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function controller() {
    return {
        get prisma() {
            return prisma;
        },
        async criarConteudo(req, res) {
            try {
                const { titulo, tipo, explicacao } = req.body;
                const novoConteudo = await prisma.conteudo.create({
                    data: {
                        titulo: titulo,
                        tipo: tipo,
                        explicacao: explicacao ? explicacao : null
                    }
                })
                res.status(201).json(novoConteudo);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Admin edita um conteúdo já existente (só altera os campos enviados)
        async atualizarConteudo(req, res) {
            try {
                const { id } = req.params;
                const { titulo, tipo, explicacao } = req.body;

                const data = {};
                if (titulo !== undefined) data.titulo = titulo;
                if (tipo !== undefined) data.tipo = tipo;
                if (explicacao !== undefined) data.explicacao = explicacao ? explicacao : null;

                const conteudoAtualizado = await prisma.conteudo.update({
                    where: { conteudoId: parseInt(id) },
                    data: data
                })
                res.status(200).json(conteudoAtualizado);
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Conteúdo não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },
        // Aluno marca (ou desmarca) um conteúdo como concluído.
        // O usuário vem do token, nunca do corpo da requisição: cada um só mexe no próprio progresso.
        async marcarConclusao(req, res) {
            try {
                const conteudoId = parseInt(req.params.id);
                const usuarioId = req.usuario.usuarioId;
                const concluido = req.body.concluido !== false;

                const registro = await prisma.usuarioconteudo.upsert({
                    where: { usuarioId_conteudoId: { usuarioId, conteudoId } },
                    update: { concluido },
                    create: { usuarioId, conteudoId, concluido }
                });

                res.status(200).json(registro);
            } catch (error) {
                console.log(error.message);

                // Chave estrangeira: o conteúdo (ou o usuário) não existe
                if (error.code === 'P2003') {
                    return res.status(404).json("Conteúdo não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async criarUsuarioConteudo(req, res) {
            try {
                const { usuarioId, conteudoId } = req.body;
                const novoUsuarioConteudo = await prisma.usuarioconteudo.create({
                    data: {
                        usuarioId: parseInt(usuarioId),
                        conteudoId: parseInt(conteudoId)
                    }
                })
                res.status(201).json(novoUsuarioConteudo);
            } catch (error) {
                console.log(error.message);
                if (error.code === 'P2002') {
                    return res.status(409).json("Este conteúdo já está vinculado a este usuário");
                }
                res.status(500).json("Internal server error!");
            }
        }
    }
}

export default controller;