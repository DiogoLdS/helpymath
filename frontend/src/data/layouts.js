// Posição dos conteúdos (botões) no mapa conceitual.
// O mapa é um grid 3x3: a célula do meio (linha 2, coluna 2) é sempre do título,
// e os conteúdos ocupam as 8 células ao redor dele.
//
// Chave = quantidade de conteúdos que o mapa tem.
// Cada item do array é uma "variante" de design; a página sorteia uma a cada vez que o mapa abre.
// Cada variante declara o tamanho do grid (rows/cols) e a posição {row, col} de cada
// conteúdo, na mesma ordem em que os conteúdos aparecem pro mapa.

// Máximo de conteúdos que cabem no grid 3x3 (a célula do meio é do título).
export const MAX_CONTEUDOS = 8;

// As 8 células ao redor do título, em ordem de leitura (esquerda pra direita, de cima pra baixo).
// Seguindo essa ordem, o primeiro conteúdo sempre fica mais em cima/à esquerda que o segundo, e assim por diante.
const CELULAS = [
    { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
    { row: 2, col: 1 },                     { row: 2, col: 3 },
    { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
];

// Todas as formas de escolher `quantidade` células entre as 8 (mantendo a ordem de leitura)
function combinacoes(lista, quantidade, inicio = 0) {
    if (quantidade === 0) return [[]];
    const resultado = [];
    for (let i = inicio; i <= lista.length - quantidade; i++) {
        for (const resto of combinacoes(lista, quantidade - 1, i + 1)) {
            resultado.push([lista[i], ...resto]);
        }
    }
    return resultado;
}

// Só entram as disposições "bonitas", que obedecem às duas regras:
// 1) são espelhadas: iguais dos dois lados (esquerda/direita), de cima e de baixo,
//    ou girando meia volta em torno do título;
// 2) não pesam pra um lado: contando quantos botões ficam de cada lado do título,
//    a diferença é no máximo 1 (tanto entre esquerda e direita quanto entre cima e baixo).
// Assim não aparece, por exemplo, mapa com tudo na coluna da esquerda ou tudo na linha de cima.
const temCelula = (posicoes, row, col) => posicoes.some((p) => p.row === row && p.col === col);
const espelhada = (posicoes, espelho) => posicoes.every((p) => temCelula(posicoes, ...espelho(p)));

export function disposicaoBonita(posicoes) {
    const simetrica =
        espelhada(posicoes, (p) => [p.row, 4 - p.col]) ||     // esquerda ↔ direita
        espelhada(posicoes, (p) => [4 - p.row, p.col]) ||     // cima ↔ baixo
        espelhada(posicoes, (p) => [4 - p.row, 4 - p.col]);   // meia volta
    const pesoVertical = posicoes.reduce((soma, p) => soma + (p.row - 2), 0);
    const pesoHorizontal = posicoes.reduce((soma, p) => soma + (p.col - 2), 0);
    return simetrica && Math.abs(pesoVertical) <= 1 && Math.abs(pesoHorizontal) <= 1;
}

// Monta as variantes de 1 a 8 conteúdos: todas as disposições bonitas.
// (1: 4 variantes, 2: 4, 3: 8, 4: 6, 5: 8, 6: 4, 7: 4, 8: 1)
const layouts = {};
for (let quantidade = 1; quantidade <= MAX_CONTEUDOS; quantidade++) {
    layouts[quantidade] = combinacoes(CELULAS, quantidade)
        .filter(disposicaoBonita)
        .map((posicoes) => ({ rows: 3, cols: 3, posicoes }));
}

// Layout de reserva (caso alguma quantidade fique sem variante): primeiro os cantos,
// depois meio de cima/baixo, depois as laterais.
const ordemPadrao = [
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
    { row: 1, col: 2 },
    { row: 3, col: 2 },
    { row: 2, col: 1 },
    { row: 2, col: 3 },
];

export function gerarLayoutPadrao(quantidade) {
    if (quantidade < 1 || quantidade > MAX_CONTEUDOS) return null;

    return {
        rows: 3,
        cols: 3,
        posicoes: ordemPadrao.slice(0, quantidade),
    };
}

export default layouts;
