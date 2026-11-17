import { useState } from "react";
import { Link } from "react-router";
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { Formula } from "../Formulas/Formula.jsx";
import {
    DESAFIOS, LIMITE, latexFuncao, leituraDaAfim, numeroBR, passaPor, raizDaAfim, segmentoNoQuadro
} from "./simulacoesUtils.js";
import "../Perfil/Perfil.css";
import "./Simulacoes.css";

// Simulação da função afim f(x) = ax + b: o aluno mexe em a e b e vê a reta, o ponto onde ela
// corta o eixo y e a raiz. Tem também desafios: fazer a reta passar por dois pontos dados.

const TAMANHO = 400;                       // o quadro do gráfico, em pixels do SVG
const ESCALA = TAMANHO / (2 * LIMITE);     // pixels por unidade
const px = (x) => (x + LIMITE) * ESCALA;   // x do plano -> x do SVG
const py = (y) => (LIMITE - y) * ESCALA;   // y do plano -> y do SVG (no SVG o y cresce pra baixo)
const MARCAS = Array.from({ length: 2 * LIMITE + 1 }, (_, i) => i - LIMITE);

const FuncaoAfim = () => {
    useTituloPagina("Função afim");

    const [a, setA] = useState(1);
    const [b, setB] = useState(2);
    // null = modo livre; número = índice do desafio aberto
    const [desafio, setDesafio] = useState(null);

    const segmento = segmentoNoQuadro(a, b);
    const raiz = raizDaAfim(a, b);
    const raizVisivel = raiz !== null && Math.abs(raiz) <= LIMITE;
    const bVisivel = Math.abs(b) <= LIMITE;

    const pontosDesafio = desafio === null ? [] : DESAFIOS[desafio].pontos;
    const acertou = pontosDesafio.length > 0 && pontosDesafio.every((p) => passaPor(a, b, p));

    const abrirDesafio = (indice) => {
        setDesafio(indice);
        // Começa de uma reta "neutra", pra ninguém acertar sem querer
        setA(1);
        setB(0);
    };

    return (
        <main className="mainPerfil">
            <Sidebar />

            <section className="perfilPainel">
                <div className="perfilConteudo">
                    <header className="simCabecalho">
                        <Link to="/simulacoes" className="simVoltar">← Todas as simulações</Link>
                        <h1>Função afim</h1>
                        <p>Mexa em <strong>a</strong> e <strong>b</strong> e veja o que cada um faz com a reta.</p>
                    </header>

                    <div className="afimArea">
                        <figure className="afimGrafico">
                            <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} role="img"
                                aria-label={`Gráfico de ${latexFuncao(a, b).replace(/\{,\}/g, ",")}`}>
                                {/* Quadriculado */}
                                {MARCAS.map((m) => (
                                    <g key={m} className={m === 0 ? "afimEixo" : "afimGrade"}>
                                        <line x1={px(m)} y1={0} x2={px(m)} y2={TAMANHO} />
                                        <line x1={0} y1={py(m)} x2={TAMANHO} y2={py(m)} />
                                    </g>
                                ))}
                                {/* Números dos eixos, de 2 em 2 */}
                                {MARCAS.filter((m) => m !== 0 && m % 2 === 0 && Math.abs(m) < LIMITE).map((m) => (
                                    <g key={`n${m}`} className="afimNumero">
                                        <text x={px(m)} y={py(0) + 14} textAnchor="middle">{m}</text>
                                        <text x={px(0) - 6} y={py(m) + 4} textAnchor="end">{m}</text>
                                    </g>
                                ))}
                                <text x={TAMANHO - 6} y={py(0) - 6} textAnchor="end" className="afimNomeEixo">x</text>
                                <text x={px(0) + 8} y={14} className="afimNomeEixo">y</text>

                                {/* A reta */}
                                {segmento && (
                                    <line className="afimReta"
                                        x1={px(segmento[0][0])} y1={py(segmento[0][1])}
                                        x2={px(segmento[1][0])} y2={py(segmento[1][1])} />
                                )}

                                {/* Pontos do desafio */}
                                {pontosDesafio.map(([x, y]) => (
                                    <circle key={`${x},${y}`} cx={px(x)} cy={py(y)} r={8}
                                        className={passaPor(a, b, [x, y]) ? "afimAlvo certo" : "afimAlvo"} />
                                ))}

                                {/* Onde corta o eixo y (b) e o eixo x (raiz) */}
                                {bVisivel && <circle cx={px(0)} cy={py(b)} r={6} className="afimPontoB" />}
                                {raizVisivel && <circle cx={px(raiz)} cy={py(0)} r={6} className="afimPontoRaiz" />}
                            </svg>
                            <figcaption className="afimLegenda">
                                <span><i className="afimBolinha b" aria-hidden="true" /> corta o eixo y (b)</span>
                                <span><i className="afimBolinha raiz" aria-hidden="true" /> raiz (corta o eixo x)</span>
                            </figcaption>
                        </figure>

                        <div className="afimControles">
                            <div className="afimFormula" aria-live="polite">
                                <Formula latex={latexFuncao(a, b)} bloco />
                            </div>

                            <label className="afimControle">
                                <span>a (inclinação) = <strong>{numeroBR(a)}</strong></span>
                                <input type="range" min={-5} max={5} step={0.5} value={a}
                                    onChange={(e) => setA(Number(e.target.value))}
                                    aria-valuetext={numeroBR(a)} />
                            </label>

                            <label className="afimControle">
                                <span>b (onde corta o eixo y) = <strong>{numeroBR(b)}</strong></span>
                                <input type="range" min={-6} max={6} step={0.5} value={b}
                                    onChange={(e) => setB(Number(e.target.value))}
                                    aria-valuetext={numeroBR(b)} />
                            </label>

                            {desafio === null ? (
                                <ul className="afimLeitura">
                                    {leituraDaAfim(a, b).map((frase) => <li key={frase}>{frase}</li>)}
                                </ul>
                            ) : (
                                <div className={acertou ? "afimDesafio certo" : "afimDesafio"} aria-live="polite">
                                    <strong>Desafio {desafio + 1} de {DESAFIOS.length}</strong>
                                    <p>
                                        Faça a reta passar pelos pontos{" "}
                                        {pontosDesafio.map(([x, y]) => `(${x}, ${y})`).join(" e ")}.
                                    </p>
                                    {acertou ? (
                                        <p className="afimResultado">
                                            Isso! Com a = {numeroBR(a)} e b = {numeroBR(b)} a reta passa pelos dois pontos.
                                        </p>
                                    ) : (
                                        <p className="afimDica">Dica: {DESAFIOS[desafio].dica}</p>
                                    )}
                                </div>
                            )}

                            <div className="afimBotoes">
                                {desafio === null ? (
                                    <button type="button" className="simBotao" onClick={() => abrirDesafio(0)}>
                                        Fazer os desafios
                                    </button>
                                ) : (
                                    <>
                                        {desafio < DESAFIOS.length - 1 && (
                                            <button type="button" className="simBotao" onClick={() => abrirDesafio(desafio + 1)}>
                                                {acertou ? "Próximo desafio" : "Pular este"}
                                            </button>
                                        )}
                                        <button type="button" className="simBotao contorno" onClick={() => setDesafio(null)}>
                                            {acertou && desafio === DESAFIOS.length - 1 ? "Terminei: voltar ao modo livre" : "Modo livre"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default FuncaoAfim;
