// Resolução das questões: validação dos campos que o admin manda.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_FONTE, MAX_RESOLUCAO, validarCamposQuestao } from '../services/resolucao.js';

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
