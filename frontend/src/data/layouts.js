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

// Uma disposição fica torta quando todos os botões caem no mesmo lado do título
// (todos na linha de cima, todos na de baixo, todos na coluna da esquerda ou todos na da direita):
// o mapa fica com um lado vazio. Com 1 botão não tem como equilibrar, então vale qualquer célula.
export function disposicaoEquilibrada(posicoes) {
    if (posicoes.length < 2) return true;
    const mesmoLado = (campo, valor) => posicoes.every((p) => p[campo] === valor);
    return !(mesmoLado("row", 1) || mesmoLado("row", 3) || mesmoLado("col", 1) || mesmoLado("col", 3));
}

// Monta as variantes de 1 a 8 conteúdos: todas as disposições equilibradas.
// (1: 8 variantes, 2: 16, 3: 52, 4: 70, 5: 56, 6: 28, 7: 8, 8: 1)
const layouts = {};
for (let quantidade = 1; quantidade <= MAX_CONTEUDOS; quantidade++) {
    layouts[quantidade] = combinacoes(CELULAS, quantidade)
        .filter(disposicaoEquilibrada)
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
