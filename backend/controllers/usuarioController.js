import prisma from '../services/adapter.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CAMPOS_PERFIL, dadosDoPerfil, validarEdicaoPerfil } from '../services/perfil.js';

// Token de login (o mesmo do login e de quando o aluno muda o nome no perfil)
function gerarToken(usuario) {
    const payload = {
        usuarioId: usuario.usuarioId,
        nome: usuario.nome,
        admin: usuario.admin,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function controller() {
    return {
        get prisma() {
            return prisma;
        },
        async registrarUsuario(req, res) {
            try {
                const {
                    nome,
                    email,
                    senha,
                } = req.body;

                // Criptogrando senha enviada na requisição
                const hashPassword = await bcrypt.hash(senha, 10);

                // Fazendo o insert de dados no banco
                const novoUsuario = await prisma.usuario.create({
                    data: {
                        nome: nome,
                        email: email,
                        senha: hashPassword
                    }
                })

                // Resposta da requisição: JSON do novo usuário
                res.status(201).json(novoUsuario);
            } catch (error) {
                console.error(error);

                res.status(500).json({
                    error: error.message
                });
            }
        },
        async logUsuario(req, res) {
            try {
                const {
                    email,
                    senha
                } = req.body;

                //  Verificando usuario e senha
                if (!email || !senha) {
                    //  Caso não tenha, há tratamento do erro.
                    return res.status(400).json("Incorrect senha or email");
                }

                // Procurando usuário
                const logUsuario = await prisma.usuario.findUnique({
                    where: {
                        email: email,
                    }
                })

                // Verificando se o usuário existe
                if (!logUsuario) {
                    // Tratamento do erro
                    return res.status(404).json("User not found...");
                }

                //  Definindo o token jwt
                const token = gerarToken(logUsuario);

                // Comparando senha enviada na requisição com senha do banco
                const matchingPassword = await bcrypt.compare(senha, logUsuario.senha);

                if (matchingPassword) {
                    //Realiza o login com sucesso
                    return res.status(200).json(token);
                }

                // Caso a senha seja incorreta, o login não é realizado
                res.status(401).json("Login failed...");
            } catch (error) {
                console.log(error.message)
                // Erro no servidor
                res.status(500).json("Internal server error!");
            }
        },

        // Página de perfil: dados do aluno, mapas, conteúdos concluídos/pendentes e respostas
        async perfil(req, res) {
            try {
                const dados = await dadosDoPerfil(req.usuario.usuarioId, req.usuario.admin);

                if (!dados) {
                    return res.status(404).json("Usuário não encontrado");
                }

                res.status(200).json(dados);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Aluno edita o próprio perfil (nome, objetivo, meta semanal, anotações, cronograma)
        async editarPerfil(req, res) {
            try {
                const { dados, erro } = validarEdicaoPerfil(req.body);

                if (erro) {
                    return res.status(400).json({ error: erro });
                }

                const usuario = await prisma.usuario.update({
                    where: { usuarioId: req.usuario.usuarioId },
                    data: dados,
                    select: CAMPOS_PERFIL
                });

                // Se o nome mudou, manda um token novo (o nome vai dentro do token)
                res.status(200).json({
                    usuario,
                    token: dados.nome !== undefined ? gerarToken(usuario) : undefined
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // Trocar a senha: precisa da senha atual
        async trocarSenha(req, res) {
            try {
                const { senhaAtual, novaSenha } = req.body;

                if (!senhaAtual || !novaSenha) {
                    return res.status(400).json({ error: "Informe a senha atual e a nova senha" });
                }
                if (String(novaSenha).length < 6) {
                    return res.status(400).json({ error: "A nova senha precisa ter pelo menos 6 caracteres" });
                }

                const usuario = await prisma.usuario.findUnique({ where: { usuarioId: req.usuario.usuarioId } });
                const confere = usuario && await bcrypt.compare(String(senhaAtual), usuario.senha);

                if (!confere) {
                    return res.status(400).json({ error: "A senha atual está incorreta" });
                }

                await prisma.usuario.update({
                    where: { usuarioId: usuario.usuarioId },
                    data: { senha: await bcrypt.hash(String(novaSenha), 10) }
                });

                res.status(200).json("Senha alterada com sucesso");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async getUsuario(req, res) {
            try {
                const { usuarioId } = req.usuario;

                const findUsuario = await prisma.usuario.findUnique({
                    where: {
                        usuarioId: parseInt(usuarioId)
                    }
                })

                const usuarioInfo = {
                    usuarioId: findUsuario.usuarioId,
                    nome: findUsuario.nome,
                }
                res.status(200).json(usuarioInfo);
            } catch (error) {
                console.log(error.message)
                res.status(500).json("Internal server error!");
            }
        },
        async getUsuarioPorId(req, res) {
            try {
                const { id } = req.params;

                const findUsuario = await prisma.usuario.findUnique({
                    where: {
                        usuarioId: parseInt(id)
                    }
                })

                if (!findUsuario) {
                    return res.status(404).json("Usuário não encontrado");
                }

                const usuarioInfo = {
                    usuarioId: findUsuario.usuarioId,
                    nome: findUsuario.nome,
                    email: findUsuario.email,
                    admin: findUsuario.admin,
                }
                res.status(200).json(usuarioInfo);
            } catch (error) {
                console.log(error.message)
                res.status(500).json("Internal server error!");
            }
        },
        // Rota exclusiva de administrador: promove outro usuário a admin
        async promoverAdmin(req, res) {
            try {
                const { id } = req.params;

                const usuarioAtualizado = await prisma.usuario.update({
                    where: {
                        usuarioId: parseInt(id)
                    },
                    data: {
                        admin: true
                    }
                })

                const usuarioInfo = {
                    usuarioId: usuarioAtualizado.usuarioId,
                    nome: usuarioAtualizado.nome,
                    admin: usuarioAtualizado.admin,
                }
                res.status(200).json(usuarioInfo);
            } catch (error) {
                console.log(error.message)

                // Prisma lança esse código quando o registro não existe
                if (error.code === 'P2025') {
                    return res.status(404).json("Usuário não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async despromoverAdmin(req, res) {
            try {
                const { id } = req.params;

                const usuarioAtualizado = await prisma.usuario.update({
                    where: {
                        usuarioId: parseInt(id)
                    },
                    data: {
                        admin: false
                    }
                })

                const usuarioInfo = {
                    usuarioId: usuarioAtualizado.usuarioId,
                    nome: usuarioAtualizado.nome,
                    admin: usuarioAtualizado.admin,
                }
                res.status(200).json(usuarioInfo);
            } catch (error) {
                console.log(error.message)

                // Prisma lança esse código quando o registro não existe
                if (error.code === 'P2025') {
                    return res.status(404).json("Usuário não encontrado");
                }

                res.status(500).json("Internal server error!");
            }
        },
        async deletarUsuario(req, res) {
            try {
                const { id } = req.params;

                if (parseInt(id) === req.usuario.usuarioId) {
                    return res.status(400).json("Não é possível remover a própria conta por aqui");
                }

                await prisma.usuario.delete({
                    where: { usuarioId: parseInt(id) }
                });

                res.status(200).json("Usuário removido com sucesso");
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json("Usuário não encontrado");
                }
                if (error.code === 'P2003') {
                    return res.status(409).json("Não é possível remover: existem dados vinculados a esse usuário (ex: progresso em conteúdos).");
                }

                res.status(500).json("Internal server error!");
            }
        }
    }
}

export default controller;