// Resolução das questões: prazo pra refazer depois de ver a resposta e validação dos campos do admin.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ESPERA_MS, MAX_FONTE, MAX_RESOLUCAO, liberadaEm, validarCamposQuestao } from '../services/resolucao.js';

test('resolução: quem não viu pode refazer na hora', () => {
    assert.equal(liberadaEm(null), null);
    assert.equal(liberadaEm(undefined), null);
});

test('resolução: viu agora, só refaz depois de 24 horas', () => {
    const vista = new Date('2026-11-12T15:00:00Z');
    const umaHoraDepois = new Date(vista.getTime() + 60 * 60 * 1000);
    assert.equal(liberadaEm(vista, umaHoraDepois).getTime(), vista.getTime() + ESPERA_MS);

    const umDiaDepois = new Date(vista.getTime() + ESPERA_MS);
    assert.equal(liberadaEm(vista, umDiaDepois), null, 'passou o prazo: libera');
});

test('campos da questão: limpa espaços e vazio vira null', () => {
    assert.deepEqual(validarCamposQuestao({ resolucao: '  x = 2  ', fonte: '  ENEM   2023 ' }).dados, { resolucao: 'x = 2', fonte: 'ENEM 2023' });
    assert.deepEqual(validarCamposQuestao({ resolucao: '   ', fonte: '' }).dados, { resolucao: null, fonte: null });
    assert.deepEqual(validarCamposQuestao({}).dados, {}, 'o que não veio não é mexido');
});

test('campos da questão: recusa textos longos demais ou de tipo errado', () => {
    assert.match(validarCamposQuestao({ resolucao: 'a'.repeat(MAX_RESOLUCAO + 1) }).erro, /resolução/);
    assert.match(validarCamposQuestao({ fonte: 'a'.repeat(MAX_FONTE + 1) }).erro, /fonte/);
    assert.match(validarCamposQuestao({ fonte: 2023 }).erro, /Fonte/);
});
