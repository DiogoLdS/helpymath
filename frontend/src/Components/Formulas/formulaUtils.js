// Funções de apoio das fórmulas (fora do Formula.jsx porque arquivo de componente só deve exportar componentes)

// Tira os $...$ / $$...$$ de um texto, deixando o LaTeX cru legível.
// Usado onde não dá pra desenhar a fórmula, como o texto alternativo (alt) de uma imagem.
export function textoSemFormulas(texto = "") {
    return texto
        .replace(/\$\$([\s\S]+?)\$\$/g, "$1")
        .replace(/\$([^$\n]+?)\$/g, "$1")
        .trim();
}

// Diz se o texto tem alguma fórmula entre $...$ (pra decidir se mostra a pré-visualização)
export const temFormula = (texto = "") => /\$[^$\n]+?\$/.test(texto);

// Fórmula em bloco ($$...$$) vira fórmula na linha ($...$): pra lugares que só aceitam texto corrido,
// como o botão da alternativa e a lista de atividades
export const formulasNaLinha = (texto = "") => texto.replace(/\s*\$\$([\s\S]+?)\$\$\s*/g, " $$$1$ ").trim();
