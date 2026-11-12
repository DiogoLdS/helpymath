// Admin reordenando os mapas da trilha (setinhas do painel), com um banco falso na memória.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let mapas;
const ordenar = (lista) => [...lista].sort((a, b) => a.ordem - b.ordem || a.mapaId - b.mapaId);

mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    mapaconceitual: {
        findUnique: async ({ where }) => mapas.find((m) => m.mapaId === where.mapaId) ?? null,
        findMany: async ({ where }) => ordenar(mapas.filter((m) => m.nivel === where.nivel)),
        aggregate: async () => ({ _max: { ordem: Math.max(...mapas.map((m) => m.ordem)) } }),
        update: ({ where, data }) => async () => Object.assign(mapas.find((m) => m.mapaId === where.mapaId), data),
    },
    $transaction: async (operacoes) => { for (const op of operacoes) await op(); },
} } });

const { moverMapa } = await import('../services/ordemMapas.js');
const nomes = (nivel) => ordenar(mapas.filter((m) => m.nivel === nivel)).map((m) => m.nome);

test('sobe e desce dentro do nível, sem mexer nos mapas de outro nível', async () => {
    mapas = [
        { mapaId: 1, nome: 'Frações', nivel: 'basico', ordem: 1 },
        { mapaId: 2, nome: 'Probabilidade', nivel: 'basico', ordem: 2 },
        { mapaId: 3, nome: 'Função Afim', nivel: 'intermediario', ordem: 3 },
        { mapaId: 4, nome: 'Potências', nivel: 'basico', ordem: 4 },
        { mapaId: 5, nome: 'Equações', nivel: 'intermediario', ordem: 5 },
    ];
    assert.equal(await moverMapa(4, 'cima'), true);
    assert.deepEqual(nomes('basico'), ['Frações', 'Potências', 'Probabilidade']);
    assert.equal(await moverMapa(4, 'cima'), true);
    assert.deepEqual(nomes('basico'), ['Potências', 'Frações', 'Probabilidade']);
    assert.equal(await moverMapa(4, 'cima'), false, 'já é o primeiro');
    assert.deepEqual(nomes('intermediario'), ['Função Afim', 'Equações']);
    assert.equal(await moverMapa(3, 'baixo'), true);
    assert.deepEqual(nomes('intermediario'), ['Equações', 'Função Afim']);
    assert.equal(await moverMapa(99, 'cima'), null, 'mapa que não existe');
});

test('mapas antigos com a mesma ordem (todos 0) viram uma sequência certinha', async () => {
    mapas = [
        { mapaId: 1, nome: 'A', nivel: 'basico', ordem: 0 },
        { mapaId: 2, nome: 'B', nivel: 'basico', ordem: 0 },
        { mapaId: 3, nome: 'C', nivel: 'basico', ordem: 0 },
    ];
    assert.equal(await moverMapa(3, 'cima'), true);
    assert.deepEqual(nomes('basico'), ['A', 'C', 'B']);
});
