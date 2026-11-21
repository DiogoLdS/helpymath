// Trava por nível da trilha, com um banco falso na memória.
// Regra: o aluno começa com o nível dele e os de baixo liberados; o de cima só abre quando ele conclui
// todos os mapas do nível de baixo. O Treino é aberto pra todos.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// Mapas sem conteúdos nem questões: estando liberado, o mapa já conta como concluído...
// ...a não ser que esteja na lista "pendente" (tem um conteúdo que o aluno ainda não fez)
let mapas;
let nivelDoAluno;
let pendentes;

mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {
    mapaconceitual: { findMany: async () => mapas },
    usuario: { findUnique: async () => ({ nivel: nivelDoAluno }) },
    mapaconteudo: {
        findMany: async ({ where }) => (pendentes.includes(where.mapaId) ? [{ conteudoId: where.mapaId }] : []),
    },
    usuarioconteudo: { findMany: async () => [] },
    questao: { findMany: async () => [] },
    usuarioquestao: { findMany: async () => [] },
} } });

const { situacaoDosMapas } = await import('../services/progresso.js');

const MAPAS = [
    { mapaId: 1, nome: 'Frações', nivel: 'basico' },
    { mapaId: 2, nome: 'Potências', nivel: 'basico' },
    { mapaId: 3, nome: 'Função Afim', nivel: 'intermediario' },
    { mapaId: 4, nome: 'Logaritmo', nivel: 'avancado' },
    { mapaId: 5, nome: 'Simulado', nivel: 'treino' },
];

async function situacao({ nivel, faltando = [] }) {
    mapas = MAPAS;
    nivelDoAluno = nivel;
    pendentes = faltando;
    const lista = await situacaoDosMapas(7, false);
    return Object.fromEntries(lista.map((m) => [m.nome, m]));
}

test('Básico com o nível incompleto: só o Básico e o Treino abrem', async () => {
    const s = await situacao({ nivel: 'basico', faltando: [2] });
    assert.equal(s['Frações'].liberado, true);
    assert.equal(s['Potências'].liberado, true);
    assert.equal(s['Função Afim'].liberado, false);
    assert.deepEqual(s['Função Afim'].nivelPendente, { nivel: 'basico', nome: 'Básico' });
    assert.equal(s['Logaritmo'].liberado, false);
    assert.deepEqual(s['Logaritmo'].nivelPendente, { nivel: 'intermediario', nome: 'Intermediário' });
    assert.equal(s['Simulado'].liberado, true);
});

test('Básico concluído inteiro: abre o Intermediário (e o Avançado só depois dele)', async () => {
    const s = await situacao({ nivel: 'basico', faltando: [3] });
    assert.equal(s['Função Afim'].liberado, true);
    assert.equal(s['Função Afim'].liberadoPorConclusao, true);
    assert.equal(s['Logaritmo'].liberado, false);
    assert.deepEqual(s['Logaritmo'].nivelPendente, { nivel: 'intermediario', nome: 'Intermediário' });
});

test('Intermediário: pode fazer o Básico e o Intermediário, mas não o Avançado', async () => {
    const s = await situacao({ nivel: 'intermediario', faltando: [1, 3] });
    assert.equal(s['Frações'].liberado, true);
    assert.equal(s['Função Afim'].liberado, true);
    assert.equal(s['Função Afim'].liberadoPorConclusao, false);
    assert.equal(s['Logaritmo'].liberado, false);
    assert.equal(s['Simulado'].liberado, true);
});

test('Avançado: todos os níveis abertos, mesmo sem ter feito nada', async () => {
    const s = await situacao({ nivel: 'avancado', faltando: [1, 2, 3, 4] });
    for (const nome of ['Frações', 'Função Afim', 'Logaritmo', 'Simulado']) assert.equal(s[nome].liberado, true, nome);
    assert.equal(s['Potências'].liberado, false); // a ordem dentro do nível continua valendo
});

test('sem nível escolhido começa no Básico', async () => {
    const s = await situacao({ nivel: null, faltando: [1] });
    assert.equal(s['Frações'].liberado, true);
    assert.equal(s['Potências'].liberado, false); // continua a ordem dentro do nível
    assert.equal(s['Função Afim'].liberado, false);
    assert.equal(s['Simulado'].liberado, true);
});

test('admin e visitante veem tudo liberado', async () => {
    mapas = MAPAS;
    nivelDoAluno = 'basico';
    pendentes = [1, 2, 3];
    assert.ok((await situacaoDosMapas(7, true)).every((m) => m.liberado && !m.nivelPendente));
    assert.ok((await situacaoDosMapas(null, false)).every((m) => m.liberado && !m.nivelPendente));
});
