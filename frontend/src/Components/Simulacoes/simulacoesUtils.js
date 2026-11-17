// Contas das simulações, separadas das telas (dá pra testar direto no Node).

// ---------- Números em português ----------

export function arredondar(numero, casas = 2) {
    const fator = 10 ** casas;
    const resultado = Math.round(numero * fator) / fator;
    return Object.is(resultado, -0) ? 0 : resultado;
}

// 0.5 -> "0,5"   -2 -> "-2"   1/3 -> "0,33"
export function numeroBR(numero, casas = 2) {
    return arredondar(numero, casas).toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

// Número para LaTeX: vírgula decimal sem espaço extra ("0{,}5")
const numeroLatex = (numero) => numeroBR(numero).replace(",", "{,}");

// ---------- Função afim: f(x) = ax + b ----------

export const LIMITE = 8; // o plano vai de -8 a 8 nos dois eixos

// f(x) = 2x + 1, f(x) = -x - 3, f(x) = 4 ...
export function latexFuncao(a, b) {
    let termoX = "";
    if (a === 1) termoX = "x";
    else if (a === -1) termoX = "-x";
    else if (a !== 0) termoX = `${numeroLatex(a)}x`;

    if (!termoX) return `f(x) = ${numeroLatex(b)}`;
    if (b === 0) return `f(x) = ${termoX}`;
    return `f(x) = ${termoX} ${b > 0 ? "+" : "-"} ${numeroLatex(Math.abs(b))}`;
}

// Onde a reta corta o eixo x (null quando a = 0: a reta é paralela ao eixo)
export function raizDaAfim(a, b) {
    return a === 0 ? null : arredondar(-b / a, 4);
}

// Pedaço da reta que aparece dentro do quadro [-limite, limite]²: [[x1, y1], [x2, y2]] ou null
export function segmentoNoQuadro(a, b, limite = LIMITE) {
    if (a === 0) return Math.abs(b) <= limite ? [[-limite, b], [limite, b]] : null;

    const xA = (-limite - b) / a;
    const xB = (limite - b) / a;
    const xMin = Math.max(-limite, Math.min(xA, xB));
    const xMax = Math.min(limite, Math.max(xA, xB));
    if (xMin > xMax) return null;
    return [[xMin, a * xMin + b], [xMax, a * xMax + b]];
}

export function passaPor(a, b, [x, y]) {
    return Math.abs(a * x + b - y) < 1e-9;
}

// O que a reta "diz", em frases curtas pro aluno
export function leituraDaAfim(a, b) {
    const frases = [];
    if (a > 0) frases.push(`Como a = ${numeroBR(a)} é positivo, a reta sobe: a função é crescente.`);
    else if (a < 0) frases.push(`Como a = ${numeroBR(a)} é negativo, a reta desce: a função é decrescente.`);
    else frases.push("Com a = 0, a reta fica deitada: a função é constante (não é afim de verdade).");

    if (a !== 0) {
        frases.push(`A cada 1 passo para a direita em x, o y ${a > 0 ? "sobe" : "desce"} ${numeroBR(Math.abs(a))}.`);
    }
    frases.push(`A reta corta o eixo y no ponto (0, ${numeroBR(b)}): é sempre o valor de b.`);

    const raiz = raizDaAfim(a, b);
    if (raiz !== null) frases.push(`Ela corta o eixo x em x = -b/a = ${numeroBR(raiz)}: essa é a raiz da função.`);
    else if (b === 0) frases.push("Com a = 0 e b = 0, a reta fica em cima do eixo x.");
    else frases.push("Com a = 0 e b diferente de 0, a reta nunca encosta no eixo x: não tem raiz.");

    return frases;
}

// Desafios: achar a e b pra reta passar pelos dois pontos (todos dão certo com passos de 0,5)
export const DESAFIOS = [
    { pontos: [[0, 2], [2, 6]], dica: "O ponto (0, 2) já diz quanto vale b." },
    { pontos: [[1, -1], [3, -5]], dica: "De x = 1 para x = 3, o y caiu 4. Quanto ele cai a cada passo?" },
    { pontos: [[-4, 3], [4, 3]], dica: "Os dois pontos têm a mesma altura." },
    { pontos: [[2, 0], [0, -1]], dica: "A raiz é x = 2 e a reta corta o eixo y em -1." },
];

// ---------- Probabilidade com dados ----------

// Probabilidade de cada resultado: um dado (1 a 6) ou a soma de dois dados (2 a 12)
export function probabilidadesTeoricas(quantidadeDeDados) {
    if (quantidadeDeDados === 1) {
        return [1, 2, 3, 4, 5, 6].map((valor) => ({ valor, casos: 1, total: 6, prob: 1 / 6 }));
    }
    const lista = [];
    for (let soma = 2; soma <= 12; soma++) {
        const casos = 6 - Math.abs(7 - soma);
        lista.push({ valor: soma, casos, total: 36, prob: casos / 36 });
    }
    return lista;
}

// Um lançamento: as faces que saíram (sortear existe pros testes trocarem o acaso por números fixos)
export function lancar(quantidadeDeDados, sortear = Math.random) {
    return Array.from({ length: quantidadeDeDados }, () => Math.floor(sortear() * 6) + 1);
}

// Lança "vezes" vezes e devolve a contagem nova (sem mexer na antiga) e as faces do último lançamento
export function lancarVarias(contagem, quantidadeDeDados, vezes, sortear = Math.random) {
    const nova = { ...contagem };
    let ultimo = [];
    for (let i = 0; i < vezes; i++) {
        ultimo = lancar(quantidadeDeDados, sortear);
        const resultado = ultimo.reduce((soma, face) => soma + face, 0);
        nova[resultado] = (nova[resultado] ?? 0) + 1;
    }
    return { contagem: nova, ultimo };
}

export function porcentagem(parte, todo, casas = 1) {
    return todo > 0 ? `${numeroBR((parte / todo) * 100, casas)}%` : "0%";
}
