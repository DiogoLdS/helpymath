// Excluir conta (LGPD): apaga o usuário e os dados dele juntos, e nunca o último admin.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let usuarios = [];
let respostas = [];
let concluidos = [];

// Cada operação devolve uma "ação" que só roda dentro do $transaction (como no Prisma)
mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    usuario: {
        findUnique: async ({ where }) => usuarios.find((u) => u.usuarioId === where.usuarioId) ?? null,
        count: async ({ where }) => usuarios.filter((u) => u.admin === where.admin).length,
        delete: async ({ where }) => () => { usuarios = usuarios.filter((u) => u.usuarioId !== where.usuarioId); },
    },
    usuarioquestao: { deleteMany: async ({ where }) => () => { respostas = respostas.filter((r) => r.usuarioId !== where.usuarioId); } },
    usuarioconteudo: { deleteMany: async ({ where }) => () => { concluidos = concluidos.filter((r) => r.usuarioId !== where.usuarioId); } },
    $transaction: async (operacoes) => { for (const acao of await Promise.all(operacoes)) acao(); },
} } });

const { excluirUsuario } = await import('../services/excluirConta.js');

test('apaga a conta com respostas e progresso, sem mexer nos outros alunos', async () => {
    usuarios = [{ usuarioId: 1, admin: false }, { usuarioId: 2, admin: false }, { usuarioId: 9, admin: true }];
    respostas = [{ usuarioId: 1 }, { usuarioId: 2 }];
    concluidos = [{ usuarioId: 1 }, { usuarioId: 1 }, { usuarioId: 2 }];

    assert.equal(await excluirUsuario(1), 'ok');
    assert.deepEqual(usuarios.map((u) => u.usuarioId), [2, 9]);
    assert.deepEqual(respostas, [{ usuarioId: 2 }]);
    assert.deepEqual(concluidos, [{ usuarioId: 2 }]);
});

test('usuário que não existe', async () => {
    usuarios = [{ usuarioId: 9, admin: true }];
    assert.equal(await excluirUsuario(5), 'nao-encontrado');
});

test('o site nunca fica sem administrador', async () => {
    usuarios = [{ usuarioId: 9, admin: true }];
    assert.equal(await excluirUsuario(9), 'ultimo-admin');
    assert.equal(usuarios.length, 1);

    usuarios.push({ usuarioId: 10, admin: true });
    assert.equal(await excluirUsuario(9), 'ok', 'com outro admin, pode');
});
