import express from 'express';
import controller from '../controllers/mapaConceitualController.js';
import authUser from '../services/auth.js';
import authAdmin from '../services/authAdmin.js';
import authOpcional from '../services/authOpcional.js';
import { buscarSimulado, entregarSimulado } from '../services/simulado.js';

const routes = express.Router();
const mapaController = controller();

// Leitura: aberta também pra visitante (sem conta), que vê tudo liberado e sem progresso salvo
routes.get('/mapas', authOpcional, mapaController.listarMapas);
routes.get('/mapas/:id', authOpcional, mapaController.buscarMapa);
routes.get('/mapas/:id/progresso', authOpcional, mapaController.progressoMapa);

// Simulado (services/simulado.js): a prova e a entrega. Visitante faz, mas nada fica salvo.
routes.get('/mapas/:id/simulado', authOpcional, async (req, res) => {
    try {
        const mapaId = parseInt(req.params.id);
        if (Number.isNaN(mapaId)) return res.status(400).json({ error: "Simulado inválido" });

        const simulado = await buscarSimulado(mapaId, req.usuario?.usuarioId ?? null, req.usuario?.admin ?? false);
        if (!simulado) return res.status(404).json({ error: "Simulado não encontrado" });
        res.status(200).json(simulado);
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal server error!");
    }
});
routes.post('/mapas/:id/simulado', authOpcional, async (req, res) => {
    try {
        const mapaId = parseInt(req.params.id);
        if (Number.isNaN(mapaId)) return res.status(400).json({ error: "Simulado inválido" });

        const { erro, status, ...resultado } = await entregarSimulado(
            mapaId, req.usuario?.usuarioId ?? null, req.usuario?.admin ?? false, req.body?.respostas
        );
        if (erro) return res.status(status).json({ error: erro, ...resultado });
        res.status(200).json(resultado);
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal server error!");
    }
});

// Escrita: apenas administradores
routes.post('/criarMapa', authUser, authAdmin, mapaController.criarMapa);
routes.patch('/mapas/:id', authUser, authAdmin, mapaController.atualizarMapa);
routes.patch('/mapas/:id/ordem', authUser, authAdmin, mapaController.moverMapa);
routes.delete('/mapas/:id', authUser, authAdmin, mapaController.deletarMapa);
routes.post('/mapas/:id/conteudo', authUser, authAdmin, mapaController.adicionarConteudo);
routes.delete('/mapas/:id/conteudo/:conteudoId', authUser, authAdmin, mapaController.removerConteudo);

export default routes;