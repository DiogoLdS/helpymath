import 'dotenv/config'
import express from 'express';
import usuarioRoutes from './routes/usuarioRoutes.js';
import conteudoRoutes from './routes/conteudoRoutes.js';
import mapaConceitualRoutes from './routes/mapaConceitualRoutes.js';
import questaoRoutes from './routes/questaoRoutes.js';
import cors from 'cors';


//  Inicializando aplicação express
const app = express();

// No Render o pedido chega por um proxy: confia nele pra saber o IP real (usado no limite de login)
app.set('trust proxy', 1);

//Utilizando CORS (pensar na explicação dps)
app.use(cors({ origin: process.env.FRONTEND_URL || true }));

app.use(express.json());

// Rota de "saúde": responde na hora, sem usar o banco. O GitHub Actions chama ela a cada 10 minutos
// para o servidor gratuito do Render não dormir (RNF002: páginas em até 3 segundos).
// Não pode consultar o banco: senão o Neon também ficaria acordado o mês todo e gastaria as horas grátis.
app.get('/saude', (req, res) => res.status(200).json({ ok: true }));

// Importar rotas
app.use(usuarioRoutes);
app.use(conteudoRoutes);
app.use(mapaConceitualRoutes);
app.use(questaoRoutes);

//Porta do servidor
const PORT = process.env.PORT || 3000;

//Definindo rotas utilizadas na aplicação

app.listen(PORT,() => {
    console.log(`Server on!`);
})