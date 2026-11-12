import { Fragment, useMemo } from "react";
// O CSS do KaTeX continua no arquivo principal: as fontes dele (KaTeX_Main) são usadas no site todo
import "katex/dist/katex.min.css";
import { useKatex } from "./carregarKatex.js";
import "./Formulas.css";

// Renderiza uma fórmula LaTeX com KaTeX.
// bloco = true  -> fórmula centralizada, em tamanho grande (displayMode)
// bloco = false -> fórmula na mesma linha do texto
export function Formula({ latex, bloco = false }) {
    const katex = useKatex();
    const html = useMemo(
        () => katex?.renderToString(latex, { displayMode: bloco, throwOnError: false }),
        [katex, latex, bloco]
    );

    // KaTeX ainda chegando: guarda o lugar (texto invisível) pra página não pular quando a fórmula aparecer
    if (!html) {
        return bloco
            ? <div className="formulaBloco formulaEsperando" aria-busy="true">{latex}</div>
            : <span className="formulaLinha formulaEsperando" aria-busy="true">{latex}</span>;
    }

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