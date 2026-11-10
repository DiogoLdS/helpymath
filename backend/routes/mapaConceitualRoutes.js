import express from 'express';
import controller from '../controllers/mapaConceitualController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';
import authOpcional from '../services/authOpcional.js';

const routes = express.Router();
const mapaController = controller();

// Leitura: aberta também pra visitante (sem conta), que vê tudo liberado e sem progresso salvo
routes.get('/mapas', authOpcional, mapaController.listarMapas);
routes.get('/mapas/:id', authOpcional, mapaController.buscarMapa);
routes.get('/mapas/:id/progresso', authOpcional, mapaController.progressoMapa);

// Escrita: apenas administradores
routes.post('/criarMapa', authUser, authAdmin, mapaController.criarMapa);
routes.patch('/mapas/:id', authUser, authAdmin, mapaController.atualizarMapa);
routes.delete('/mapas/:id', authUser, authAdmin, mapaController.deletarMapa);
routes.post('/mapas/:id/conteudo', authUser, authAdmin, mapaController.adicionarConteudo);
routes.delete('/mapas/:id/conteudo/:conteudoId', authUser, authAdmin, mapaController.removerConteudo);

export default routes;