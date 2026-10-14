// Chave = quantidade de conteúdos (botões) que o mapa tem.
// Cada item do array é uma "variante" de design (o índice dela é o número sorteado em mapaConceitual.design).
// Cada variante declara o tamanho do grid CSS (rows/cols) e a posição {row, col} de cada
// conteúdo dentro desse grid, na mesma ordem em que os conteúdos aparecem pro mapa.
// O grid pode ser maior que a quantidade de botões (sobra célula vazia de propósito).
// O título do mapa NÃO entra aqui: fica numa posição absoluta e fixa, fora do grid, sempre no centro.
const layouts = {
    3: [
        // design 0: grid 2x3, dois em cima nas pontas, um embaixo no meio (simétrico)
        {
            rows: 3,
            cols: 3,
            posicoes: [
                { row: 1, col: 1 },
                { row: 1, col: 3 },
                { row: 3, col: 2 },
            ],
        },
    ],
    5: [
        // design 0: grid 3x3, dois em cima nas pontas, três embaixo (baseado no esboço "Probabilidades")
        {
            rows: 3,
            cols: 3,
            posicoes: [
                { row: 1, col: 1 },
                { row: 1, col: 3 },
                { row: 3, col: 1 },
                { row: 3, col: 2 },
                { row: 3, col: 3 },
            ],
        },
        {
            rows: 3,
            cols: 3,
            posicoes: [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
                { row: 1, col: 3 },
                { row: 3, col: 1 },
                { row: 3, col: 3 },
            ],
        }
    ],
};

// Máximo de conteúdos que cabem no grid 3x3 (a célula do meio é do título).
export const MAX_CONTEUDOS = 8;

// Layout de reserva para quantidades que não têm variante cadastrada acima (1, 2, 4, 6, 7, 8...).
// Ocupa as células ao redor do título: primeiro os cantos, depois meio de cima/baixo, depois as laterais.
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