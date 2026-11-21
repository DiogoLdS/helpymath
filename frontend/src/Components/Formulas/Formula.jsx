import { Fragment, useMemo } from "react";
// O CSS do KaTeX continua no arquivo principal: as fontes dele (KaTeX_Main) são usadas no site todo
import "katex/dist/katex.min.css";
import { useKatex } from "./carregarKatex.js";
import { separarFormulas } from "./formulaUtils.js";
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
// O "R$ 5,00" das questões de dinheiro continua texto (ver separarFormulas).
export function TextoComFormulas({ texto }) {
    const partes = separarFormulas(texto);

    const ehBloco = (parte) => parte?.tipo === "bloco";

    return (
        <>
            {partes.map((parte, i) => {
                if (parte.tipo !== "texto") {
                    return <Formula key={i} latex={parte.conteudo} bloco={parte.tipo === "bloco"} />;
                }

                // A quebra de linha colada numa fórmula em bloco só atrapalha (o bloco já quebra a linha)
                let textoNormal = parte.conteudo;
                if (ehBloco(partes[i - 1])) textoNormal = textoNormal.replace(/^\n/, "");
                if (ehBloco(partes[i + 1])) textoNormal = textoNormal.replace(/\n$/, "");

                return <Fragment key={i}>{textoNormal}</Fragment>;
            })}
        </>
    );
}