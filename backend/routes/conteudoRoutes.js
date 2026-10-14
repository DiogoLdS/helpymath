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

// Associar conteúdo a um usuário (qualquer usuário autenticado, ex: marcar progresso)
routes.post('/criarUsuarioConteudo', authUser, conteudoController.criarUsuarioConteudo);

export default routes;