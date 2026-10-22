import express from 'express';
import controller from '../controllers/questaoController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';

const routes = express.Router();
const questaoController = controller();

routes.get('/mapas/:mapaId/questoes', authUser, questaoController.listarQuestoesPorMapa);
routes.post('/questoes/:id/responder', authUser, questaoController.responderQuestao);

routes.get('/admin/mapas/:mapaId/questoes', authUser, authAdmin, questaoController.listarQuestoesAdmin);
routes.post('/criarQuestao', authUser, authAdmin, questaoController.criarQuestao);
routes.patch('/questoes/:id', authUser, authAdmin, questaoController.atualizarQuestao);
routes.delete('/questoes/:id', authUser, authAdmin, questaoController.deletarQuestao);
routes.post('/questoes/:id/alternativas', authUser, authAdmin, questaoController.criarAlternativa);
routes.patch('/alternativas/:id', authUser, authAdmin, questaoController.atualizarAlternativa);
routes.delete('/alternativas/:id', authUser, authAdmin, questaoController.deletarAlternativa);

export default routes;