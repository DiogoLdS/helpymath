import express from 'express';
import controller from '../controllers/usuarioController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';

const routes = express.Router();
const usuarioController = controller();

routes.post('/registrarUsuario',usuarioController.registrarUsuario);
routes.post('/logUsuario',usuarioController.logUsuario);

// Apenas administradores podem buscar dados de qualquer usuário pelo id
routes.get('/getUsuario/:id',authUser,authAdmin,usuarioController.getUsuarioPorId);
routes.delete('/usuario/:id',authUser,authAdmin,usuarioController.deletarUsuario);
routes.get('/auth',authUser, (req,res) => {
    res.status(200).json("Authentication Succeed!")
})

routes.get('/me',authUser, usuarioController.getUsuario);

// Perfil do próprio usuário logado
routes.get('/perfil', authUser, usuarioController.perfil);
routes.patch('/perfil', authUser, usuarioController.editarPerfil);
routes.patch('/perfil/senha', authUser, usuarioController.trocarSenha);
routes.patch('/usuario/:id/promover',authUser,authAdmin,usuarioController.promoverAdmin);
routes.patch('/usuario/:id/despromover',authUser,authAdmin,usuarioController.despromoverAdmin);
// Esqueci minha senha: o admin gera uma senha temporária pro usuário
routes.patch('/usuario/:id/senha-temporaria',authUser,authAdmin,usuarioController.redefinirSenha);

// Ranking de pontos (precisa estar logado: mostra nomes de outros alunos)
routes.get('/ranking', authUser, usuarioController.ranking);

// Painel da página inicial do administrador
routes.get('/admin/painel', authUser, authAdmin, usuarioController.painelAdmin);

export default routes;