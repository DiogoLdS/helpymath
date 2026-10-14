export default function authAdmin(req, res, next) {

    if (!req.usuario) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!req.usuario.admin) {
        return res.status(403).json({ error: "Acesso restrito a administradores" });
    }

    next();
}