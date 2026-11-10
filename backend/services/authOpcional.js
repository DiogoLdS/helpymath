import authUser from './auth.js';

// Login OPCIONAL (modo visitante): usado nas rotas de ver mapas e fazer questões.
// - Sem o cabeçalho Authorization: segue como visitante (req.usuario = null). Nada é salvo pra ele.
// - Com o cabeçalho: valida igual ao authUser (token inválido ou vencido continua dando 401,
//   pra quem tem conta ser mandado pro login em vez de virar visitante sem perceber).
export default function authOpcional(req, res, next) {
    if (!req.header('Authorization')) {
        req.usuario = null;
        return next();
    }
    return authUser(req, res, next);
}
