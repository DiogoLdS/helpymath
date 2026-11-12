// Revisar erros: as questões erradas do aluno, agrupadas por mapa na ordem da trilha.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let pedido = null;
let consulta = null;
mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    usuarioquestao: {
        findMany: async (argumentos) => {
            consulta = argumentos;
            const { where } = argumentos;
            pedido = where;
            const questao = (questaoId, mapa) => ({
                respondidaEm: new Date(),
                questao: { questaoId, enunciado: `Questão ${questaoId}`, alternativa: [{ id: 1, letra: 'a', texto: 'x' }], mapaconceitual: mapa },
            });
            const segundo = { mapaId: 1, nome: 'Frações', nivel: 'basico', ordem: 5 };
            const primeiro = { mapaId: 2, nome: 'Números', nivel: 'basico', ordem: 1 };
            return [questao(10, segundo), questao(11, primeiro), questao(12, segundo)];
        },
    },
} } });

const { questoesParaRevisar } = await import('../services/revisao.js');

test('busca só as respostas erradas do próprio aluno', async () => {
    await questoesParaRevisar(7);
    assert.deepEqual(pedido, { usuarioId: 7, correta: false });
});

test('agrupa por mapa, na ordem da trilha', async () => {
    const r = await questoesParaRevisar(7);
    assert.equal(r.total, 3);
    assert.deepEqual(r.mapas.map((m) => [m.nome, m.questoes.map((q) => q.questaoId)]),
        [['Números', [11]], ['Frações', [10, 12]]]);
    assert.ok(!('ordem' in r.mapas[0]), 'o campo interno de ordem não vai pro navegador');
});

test('a consulta não pede o campo "correta" das alternativas (o aluno refaz a questão)', async () => {
    await questoesParaRevisar(7);
    const camposDaAlternativa = consulta.select.questao.select.alternativa.select;
    assert.deepEqual(Object.keys(camposDaAlternativa).sort(), ['id', 'letra', 'texto']);
});
