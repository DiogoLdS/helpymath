// Funções de apoio do frontend que não dependem do navegador (rodam direto no Node).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buscarMapas, normalizar } from '../src/Components/Mapas/buscaUtils.js';
import { acertosNecessarios, mapaAtual, porcentagemDoMapa, recomendacao } from '../src/Components/Mapas/trilhaUtils.js';
import { formulasNaLinha, temFormula, textoSemFormulas } from '../src/Components/Formulas/formulaUtils.js';
import { idVideoYoutube, linkValido, montarMarcacaoMidia } from '../src/Components/Midia/midiaUtils.js';
import { linkDestinoValido, linkExterno, linkInterno } from '../src/utils/linkDestino.js';
import { decodificarToken } from '../src/utils/auth.js';
import { iniciais, inicioDaSemana, pontos, resumoDaSemana, sequenciaDeDias } from '../src/Components/Perfil/perfilUtils.js';

// ---------- Busca de mapas ----------

const mapasDaBusca = [
    { mapaId: 1, nome: 'Frações', conteudos: ['O que é fração', 'Frações equivalentes'] },
    { mapaId: 2, nome: 'Porcentagem', conteudos: ['Descontos e aumentos'] },
    { mapaId: 3, nome: 'Função Afim', conteudos: ['Gráfico da função afim', 'Raiz da função'] },
];

test('busca: ignora acento e maiúscula', () => {
    assert.equal(normalizar('  FUNÇÃO '), 'funcao');
    assert.deepEqual(buscarMapas(mapasDaBusca, 'funcao').map((r) => r.mapa.mapaId), [3]);
    assert.deepEqual(buscarMapas(mapasDaBusca, 'DESCONTO').map((r) => [r.mapa.mapaId, r.conteudos]), [[2, ['Descontos e aumentos']]]);
});

test('busca: todas as palavras precisam aparecer; vazio ou sem resultado = lista vazia', () => {
    assert.deepEqual(buscarMapas(mapasDaBusca, 'grafico afim').map((r) => r.mapa.mapaId), [3]);
    assert.deepEqual(buscarMapas(mapasDaBusca, '   '), []);
    assert.deepEqual(buscarMapas(mapasDaBusca, 'trigonometria'), []);
});

// ---------- Trilha ----------

const progresso = (dados) => ({ conteudosFeitos: 0, conteudosTotal: 4, questoesRespondidas: 0, questoesAcertos: 0, questoesTotal: 5, ...dados });

test('trilha: 60% de acertos arredondado pra cima', () => {
    assert.equal(acertosNecessarios(5), 3);
    assert.equal(acertosNecessarios(10), 6);
    assert.equal(acertosNecessarios(1), 1);
});

test('trilha: porcentagem = metade conteúdos, metade meta das questões', () => {
    assert.equal(porcentagemDoMapa({ concluido: true }), 100);
    assert.equal(porcentagemDoMapa({ progresso: null }), 0);
    assert.equal(porcentagemDoMapa({ progresso: progresso({ conteudosFeitos: 2 }) }), 25);
    assert.equal(porcentagemDoMapa({ progresso: progresso({ conteudosFeitos: 4, questoesAcertos: 3 }) }), 100);
    // mapa sem questões: só os conteúdos contam
    assert.equal(porcentagemDoMapa({ progresso: progresso({ conteudosFeitos: 1, questoesTotal: 0 }) }), 25);
});

test('trilha: mapa da vez é o primeiro liberado e não concluído', () => {
    const lista = [
        { mapaId: 1, liberado: true, concluido: true },
        { mapaId: 2, liberado: true, concluido: false },
        { mapaId: 3, liberado: false, concluido: false },
    ];
    assert.equal(mapaAtual(lista).mapaId, 2);
    assert.equal(mapaAtual([{ mapaId: 1, liberado: true, concluido: true }]), null);
});

test('Helpy: recomenda começar o próximo mapa do nível', () => {
    const niveis = [{ chave: 'basico', nome: 'Básico' }, { chave: 'intermediario', nome: 'Intermediário' }];
    const mapas = [
        { mapaId: 1, nome: 'Frações', nivel: 'basico', liberado: true, concluido: true, progresso: progresso({ conteudosFeitos: 4, questoesAcertos: 5, questoesRespondidas: 5 }) },
        { mapaId: 2, nome: 'Porcentagem', nivel: 'basico', liberado: true, concluido: false, progresso: progresso({}) },
    ];
    const r = recomendacao(mapas, niveis, null);
    assert.deepEqual(r.acao, { rotulo: 'Começar Porcentagem', para: '/mapas/2' });
    assert.equal(r.estatisticas.mapasConcluidos, 1);
});

test('Helpy: nível acabado sugere o próximo nível', () => {
    const niveis = [{ chave: 'basico', nome: 'Básico' }, { chave: 'intermediario', nome: 'Intermediário' }];
    const mapas = [
        { mapaId: 1, nome: 'Frações', nivel: 'basico', liberado: true, concluido: true, progresso: null },
        { mapaId: 3, nome: 'Função Afim', nivel: 'intermediario', liberado: true, concluido: false, progresso: null },
    ];
    const r = recomendacao(mapas, niveis, 'basico');
    assert.deepEqual(r.acao, { rotulo: 'Ir para Intermediário', para: '/mapas?nivel=intermediario' });
});

// ---------- Fórmulas e mídia ----------

test('fórmulas: detecta, tira os $ e passa bloco pra linha', () => {
    assert.equal(temFormula('Quanto é $\\frac{1}{2}$?'), true);
    assert.equal(temFormula('custa 5 reais'), false);
    assert.equal(textoSemFormulas('Área: $$\\pi r^2$$'), 'Área: \\pi r^2');
    assert.equal(formulasNaLinha('Veja:\n$$x^2$$\nfim'), 'Veja: $x^2$ fim');
});

test('mídia: só links http(s) e id do YouTube em vários formatos', () => {
    assert.equal(linkValido('javascript:alert(1)'), false);
    assert.equal(linkValido('https://site.com/foto.png'), true);
    for (const url of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://youtube.com/shorts/dQw4w9WgXcQ']) {
        assert.equal(idVideoYoutube(url), 'dQw4w9WgXcQ', url);
    }
    assert.equal(idVideoYoutube('https://vimeo.com/123'), null);
    assert.equal(montarMarcacaoMidia('imagem', ' https://x.com/a.png ', 'linha1\nlinha2]]'), '\n[[imagem:https://x.com/a.png|linha1 linha2] ]]]\n');
});

test('links dos botões direcionais: externos, internos e os perigosos', () => {
    assert.equal(linkExterno('https://phet.colorado.edu'), true);
    assert.equal(linkInterno('/mapas/3'), true);
    assert.equal(linkInterno('//site-malicioso.com'), false);
    assert.equal(linkDestinoValido('javascript:alert(1)'), false);
});

// ---------- Login no navegador ----------

test('token: lê o conteúdo (com acento) e não quebra com lixo', () => {
    const parte = Buffer.from(JSON.stringify({ usuarioId: 5, nome: 'Cecília' })).toString('base64url');
    assert.deepEqual(decodificarToken(`x.${parte}.y`), { usuarioId: 5, nome: 'Cecília' });
    assert.equal(decodificarToken('lixo'), null);
    assert.equal(decodificarToken(''), null);
});

// ---------- Perfil ----------

const dia = (texto) => new Date(`${texto}T12:00:00`);

test('perfil: semana começa na segunda e conta conteúdos da semana', () => {
    const quarta = dia('2026-11-11');
    assert.equal(inicioDaSemana(quarta).getDate(), 9); // segunda, 09/11
    assert.equal(inicioDaSemana(dia('2026-11-15')).getDate(), 9, 'domingo ainda é da mesma semana');

    const lista = [
        { tipo: 'conteudo', data: dia('2026-11-09') },
        { tipo: 'questao', data: dia('2026-11-11') },
        { tipo: 'conteudo', data: dia('2026-11-08') }, // domingo da semana anterior
    ];
    const r = resumoDaSemana(lista, quarta);
    assert.equal(r.conteudosNaSemana, 1);
    assert.equal(r.porDia.seg, 1);
    assert.equal(r.porDia.qua, 1);
});

test('perfil: sequência de dias não quebra se ainda não estudou hoje', () => {
    const hoje = dia('2026-11-12');
    const lista = ['2026-11-11', '2026-11-10', '2026-11-08'].map((d) => ({ data: dia(d) }));
    assert.equal(sequenciaDeDias(lista, hoje), 2);
    assert.equal(sequenciaDeDias([{ data: hoje }, ...lista], hoje), 3);
    assert.equal(sequenciaDeDias(lista, dia('2026-11-13')), 0, 'passou um dia inteiro sem estudar');
});

test('perfil: iniciais e pontos', () => {
    assert.equal(iniciais('Diogo Lima'), 'DL');
    assert.equal(iniciais('cecília'), 'C');
    assert.equal(iniciais('  '), '?');
    assert.equal(pontos({ conteudosConcluidos: 3, acertos: 4 }), 50);
});
