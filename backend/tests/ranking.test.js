// Ranking de pontos: 10 por conteúdo concluído, 5 por acerto. Banco falso na memória.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const agora = Date.now();
const velho = new Date(agora - 30 * 864e5); // fora da semana
const recente = new Date(agora - 864e5);    // dentro da semana

const usuarios = [
    { usuarioId: 1, nome: 'Ana Maria Souza', admin: false },
    { usuarioId: 2, nome: 'Bruno', admin: false },
    { usuarioId: 3, nome: 'Carla Dias', admin: false },
    { usuarioId: 4, nome: 'Professor', admin: true },
    { usuarioId: 5, nome: 'Duda Lima', admin: false },
    { usuarioId: 6, nome: 'Zé Sem Ponto', admin: false },
];
const conteudos = [
    { usuarioId: 1, concluido: true, concluidoEm: velho },
    { usuarioId: 1, concluido: true, concluidoEm: recente },
    { usuarioId: 2, concluido: true, concluidoEm: recente },
    { usuarioId: 4, concluido: true, concluidoEm: recente },
    { usuarioId: 5, concluido: false, concluidoEm: null },
];
const respostas = [
    { usuarioId: 3, correta: true, respondidaEm: recente },
    { usuarioId: 3, correta: true, respondidaEm: recente },
    { usuarioId: 5, correta: true, respondidaEm: velho },
    { usuarioId: 5, correta: false, respondidaEm: recente },
];

// Imita o where do Prisma que o ranking usa (igualdade e { gte: data })
const filtrar = (lista, where) => lista.filter((r) => Object.entries(where).every(([campo, valor]) =>
    valor && typeof valor === 'object' && 'gte' in valor ? r[campo] && r[campo] >= valor.gte : r[campo] === valor));
const contarPorUsuario = (lista) => async ({ where }) => {
    const contagem = new Map();
    for (const r of filtrar(lista, where)) contagem.set(r.usuarioId, (contagem.get(r.usuarioId) ?? 0) + 1);
    return [...contagem].map(([usuarioId, n]) => ({ usuarioId, _count: { _all: n } }));
};

mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    usuario: { findMany: async ({ where }) => filtrar(usuarios, where) },
    usuarioconteudo: { groupBy: contarPorUsuario(conteudos) },
    usuarioquestao: { groupBy: contarPorUsuario(respostas) },
} } });

const { rankingDosAlunos, nomeCurto } = await import('../services/ranking.js');

test('nome curto: primeiro nome + inicial do último (privacidade)', () => {
    assert.equal(nomeCurto('Ana Maria Souza'), 'Ana S.');
    assert.equal(nomeCurto('Bruno'), 'Bruno');
    assert.equal(nomeCurto('   '), 'Aluno');
});

test('geral: soma pontos, empate divide a posição, admin e quem tem 0 ficam de fora', async () => {
    const r = await rankingDosAlunos('geral', 2);
    assert.deepEqual(r.top.map((a) => [a.posicao, a.nome, a.pontos]),
        [[1, 'Ana S.', 20], [2, 'Carla D.', 10], [2, 'Bruno', 10], [4, 'Duda L.', 5]]);
    assert.equal(r.participantes, 4);
    assert.equal(r.eu.nome, 'Bruno');
    assert.equal(r.eu.voce, true);
});

test('o ranking não expõe id nem sobrenome completo', async () => {
    const texto = JSON.stringify(await rankingDosAlunos('geral', 1));
    assert.ok(!texto.includes('usuarioId'));
    assert.ok(!texto.includes('Souza'));
});

test('semana: só conta o que foi feito nos últimos dias', async () => {
    const r = await rankingDosAlunos('semana', 6);
    assert.deepEqual(r.top.map((a) => [a.posicao, a.nome, a.pontos]),
        [[1, 'Carla D.', 10], [1, 'Ana S.', 10], [1, 'Bruno', 10]]);
    assert.equal(r.eu, null, 'quem não pontuou não aparece');
});
