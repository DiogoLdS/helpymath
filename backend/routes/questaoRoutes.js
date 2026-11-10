import express from 'express';
import controller from '../controllers/questaoController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';
import authOpcional from '../services/authOpcional.js';

import { corrigirDiagnostico, questoesDoDiagnostico } from '../services/diagnostico.js';

const routes = express.Router();
const questaoController = controller();

// Visitante (sem conta) também pode fazer as questões: a resposta é corrigida, mas não fica salva
routes.get('/mapas/:mapaId/questoes', authOpcional, questaoController.listarQuestoesPorMapa);
routes.post('/questoes/:id/responder', authOpcional, questaoController.responderQuestao);

// Teste diagnóstico das perguntas de boas-vindas (services/diagnostico.js): não mexe no progresso
routes.get('/diagnostico', authUser, async (req, res) => {
    try {
        res.status(200).json(await questoesDoDiagnostico());
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal server error!");
    }
});
routes.post('/diagnostico', authUser, async (req, res) => {
    try {
        const { erro, ...resultado } = await corrigirDiagnostico(req.body?.respostas);
        if (erro) return res.status(400).json({ error: erro });
        res.status(200).json(resultado);
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal server error!");
    }
});

routes.get('/admin/mapas/:mapaId/questoes', authUser, authAdmin, questaoController.listarQuestoesAdmin);
routes.post('/criarQuestao', authUser, authAdmin, questaoController.criarQuestao);
routes.patch('/questoes/:id', authUser, authAdmin, questaoController.atualizarQuestao);
routes.delete('/questoes/:id', authUser, authAdmin, questaoController.deletarQuestao);
routes.post('/questoes/:id/alternativas', authUser, authAdmin, questaoController.criarAlternativa);
routes.patch('/alternativas/:id', authUser, authAdmin, questaoController.atualizarAlternativa);
routes.delete('/alternativas/:id', authUser, authAdmin, questaoController.deletarAlternativa);

export default routes;