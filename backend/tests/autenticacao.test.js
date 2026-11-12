// Middlewares de login: authUser (precisa de token), authAdmin (precisa ser admin) e authOpcional (visitante).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'segredo-so-de-teste';

const { default: authUser } = await import('../services/auth.js');
const { default: authAdmin } = await import('../services/authAdmin.js');
const { default: authOpcional } = await import('../services/authOpcional.js');

// Roda um middleware com um pedido falso e conta se ele deixou passar (next) ou respondeu erro
function rodar(middleware, { authorization, usuario } = {}) {
    const req = { usuario, header: (nome) => (nome === 'Authorization' ? authorization : undefined) };
    const resultado = { passou: false, status: null, req };
    const res = {
        status(codigo) { resultado.status = codigo; return this; },
        json() { return this; },
    };
    middleware(req, res, () => { resultado.passou = true; });
    return resultado;
}

const token = (dados, segredo = process.env.JWT_SECRET, opcoes = {}) => jwt.sign(dados, segredo, opcoes);

test('authUser: token válido passa e coloca o usuário no pedido', () => {
    const r = rodar(authUser, { authorization: `Bearer ${token({ usuarioId: 3, admin: false })}` });
    assert.equal(r.passou, true);
    assert.equal(r.req.usuario.usuarioId, 3);
});

test('authUser: sem cabeçalho, formato errado, assinatura falsa ou vencido = 401', () => {
    const silencio = console.log;
    console.log = () => {};
    try {
        assert.equal(rodar(authUser, {}).status, 401);
        assert.equal(rodar(authUser, { authorization: token({ usuarioId: 3 }) }).status, 401);
        assert.equal(rodar(authUser, { authorization: `Bearer ${token({ usuarioId: 3 }, 'outro-segredo')}` }).status, 401);
        assert.equal(rodar(authUser, { authorization: `Bearer ${token({ usuarioId: 3 }, undefined, { expiresIn: -10 })}` }).status, 401);
    } finally {
        console.log = silencio;
    }
});

test('authAdmin: só admin passa', () => {
    assert.equal(rodar(authAdmin, { usuario: { admin: true } }).passou, true);
    assert.equal(rodar(authAdmin, { usuario: { admin: false } }).status, 403);
    assert.equal(rodar(authAdmin, {}).status, 401);
});

test('authOpcional: sem token vira visitante; com token inválido continua 401', () => {
    const visitante = rodar(authOpcional, {});
    assert.equal(visitante.passou, true);
    assert.equal(visitante.req.usuario, null);

    const silencio = console.log;
    console.log = () => {};
    try {
        assert.equal(rodar(authOpcional, { authorization: 'Bearer lixo' }).status, 401);
    } finally {
        console.log = silencio;
    }
});
