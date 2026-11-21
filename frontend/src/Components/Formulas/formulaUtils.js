// Funções de apoio das fórmulas (fora do Formula.jsx porque arquivo de componente só deve exportar componentes)

// ---------- Cifrão que NÃO é fórmula ----------
// No site, $...$ marca uma fórmula. Mas questões do ENEM falam muito de dinheiro ("R$ 5,00"),
// e esse cifrão abria uma "fórmula" errada até o próximo $. Por isso, antes de procurar as fórmulas:
// - "R$ 5,00" / "US$ 10" (moeda seguida de número) e
// - "\$" (cifrão escrito de propósito)
// viram marcadores invisíveis, que voltam a ser "$" no texto (ou "\$" dentro de uma fórmula).
const MOEDA = "";
const ESCAPADO = "";

const protegerCifroes = (texto) =>
    texto
        .replace(/\\\$/g, ESCAPADO)
        // Valor digitado "dentro de fórmula" por engano: "$R$ 5,00$" vira "R$ 5,00"
        .replace(/\$(R|US)\$(\s?\d[\d.,]*)\$/g, `$1${MOEDA}$2`)
        // "R" ou "US" que não fazem parte de outra palavra nem de uma fórmula ($R$ = 5 continua fórmula)
        .replace(/(^|[^A-Za-zÀ-ÿ$\\])(R|US)\$(?=\s?\d)/g, `$1$2${MOEDA}`);

const devolverNoTexto = (texto) => texto.replaceAll(MOEDA, "$").replaceAll(ESCAPADO, "$");
const devolverNaFormula = (latex) => latex.replaceAll(MOEDA, "\\$").replaceAll(ESCAPADO, "\\$");

// $$...$$ (bloco) ou $...$ (na linha, sem quebra de linha dentro)
const PADRAO_FORMULA = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

// Divide o texto em pedaços: { tipo: "texto" | "linha" | "bloco", conteudo }.
// "conteudo" de uma fórmula é o LaTeX já sem os cifrões das pontas.
export function separarFormulas(texto = "") {
    return protegerCifroes(texto)
        .split(PADRAO_FORMULA)
        .map((parte, i) => {
            // Como o split usa um grupo de captura, as fórmulas ficam sempre nas posições ímpares
            if (i % 2 === 0) return { tipo: "texto", conteudo: devolverNoTexto(parte) };
            const bloco = parte.startsWith("$$");
            const latex = bloco ? parte.slice(2, -2) : parte.slice(1, -1);
            return { tipo: bloco ? "bloco" : "linha", conteudo: devolverNaFormula(latex.trim()) };
        });
}

// Tira os $...$ / $$...$$ de um texto, deixando o LaTeX cru legível.
// Usado onde não dá pra desenhar a fórmula, como o texto alternativo (alt) de uma imagem.
export function textoSemFormulas(texto = "") {
    return separarFormulas(texto).map((p) => p.conteudo).join("").trim();
}

// Diz se o texto tem alguma fórmula entre $...$ (pra decidir se mostra a pré-visualização)
export const temFormula = (texto = "") => separarFormulas(texto).some((p) => p.tipo !== "texto");

// Fórmula em bloco ($$...$$) vira fórmula na linha ($...$): pra lugares que só aceitam texto corrido,
// como o botão da alternativa e a lista de atividades
export const formulasNaLinha = (texto = "") => texto.replace(/\s*\$\$([\s\S]+?)\$\$\s*/g, " $$$1$ ").trim();
