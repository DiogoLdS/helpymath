import express from 'express';
import controller from '../controllers/conteudoController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';

const routes = express.Router();
const conteudoController = controller();

// Cadastrar conteúdo (apenas administradores)
routes.post('/criarConteudo', authUser, authAdmin, conteudoController.criarConteudo);

// Editar conteúdo (apenas administradores)
routes.patch('/conteudo/:id', authUser, authAdmin, conteudoController.atualizarConteudo);

// Aluno marca/desmarca um conteúdo como concluído (body: { concluido: true | false })
routes.put('/conteudo/:id/conclusao', authUser, conteudoController.marcarConclusao);

// Associar conteúdo a um usuário (qualquer usuário autenticado, ex: marcar progresso)
routes.post('/criarUsuarioConteudo', authUser, conteudoController.criarUsuarioConteudo);

export default routes;