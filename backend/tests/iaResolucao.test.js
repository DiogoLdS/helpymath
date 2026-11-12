// Resolução com IA: tudo com uma OpenRouter falsa (nenhuma chamada de verdade, nenhuma cota gasta).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    ErroIA, MAX_POR_HORA, OPENROUTER_URL, gerarResolucao, lerRespostaIA, limparResolucao,
    montarMensagemUsuario, registrarPedido, validarPedido
} from '../services/iaResolucao.js';

const questao = {
    enunciado: 'Quanto é $2+3$?',
    alternativas: [{ letra: 'A', texto: '4' }, { letra: 'b', texto: ' 5 ' }],
    letraCorreta: 'b'
};
const env = { OPENROUTER_API_KEY: 'chave-de-teste' };

// Fetch falso: guarda os pedidos e responde o que cada teste mandar
function openrouterFalsa(...respostas) {
    const pedidos = [];
    const fazerFetch = async (url, opcoes) => {
        pedidos.push({ url, corpo: JSON.parse(opcoes.body), headers: opcoes.headers });
        const r = respostas.shift();
        return {
            ok: r.status === 200,
            status: r.status,
            json: async () => r.json,
            text: async () => r.texto ?? ''
        };
    };
    return { fazerFetch, pedidos };
}
const respostaIA = (conteudo, model = 'modelo/gratis') => ({ status: 200, json: { model, choices: [{ message: { content: conteudo } }] } });

test('pedido: confere enunciado, alternativas e a correta marcada', () => {
    const { dados } = validarPedido(questao);
    assert.deepEqual(dados, { enunciado: 'Quanto é $2+3$?', alternativas: [{ letra: 'A', texto: '4' }, { letra: 'B', texto: '5' }], letraCorreta: 'B' });

    assert.match(validarPedido({ ...questao, enunciado: '  ' }).erro, /enunciado/);
    assert.match(validarPedido({ ...questao, alternativas: [questao.alternativas[0]] }).erro, /2 a 5/);
    assert.match(validarPedido({ ...questao, alternativas: [{ letra: 'A', texto: '' }, { letra: 'B', texto: '5' }] }).erro, /Preencha/);
    assert.match(validarPedido({ ...questao, letraCorreta: 'C' }).erro, /Marque/);
});

test('mensagem pra IA leva enunciado, alternativas e a letra certa', () => {
    const texto = montarMensagemUsuario(validarPedido(questao).dados);
    assert.match(texto, /Quanto é \$2\+3\$\?/);
    assert.match(texto, /A\) 4\nB\) 5/);
    assert.match(texto, /Alternativa correta: B$/);
});

test('texto da IA: tira Markdown e respeita o limite', () => {
    assert.equal(limparResolucao('## Passo 1\n**Some** os números:\n- $2+3=5$\n\n\n\nFim'), 'Passo 1\nSome os números:\n$2+3=5$\n\nFim');
    assert.equal(limparResolucao('a'.repeat(6000)).length, 5000);
});

test('resposta da IA: lê JSON, JSON dentro de ```json e texto puro', () => {
    assert.deepEqual(lerRespostaIA('{"resolucao":"x","letraEncontrada":"B"}'), { resolucao: 'x', letraEncontrada: 'B' });
    assert.deepEqual(lerRespostaIA('```json\n{"resolucao":"y","letraEncontrada":"A"}\n```'), { resolucao: 'y', letraEncontrada: 'A' });
    assert.deepEqual(lerRespostaIA('Só texto'), { resolucao: 'Só texto', letraEncontrada: null });
});

test('gera a resolução: manda a chave, o prompt e o formato JSON; confere a letra', async () => {
    const { fazerFetch, pedidos } = openrouterFalsa(respostaIA('{"resolucao":"Somando: $2+3=5$.","letraEncontrada":"B"}'));
    const r = await gerarResolucao(validarPedido(questao).dados, { fazerFetch, env });

    assert.deepEqual(r, { resolucao: 'Somando: $2+3=5$.', letraEncontrada: 'B', confere: true, modelo: 'modelo/gratis' });
    assert.equal(pedidos[0].url, OPENROUTER_URL);
    assert.equal(pedidos[0].headers.Authorization, 'Bearer chave-de-teste');
    assert.equal(pedidos[0].corpo.model, 'openrouter/free');
    assert.equal(pedidos[0].corpo.response_format.type, 'json_schema');
    assert.match(pedidos[0].corpo.messages[1].content, /Alternativa correta: B/);
});

test('IA chegou noutra letra: avisa que não confere', async () => {
    const { fazerFetch } = openrouterFalsa(respostaIA('{"resolucao":"Dá 4.","letraEncontrada":"a"}'));
    const r = await gerarResolucao(validarPedido(questao).dados, { fazerFetch, env });
    assert.equal(r.letraEncontrada, 'A');
    assert.equal(r.confere, false);
});

test('sem modelo grátis que aceite JSON: tenta de novo sem o formato', async () => {
    const { fazerFetch, pedidos } = openrouterFalsa({ status: 404, texto: 'No endpoints found' }, respostaIA('Resolução em texto.'));
    const r = await gerarResolucao(validarPedido(questao).dados, { fazerFetch, env });
    assert.equal(pedidos.length, 2);
    assert.equal(pedidos[1].corpo.response_format, undefined);
    assert.equal(r.resolucao, 'Resolução em texto.');
    assert.equal(r.confere, true, 'sem letra informada não acusa diferença');
});

test('erros viram mensagens claras (sem expor a resposta técnica)', async () => {
    const pedido = validarPedido(questao).dados;
    await assert.rejects(gerarResolucao(pedido, { fazerFetch: async () => { throw new Error('x'); }, env: {} }),
        (e) => e instanceof ErroIA && e.status === 503 && /OPENROUTER_API_KEY/.test(e.message));

    const limite = openrouterFalsa({ status: 429, texto: 'rate limited: segredo' });
    await assert.rejects(gerarResolucao(pedido, { fazerFetch: limite.fazerFetch, env }),
        (e) => e.status === 429 && !e.message.includes('segredo') && e.detalhe.includes('segredo'));

    const fora = { fazerFetch: async () => { throw new Error('timeout'); }, env };
    await assert.rejects(gerarResolucao(pedido, fora), (e) => e.status === 504);

    const vazia = openrouterFalsa(respostaIA(''));
    await assert.rejects(gerarResolucao(pedido, { fazerFetch: vazia.fazerFetch, env }), /vazio/);
});

test('limite de uso: até MAX_POR_HORA pedidos por admin por hora', () => {
    const agora = 1_000_000;
    for (let i = 0; i < MAX_POR_HORA; i++) assert.equal(registrarPedido(99, agora + i), 0);
    assert.equal(registrarPedido(99, agora + 100), 60, 'o próximo espera ~1 hora');
    assert.equal(registrarPedido(98, agora), 0, 'outro admin não é afetado');
    assert.equal(registrarPedido(99, agora + 60 * 60 * 1000), 0, 'passada a hora, libera');
});
