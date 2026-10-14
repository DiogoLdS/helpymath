import { useId, useRef, useState } from "react";
import { Formula } from "./Formula.jsx";
import "./Formulas.css";

// Cada botão insere o trecho LaTeX (insert) no campo da fórmula; o rótulo do botão é o próprio trecho renderizado.
const ABAS = [
    {
        chave: "basico",
        rotulo: "Básico",
        simbolos: [
            { insert: "\\frac{a}{b}", dica: "Fração" },
            { insert: "\\sqrt{x}", dica: "Raiz quadrada" },
            { insert: "\\sqrt[n]{x}", dica: "Raiz de índice n" },
            { insert: "x^{2}", dica: "Potência" },
            { insert: "x_{1}", dica: "Índice" },
            { insert: "\\cdot", dica: "Multiplicação (ponto)" },
            { insert: "\\times", dica: "Multiplicação (x)" },
            { insert: "\\div", dica: "Divisão" },
            { insert: "\\pm", dica: "Mais ou menos" },
            { insert: "\\left( x \\right)", dica: "Parênteses que se ajustam" },
            { insert: "\\left| x \\right|", dica: "Módulo" },
            { insert: "\\neq", dica: "Diferente" },
            { insert: "\\leq", dica: "Menor ou igual" },
            { insert: "\\geq", dica: "Maior ou igual" },
            { insert: "\\approx", dica: "Aproximadamente" },
        ],
    },
    {
        chave: "funcoes",
        rotulo: "Funções",
        simbolos: [
            { insert: "\\log_{b} x", dica: "Logaritmo" },
            { insert: "\\sin", dica: "Seno" },
            { insert: "\\cos", dica: "Cosseno" },
            { insert: "\\tan", dica: "Tangente" },
            { insert: "\\sum_{i=1}^{n}", dica: "Somatório" },
            { insert: "\\lim_{x \\to 0}", dica: "Limite" },
            { insert: "\\int_{a}^{b}", dica: "Integral" },
            { insert: "f(x)", dica: "Função f de x" },
            { insert: "\\infty", dica: "Infinito" },
            { insert: "\\Delta", dica: "Delta" },
        ],
    },
    {
        chave: "conjuntos",
        rotulo: "Conjuntos e probabilidade",
        simbolos: [
            { insert: "P(A)", dica: "Probabilidade de A" },
            { insert: "P(A \\cap B)", dica: "Probabilidade de A e B" },
            { insert: "P(A \\cup B)", dica: "Probabilidade de A ou B" },
            { insert: "\\binom{n}{k}", dica: "Combinação" },
            { insert: "n!", dica: "Fatorial" },
            { insert: "\\cup", dica: "União" },
            { insert: "\\cap", dica: "Interseção" },
            { insert: "\\in", dica: "Pertence" },
            { insert: "\\notin", dica: "Não pertence" },
            { insert: "\\subset", dica: "Está contido" },
            { insert: "\\emptyset", dica: "Conjunto vazio" },
            { insert: "\\mathbb{N}", dica: "Naturais" },
            { insert: "\\mathbb{Z}", dica: "Inteiros" },
            { insert: "\\mathbb{Q}", dica: "Racionais" },
            { insert: "\\mathbb{R}", dica: "Reais" },
        ],
    },
    {
        chave: "gregas",
        rotulo: "Letras gregas",
        simbolos: [
            { insert: "\\alpha", dica: "Alfa" },
            { insert: "\\beta", dica: "Beta" },
            { insert: "\\gamma", dica: "Gama" },
            { insert: "\\theta", dica: "Teta" },
            { insert: "\\lambda", dica: "Lambda" },
            { insert: "\\mu", dica: "Mi" },
            { insert: "\\pi", dica: "Pi" },
            { insert: "\\sigma", dica: "Sigma" },
            { insert: "\\omega", dica: "Ômega" },
        ],
    },
];

// Mini editor de fórmulas: o admin monta a fórmula aqui (com botões e pré-visualização)
// e clica em "Inserir na explicação" pra jogar o resultado, já com $...$ ou $$...$$, no texto.
const FormulaEditor = ({ onInserir, disabled }) => {
    const [abaAtiva, setAbaAtiva] = useState(ABAS[0].chave);
    const [latex, setLatex] = useState("");
    const [bloco, setBloco] = useState(true);
    const campoRef = useRef(null);
    const idCampo = useId();

    const abaSelecionada = ABAS.find((aba) => aba.chave === abaAtiva);

    const inserirSimbolo = (trecho) => {
        const campo = campoRef.current;
        const inicio = campo ? campo.selectionStart : latex.length;
        const fim = campo ? campo.selectionEnd : latex.length;

        setLatex(latex.slice(0, inicio) + trecho + latex.slice(fim));

        // Depois do re-render, devolve o foco e deixa o cursor logo depois do que foi inserido
        requestAnimationFrame(() => {
            if (!campoRef.current) return;
            const posicao = inicio + trecho.length;
            campoRef.current.focus();
            campoRef.current.setSelectionRange(posicao, posicao);
        });
    };

    const inserirNaExplicacao = () => {
        const formula = latex.trim();
        if (!formula) return;

        onInserir(bloco ? `\n$$${formula}$$\n` : `$${formula}$`);
        setLatex("");
    };

    return (
        <div className="formulaEditor">
            <div className="formulaAbas" role="tablist">
                {ABAS.map((aba) => (
                    <button
                        type="button"
                        role="tab"
                        key={aba.chave}
                        aria-selected={aba.chave === abaAtiva}
                        className={aba.chave === abaAtiva ? "formulaAba ativa" : "formulaAba"}
                        onClick={() => setAbaAtiva(aba.chave)}
                    >
                        {aba.rotulo}
                    </button>
                ))}
            </div>

            <div className="formulaSimbolos">
                {abaSelecionada.simbolos.map((simbolo) => (
                    <button
                        type="button"
                        key={simbolo.insert}
                        className="formulaSimbolo"
                        title={simbolo.dica}
                        aria-label={simbolo.dica}
                        onClick={() => inserirSimbolo(simbolo.insert)}
                        disabled={disabled}
                    >
                        <Formula latex={simbolo.insert} />
                    </button>
                ))}
            </div>

            <label className="formulaRotulo" htmlFor={idCampo}>Fórmula (LaTeX)</label>
            <input
                id={idCampo}
                ref={campoRef}
                type="text"
                className="formulaCampo"
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                placeholder="Use os botões acima ou digite, ex: x = \frac{-b}{2a}"
                disabled={disabled}
                spellCheck={false}
            />

            <div className="formulaPrevia" aria-live="polite">
                {latex.trim()
                    ? <Formula latex={latex} bloco />
                    : <span className="formulaPreviaVazia">A pré-visualização da fórmula aparece aqui.</span>}
            </div>

            <div className="formulaAcoes">
                <label className="formulaModo">
                    <input
                        type="checkbox"
                        checked={bloco}
                        onChange={(e) => setBloco(e.target.checked)}
                        disabled={disabled}
                    />
                    Em bloco (centralizada, em linha própria)
                </label>

                <button
                    type="button"
                    className="botaoSecundario"
                    onClick={inserirNaExplicacao}
                    disabled={disabled || !latex.trim()}
                >
                    Inserir na explicação
                </button>
            </div>
        </div>
    );
};

export default FormulaEditor;