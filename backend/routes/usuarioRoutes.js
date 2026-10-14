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
routes.patch('/usuario/:id/promover',authUser,authAdmin,usuarioController.promoverAdmin);
routes.patch('/usuario/:id/despromover',authUser,authAdmin,usuarioController.despromoverAdmin);

export default routes;