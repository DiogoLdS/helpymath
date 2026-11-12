// Regras que existem duas vezes (no backend e repetidas no frontend) precisam ter o mesmo valor.
// Se alguém mudar só de um lado, a tela mostraria uma coisa e o servidor faria outra.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module(new URL('../services/adapter.js', import.meta.url).href, { exports: { default: {} } });

const backendProgresso = await import('../services/progresso.js');
const backendRanking = await import('../services/ranking.js');
const backendPerfil = await import('../services/perfil.js');
const frontendTrilha = await import('../../frontend/src/Components/Mapas/trilhaUtils.js');
const frontendPerfil = await import('../../frontend/src/Components/Perfil/perfilUtils.js');

test('nota mínima pra concluir o mapa é a mesma nos dois lados', () => {
    assert.equal(frontendTrilha.NOTA_MINIMA, backendProgresso.NOTA_MINIMA);
});

test('pontos por conteúdo e por acerto são os mesmos nos dois lados', () => {
    assert.equal(frontendPerfil.PONTOS_POR_CONTEUDO, backendRanking.PONTOS_POR_CONTEUDO);
    assert.equal(frontendPerfil.PONTOS_POR_ACERTO, backendRanking.PONTOS_POR_ACERTO);
});

test('objetivos de estudo do perfil batem', () => {
    assert.deepEqual(frontendPerfil.OBJETIVOS.map((o) => o.chave).sort(), [...backendPerfil.OBJETIVOS].sort());
});
