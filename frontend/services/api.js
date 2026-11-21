import axios from 'axios';
import { encerrarSessaoVencida } from '../src/utils/sessao.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',

    headers: { 'Content-Type': 'application/json' }
})

// O login venceu com o site aberto: o backend responde 401 a um pedido que foi COM token.
// Apaga o token e deixa o aviso pra página de login (cada página já manda pro /login no 401).
// Pedido sem token (ex: senha errada no login) não entra aqui.
api.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
        const mandouToken = Boolean(erro.config?.headers?.Authorization);
        if (erro.response?.status === 401 && mandouToken && localStorage.getItem('token')) {
            encerrarSessaoVencida();
        }
        return Promise.reject(erro);
    }
);

export default api;
