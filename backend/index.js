import 'dotenv/config'
import express from 'express';
import usuarioRoutes from './routes/usuarioRoutes.js';
import conteudoRoutes from './routes/conteudoRoutes.js';
import mapaConceitualRoutes from './routes/mapaConceitualRoutes.js';
import questaoRoutes from './routes/questaoRoutes.js';
import cors from 'cors';


//  Inicializando aplicação express
const app = express();

//Utilizando CORS (pensar na explicação dps)
app.use(cors({ origin: process.env.FRONTEND_URL || true }));

app.use(express.json());

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