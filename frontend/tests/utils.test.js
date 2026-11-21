// Funções de apoio do frontend que não dependem do navegador (rodam direto no Node).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buscarMapas, normalizar } from '../src/Components/Mapas/buscaUtils.js';
import { acertosNecessarios, mapaAtual, porcentagemDoMapa, recomendacao } from '../src/Components/Mapas/trilhaUtils.js';
import { formulasNaLinha, separarFormulas, temFormula, textoSemFormulas } from '../src/Components/Formulas/formulaUtils.js';
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

test('Helpy: nível trancado manda concluir o nível de baixo', () => {
    const niveis = [{ chave: 'basico', nome: 'Básico' }, { chave: 'intermediario', nome: 'Intermediário' }];
    const pendente = { nivel: 'basico', nome: 'Básico' };
    const mapas = [
        { mapaId: 1, nome: 'Frações', nivel: 'basico', liberado: true, concluido: false, progresso: null },
        { mapaId: 3, nome: 'Função Afim', nivel: 'intermediario', liberado: false, concluido: false, progresso: null, nivelPendente: pendente },
    ];
    const r = recomendacao(mapas, niveis, 'intermediario');
    assert.deepEqual(r.acao, { rotulo: 'Ir para Básico', para: '/mapas?nivel=basico' });
    assert.match(r.mensagem.map((p) => p.texto).join(''), /todos os mapas do Básico/);
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

// ---------- Resolução das questões ----------

test('resolução: diz quando a questão libera pra refazer', async () => {
    const { quandoLibera } = await import('../src/Components/Questoes/resolucaoUtils.js');
    const agora = new Date(2026, 10, 12, 15, 0);
    assert.match(quandoLibera(new Date(2026, 10, 13, 15, 0), agora), /^amanhã às 15:00$/);
    assert.match(quandoLibera(new Date(2026, 10, 12, 18, 30), agora), /^hoje às 18:30$/);
    assert.match(quandoLibera(new Date(2026, 10, 20, 9, 5), agora), /^em 20\/11\/2026 às 09:05$/);
});

// ---------- Simulações ----------

test('simulação função afim: fórmula, raiz, reta no quadro e desafios possíveis', async () => {
    const u = await import('../src/Components/Simulacoes/simulacoesUtils.js');
    assert.equal(u.latexFuncao(2, 1), 'f(x) = 2x + 1');
    assert.equal(u.latexFuncao(-1, -3), 'f(x) = -x - 3');
    assert.equal(u.latexFuncao(0.5, 0), 'f(x) = 0{,}5x');
    assert.equal(u.latexFuncao(0, 4), 'f(x) = 4');
    assert.equal(u.raizDaAfim(2, 1), -0.5);
    assert.equal(u.raizDaAfim(0, 3), null);
    assert.deepEqual(u.segmentoNoQuadro(2, 1), [[-4.5, -8], [3.5, 8]]);
    assert.equal(u.segmentoNoQuadro(0, 9), null, 'reta fora do quadro');
    assert.equal(u.numeroBR(-0.5), '-0,5');

    // Cada desafio tem resposta com os passos do controle (a de -5 a 5 e b de -6 a 6, de 0,5 em 0,5)
    for (const d of u.DESAFIOS) {
        let achou = false;
        for (let a = -5; a <= 5; a += 0.5) for (let b = -6; b <= 6; b += 0.5) if (d.pontos.every((p) => u.passaPor(a, b, p))) achou = true;
        assert.ok(achou, JSON.stringify(d.pontos));
    }
});

test('simulação dados: probabilidades somam 1 e a contagem soma os lançamentos', async () => {
    const u = await import('../src/Components/Simulacoes/simulacoesUtils.js');
    for (const n of [1, 2]) {
        const soma = u.probabilidadesTeoricas(n).reduce((s, t) => s + t.prob, 0);
        assert.ok(Math.abs(soma - 1) < 1e-12);
    }
    assert.equal(u.probabilidadesTeoricas(2).find((t) => t.valor === 7).casos, 6);

    // "Acaso" fixo: 0 vira face 1, 0.99 vira face 6
    const sequencia = [0, 0.99, 0.5, 0.5];
    let i = 0;
    const r = u.lancarVarias({ 7: 3 }, 2, 2, () => sequencia[i++]);
    assert.deepEqual(r.contagem, { 7: 4, 8: 1 });
    assert.deepEqual(r.ultimo, [4, 4]);
    assert.equal(u.porcentagem(1, 3), '33,3%');
    assert.equal(u.porcentagem(0, 0), '0%');
});

test('simulações: caminhos da lista são links internos válidos', async () => {
    const { default: lista } = await import('../src/data/simulacoes.js');
    for (const s of lista) assert.ok(linkInterno(s.caminho), s.caminho);
});

/* ---------- Recomendações com simulações (CU08) ---------- */

import { recomendacoes } from '../src/Components/Perfil/perfilUtils.js';
import { simulacaoDoMapa } from '../src/data/simulacoes.js';

test('simulação certa para o nome do mapa, com ou sem acento', () => {
    assert.equal(simulacaoDoMapa('PROBABILIDADE')?.caminho, '/simulacoes/dados');
    assert.equal(simulacaoDoMapa('Função Afim')?.caminho, '/simulacoes/funcao-afim');
    assert.equal(simulacaoDoMapa('funcao afim')?.caminho, '/simulacoes/funcao-afim');
    assert.equal(simulacaoDoMapa('Função Quadrática'), null);
});

test('recomendações: simulação logo depois do mapa para revisar, sem repetir', () => {
    const mapa = (mapaId, nome, extra = {}) => ({ mapaId, nome, liberado: true, concluido: false, ...extra });
    const mapas = [
        mapa(1, 'Probabilidade', { progresso: { conteudosFeitos: 2, conteudosTotal: 4, questoesRespondidas: 2, questoesAcertos: 1, questoesTotal: 2 } }),
        mapa(2, 'Probabilidade 2', { progresso: { conteudosFeitos: 1, conteudosTotal: 3, questoesRespondidas: 0 } }),
        mapa(3, 'Função Quadrática'),
    ];
    const r = recomendacoes(mapas);
    const tipos = r.map((x) => `${x.tipo}:${x.mapa.mapaId}`);
    const iSim = tipos.indexOf('simular:1');
    assert.ok(iSim > 0, `esperava uma simulação para o mapa 1 em ${tipos}`);
    assert.equal(r.filter((x) => x.tipo === 'simular').length, 1, 'a mesma simulação não pode aparecer duas vezes');
    assert.equal(r[iSim].para, '/simulacoes/dados');
    assert.ok(!tipos.includes('simular:3'), 'mapa sem simulação não ganha cartão de simulação');
});

/* ---------- Cifrão de dinheiro não é fórmula ---------- */

const resumo = (texto) => separarFormulas(texto).map((p) => `${p.tipo}:${p.conteudo}`);

test('R$ e US$ com número continuam texto', () => {
    assert.deepEqual(resumo('Custa R$ 8,00 mais R$ 1,50 por km'), ['texto:Custa R$ 8,00 mais R$ 1,50 por km']);
    assert.deepEqual(resumo('Paga US$10 e $x = 2$'), ['texto:Paga US$10 e ', 'linha:x = 2', 'texto:']);
    assert.equal(temFormula('Uma taxa de R$ 5,00 e outra de R$ 2,00'), false);
});

test('"$R$ 5,00$" digitado por engano vira dinheiro', () => {
    const texto = 'taxa fixa de $R$ 5,00$ mais $R$ 2,00$ por quilômetro';
    assert.deepEqual(resumo(texto), ['texto:taxa fixa de R$ 5,00 mais R$ 2,00 por quilômetro']);
});

test('fórmulas de verdade continuam funcionando', () => {
    assert.deepEqual(resumo('O raio $R$ vale 5'), ['texto:O raio ', 'linha:R', 'texto: vale 5']);
    assert.deepEqual(resumo(String.raw`$$P(A) = \frac{n(A)}{n(\Omega)}$$`), ['texto:', String.raw`bloco:P(A) = \frac{n(A)}{n(\Omega)}`, 'texto:']);
    assert.deepEqual(resumo(String.raw`Use \$ para escrever um cifrão`), ['texto:Use $ para escrever um cifrão']);
    assert.deepEqual(resumo(String.raw`Lucro: $L = R\$ 10 \cdot x$`), ['texto:Lucro: ', String.raw`linha:L = R\$ 10 \cdot x`, 'texto:']);
});

/* ---------- Sessão vencida ---------- */

import { tokenVencido } from '../src/utils/sessao.js';

test('token vencido é reconhecido pelo exp', () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = (exp) => `${b64({ alg: 'HS256' })}.${b64({ usuarioId: 1, exp })}.assinatura`;
    const agora = Date.UTC(2026, 10, 20, 12);
    assert.equal(tokenVencido(token(agora / 1000 - 60), agora), true);
    assert.equal(tokenVencido(token(agora / 1000 + 3600), agora), false);
    assert.equal(tokenVencido('isso-nao-e-token', agora), false);
});

test('explicação do nível escolhido no perfil', async () => {
    const { explicacaoDoNivel } = await import('../src/Components/Perfil/perfilUtils.js');
    const escada = [{ chave: 'basico', nome: 'Básico' }, { chave: 'intermediario', nome: 'Intermediário' }, { chave: 'avancado', nome: 'Avançado' }];
    assert.equal(explicacaoDoNivel('basico', escada), 'Básico fica liberado. O Intermediário abre quando você concluir todos os mapas do Básico. O Treino é livre.');
    assert.equal(explicacaoDoNivel('intermediario', escada), 'Básico e Intermediário ficam liberados. O Avançado abre quando você concluir todos os mapas do Intermediário. O Treino é livre.');
    assert.equal(explicacaoDoNivel('avancado', escada), 'Básico, Intermediário e Avançado ficam liberados. O Treino é livre.');
    assert.equal(explicacaoDoNivel(null, escada), explicacaoDoNivel('basico', escada));
});
