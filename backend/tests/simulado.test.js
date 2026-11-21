// Simulados: correção no fim (tipo prova), respostas salvas e espera de 24 h para refazer.
// Banco falso na memória: nada toca o banco de verdade.
import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let mapa;
let questoes;
let salvas;      // respostas que "já estão no banco"
let transacao;   // o que a entrega mandou gravar

mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    mapaconceitual: { findUnique: async () => mapa },
    questao: { findMany: async () => questoes },
    usuarioquestao: {
        findMany: async () => salvas,
        upsert: (args) => ({ tipo: 'upsert', args }),
        deleteMany: (args) => ({ tipo: 'deleteMany', args }),
    },
    $transaction: async (operacoes) => { transacao = operacoes; },
} } });

const { corrigirSimulado, buscarSimulado, entregarSimulado } = await import('../services/simulado.js');

const alternativas = (questaoId, certa) => ['a', 'b', 'c'].map((letra, i) => ({
    id: questaoId * 10 + i, letra, texto: `Opção ${letra}`, correta: letra === certa,
}));

beforeEach(() => {
    mapa = { mapaId: 9, nome: 'ENEM 2024', simulado: true };
    questoes = [
        { questaoId: 1, enunciado: 'Q1', fonte: 'ENEM 2024', resolucao: 'Porque sim', alternativa: alternativas(1, 'b') },
        { questaoId: 2, enunciado: 'Q2', fonte: null, resolucao: null, alternativa: alternativas(2, 'a') },
        { questaoId: 3, enunciado: 'Q3', fonte: null, resolucao: 'R3', alternativa: alternativas(3, 'c') },
    ];
    salvas = [];
    transacao = null;
});

test('corrige: acerto, erro, em branco e alternativa de outra questão', () => {
    const r = corrigirSimulado(questoes, [
        { questaoId: 1, alternativaId: 11 }, // b, certa
        { questaoId: 2, alternativaId: 22 }, // c, errada
        { questaoId: 3, alternativaId: 11 }, // alternativa da questão 1: vale como em branco
    ]);
    assert.equal(r.total, 3);
    assert.equal(r.acertos, 1);
    assert.equal(r.emBranco, 1);
    assert.deepEqual(r.itens.map((i) => [i.letraMarcada, i.letraCorreta, i.correta]), [
        ['b', 'b', true], ['c', 'a', false], [null, 'c', false],
    ]);
    assert.equal(r.itens[0].resolucao, 'Porque sim');
});

test('a prova não entrega o gabarito nem a resolução antes da entrega', async () => {
    const s = await buscarSimulado(9, 7, false);
    assert.equal(s.entrega, null);
    for (const q of s.questoes) {
        assert.equal('resolucao' in q, false);
        for (const a of q.alternativas) assert.equal('correta' in a, false);
    }
});

test('mapa comum não é simulado', async () => {
    mapa = { mapaId: 9, nome: 'Frações', simulado: false };
    assert.equal(await buscarSimulado(9, 7, false), null);
    assert.equal((await entregarSimulado(9, 7, false, [])).status, 404);
});

test('entrega salva as respondidas, apaga as em branco e marca a espera', async () => {
    const r = await entregarSimulado(9, 7, false, [
        { questaoId: 1, alternativaId: 11 },
        { questaoId: 2, alternativaId: 22 },
    ]);
    assert.equal(r.acertos, 1);
    assert.ok(r.refazerEm > new Date());

    const upserts = transacao.filter((o) => o.tipo === 'upsert').map((o) => o.args);
    assert.deepEqual(upserts.map((u) => u.where.usuarioId_questaoId.questaoId), [1, 2]);
    // Acertou: nada de espera; errou: viu o gabarito
    assert.equal(upserts[0].update.resolucaoVistaEm, null);
    assert.ok(upserts[1].update.resolucaoVistaEm instanceof Date);

    const apagar = transacao.find((o) => o.tipo === 'deleteMany').args;
    assert.deepEqual(apagar.where, { usuarioId: 7, questaoId: { in: [3] } });
});

test('não deixa refazer antes de 24 h (admin pode)', async () => {
    salvas = [{ questaoId: 1, alternativaId: 11, respondidaEm: new Date(Date.now() - 60 * 60 * 1000) }];
    const aluno = await entregarSimulado(9, 7, false, [{ questaoId: 1, alternativaId: 10 }]);
    assert.equal(aluno.status, 409);
    assert.equal(transacao, null);

    const admin = await entregarSimulado(9, 1, true, [{ questaoId: 1, alternativaId: 10 }]);
    assert.equal(admin.status, undefined);
    assert.ok(transacao);
});

test('depois de 24 h refaz, e a correção salva volta na prova', async () => {
    salvas = [{ questaoId: 3, alternativaId: 32, respondidaEm: new Date(Date.now() - 25 * 60 * 60 * 1000) }];
    const s = await buscarSimulado(9, 7, false);
    assert.equal(s.entrega.acertos, 1);
    assert.equal(s.entrega.emBranco, 2);
    assert.equal(s.entrega.refazerEm, null);

    const r = await entregarSimulado(9, 7, false, [{ questaoId: 1, alternativaId: 11 }]);
    assert.equal(r.status, undefined);
});

test('visitante faz e vê a correção, mas nada é salvo', async () => {
    const r = await entregarSimulado(9, null, false, [{ questaoId: 1, alternativaId: 11 }]);
    assert.equal(r.visitante, true);
    assert.equal(r.acertos, 1);
    assert.equal(transacao, null);
});

test('respostas inválidas e simulado sem questões', async () => {
    assert.equal((await entregarSimulado(9, 7, false, 'abc')).status, 400);
    questoes = [];
    assert.equal((await entregarSimulado(9, 7, false, [])).status, 400);
});
