import prisma from '../services/adapter.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dadosDoPainelAdmin } from '../services/painelAdmin.js';
import { gerarSenhaTemporaria } from '../services/senhaTemporaria.js';
import { rankingDosAlunos } from '../services/ranking.js';
import { excluirUsuario } from '../services/excluirConta.js';
import { limparErros, minutosBloqueado, registrarErro } from '../services/limiteLogin.js';
import { CAMPOS_PERFIL, SENHA_MINIMA, dadosDoPerfil, validarCadastro, validarEdicaoPerfil } from '../services/perfil.js';

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
                // Nome, e-mail, senha mínima e aceite dos termos (services/perfil.js)
                const { dados, erro } = validarCadastro(req.body);

                if (erro) {
                    return res.status(400).json({ error: erro });
                }

                // E-mail já usado (sem diferenciar maiúsculas de minúsculas)
                const existente = await prisma.usuario.findFirst({
                    where: { email: { equals: dados.email, mode: 'insensitive' } },
                    select: { usuarioId: true }
                });

                if (existente) {
                    return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
                }

                // Criptogrando senha enviada na requisição
                const hashPassword = await bcrypt.hash(dados.senha, 10);

                // Fazendo o insert de dados no banco
                const novoUsuario = await prisma.usuario.create({
                    data: {
                        nome: dados.nome,
                        email: dados.email,
                        senha: hashPassword
                    },
                    // Nunca devolve a senha (nem criptografada)
                    select: { usuarioId: true, nome: true, email: true, admin: true }
                })

                // Resposta: o novo usuário e o token, pra já entrar direto nas perguntas de boas-vindas
                res.status(201).json({ ...novoUsuario, token: gerarToken(novoUsuario) });
            } catch (error) {
                console.error(error);

                // Dois cadastros com o mesmo e-mail ao mesmo tempo: o banco barra o segundo
                if (error.code === 'P2002') {
                    return res.status(409).json({ error: "Já existe uma conta com esse e-mail" });
                }

                res.status(500).json({ error: "Não foi possível criar a conta agora" });
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
                    return res.status(400).json({ error: "Informe o e-mail e a senha" });
                }

                // Muitas senhas erradas seguidas: trava um tempo (contra quem fica chutando senha)
                const espera = minutosBloqueado(req.ip, email);
                if (espera > 0) {
                    return res.status(429).json({ error: `Muitas tentativas erradas. Tente de novo em ${espera} ${espera === 1 ? "minuto" : "minutos"}.` });
                }

                // Procurando usuário (sem diferenciar maiúsculas de minúsculas no e-mail)
                const logUsuario = await prisma.usuario.findFirst({
                    where: {
                        email: { equals: String(email).trim(), mode: 'insensitive' },
                    }
                })

                // Usuário inexistente e senha errada dão a mesma resposta,
                // pra ninguém descobrir quais e-mails têm conta
                if (!logUsuario) {
                    registrarErro(req.ip, email);
                    return res.status(401).json({ error: "E-mail ou senha incorretos" });
                }

                //  Definindo o token jwt
                const token = gerarToken(logUsuario);

                // Comparando senha enviada na requisição com senha do banco
                const matchingPassword = await bcrypt.compare(senha, logUsuario.senha);

                if (matchingPassword) {
                    //Realiza o login com sucesso
                    limparErros(req.ip, email);
                    return res.status(200).json(token);
                }

                // Caso a senha seja incorreta, o login não é realizado
                registrarErro(req.ip, email);
                res.status(401).json({ error: "E-mail ou senha incorretos" });
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
                if (String(novaSenha).length < SENHA_MINIMA) {
                    return res.status(400).json({ error: `A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres` });
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

                // Também as respostas das boas-vindas (a trilha usa o nível; as boas-vindas vêm preenchidas)
                const usuarioInfo = {
                    usuarioId: findUsuario.usuarioId,
                    nome: findUsuario.nome,
                    objetivo: findUsuario.objetivo,
                    nivel: findUsuario.nivel,
                    metaSemanal: findUsuario.metaSemanal,
                    boasVindasEm: findUsuario.boasVindasEm,
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
        // Página inicial do admin: números, mapas, questões com problema e usuários
        // Ranking de pontos dos alunos: ?periodo=geral (padrão) ou ?periodo=semana
        async ranking(req, res) {
            try {
                const periodo = req.query.periodo === 'semana' ? 'semana' : 'geral';
                res.status(200).json(await rankingDosAlunos(periodo, req.usuario.usuarioId));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async painelAdmin(req, res) {
            try {
                res.status(200).json(await dadosDoPainelAdmin());
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        async despromoverAdmin(req, res) {
            try {
                const { id } = req.params;

                // O admin não pode tirar o próprio acesso (senão o site pode ficar sem nenhum admin)
                if (parseInt(id) === req.usuario.usuarioId) {
                    return res.status(400).json({ error: "Você não pode remover o seu próprio acesso de administrador" });
                }

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
        // "Esqueci minha senha": o admin gera uma senha temporária pro aluno (o site não envia e-mail).
        // A senha só aparece nesta resposta; no banco fica só o hash, como sempre.
        async redefinirSenha(req, res) {
            try {
                const id = parseInt(req.params.id);

                if (Number.isNaN(id)) {
                    return res.status(400).json({ error: "Usuário inválido" });
                }
                // A própria senha se troca no perfil (lá pede a senha atual)
                if (id === req.usuario.usuarioId) {
                    return res.status(400).json({ error: "Para trocar a sua própria senha, use o seu perfil" });
                }

                const senhaTemporaria = gerarSenhaTemporaria();
                await prisma.usuario.update({
                    where: { usuarioId: id },
                    data: { senha: await bcrypt.hash(senhaTemporaria, 10) }
                });

                res.status(200).json({ senhaTemporaria });
            } catch (error) {
                console.log(error.message);

                if (error.code === 'P2025') {
                    return res.status(404).json({ error: "Usuário não encontrado" });
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

                // Apaga junto o progresso e as respostas do usuário
                const resultado = await excluirUsuario(parseInt(id));
                if (resultado === "nao-encontrado") {
                    return res.status(404).json("Usuário não encontrado");
                }

                res.status(200).json("Usuário removido com sucesso");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        },
        // LGPD: o próprio usuário apaga a conta e todos os dados dela. Pede a senha de novo, por segurança.
        async excluirMinhaConta(req, res) {
            try {
                const { senha } = req.body ?? {};
                if (!senha) {
                    return res.status(400).json({ error: "Digite sua senha para confirmar" });
                }

                const usuario = await prisma.usuario.findUnique({ where: { usuarioId: req.usuario.usuarioId } });
                const confere = usuario && await bcrypt.compare(String(senha), usuario.senha);
                if (!confere) {
                    return res.status(400).json({ error: "Senha incorreta" });
                }

                const resultado = await excluirUsuario(usuario.usuarioId);
                if (resultado === "ultimo-admin") {
                    return res.status(409).json({ error: "Você é o único administrador. Promova outra pessoa a admin antes de excluir sua conta." });
                }

                res.status(200).json("Conta excluída");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Internal server error!");
            }
        }
    }
}

export default controller;