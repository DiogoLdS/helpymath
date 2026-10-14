import { Fragment, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./Formulas.css";

// Renderiza uma fórmula LaTeX com KaTeX.
// bloco = true  -> fórmula centralizada, em tamanho grande (displayMode)
// bloco = false -> fórmula na mesma linha do texto
export function Formula({ latex, bloco = false }) {
    const html = useMemo(
        () => katex.renderToString(latex, { displayMode: bloco, throwOnError: false }),
        [latex, bloco]
    );

    if (bloco) {
        return <div className="formulaBloco" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return <span className="formulaLinha" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Pedaços entre $$...$$ (bloco) e $...$ (na linha) viram fórmulas; o resto continua texto normal.
// Como o split usa um grupo de captura, as fórmulas ficam sempre nas posições ímpares.
const PADRAO_FORMULA = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function TextoComFormulas({ texto }) {
    const partes = texto.split(PADRAO_FORMULA);

    const ehBloco = (parte) => parte !== undefined && parte.startsWith("$$");

    return (
        <>
            {partes.map((parte, i) => {
                if (i % 2 === 1) {
                    return ehBloco(parte)
                        ? <Formula key={i} latex={parte.slice(2, -2).trim()} bloco />
                        : <Formula key={i} latex={parte.slice(1, -1).trim()} />;
                }

                // A quebra de linha colada numa fórmula em bloco só atrapalha (o bloco já quebra a linha)
                let textoNormal = parte;
                if (ehBloco(partes[i - 1])) textoNormal = textoNormal.replace(/^\n/, "");
                if (ehBloco(partes[i + 1])) textoNormal = textoNormal.replace(/\n$/, "");

                return <Fragment key={i}>{textoNormal}</Fragment>;
            })}
        </>
    );
}