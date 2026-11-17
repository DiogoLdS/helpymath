import { useState } from "react";
import { Link } from "react-router";
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { lancarVarias, numeroBR, porcentagem, probabilidadesTeoricas } from "./simulacoesUtils.js";
import "../Perfil/Perfil.css";
import "./Simulacoes.css";

// Simulação de probabilidade com dados: lança um ou dois dados muitas vezes e compara a frequência
// de cada resultado (barras) com a probabilidade calculada (risco). Com muitos lançamentos, as barras
// chegam perto do risco: é a Lei dos Grandes Números, na prática.

const VEZES = [1, 10, 100, 1000];

// Bolinhas de cada face, numa grade 3x3 (posições 0 a 8)
const BOLINHAS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

const Dado = ({ face }) => (
    <svg viewBox="0 0 60 60" className="dadoFace" role="img" aria-label={`Dado com ${face}`}>
        <rect x="3" y="3" width="54" height="54" rx="9" />
        {BOLINHAS[face].map((p) => (
            <circle key={p} cx={12 + (p % 3) * 18} cy={12 + Math.floor(p / 3) * 18} r="5" />
        ))}
    </svg>
);

const Dados = () => {
    useTituloPagina("Probabilidade com dados");

    const [quantidade, setQuantidade] = useState(2);
    const [contagem, setContagem] = useState({});
    const [ultimo, setUltimo] = useState([]);
    const [escolhido, setEscolhido] = useState(7);
    // Muda a cada lançamento, pra animar o dado de novo
    const [rodada, setRodada] = useState(0);

    const teoricas = probabilidadesTeoricas(quantidade);
    const total = Object.values(contagem).reduce((s, n) => s + n, 0);
    const maiorFrequencia = Math.max(...teoricas.map((t) => (total ? (contagem[t.valor] ?? 0) / total : 0)));
    const topo = Math.max(maiorFrequencia, ...teoricas.map((t) => t.prob)) * 1.15;
    const nomeResultado = quantidade === 1 ? "sair o" : "a soma dar";

    const trocarQuantidade = (n) => {
        setQuantidade(n);
        setContagem({});
        setUltimo([]);
        setEscolhido(n === 1 ? 6 : 7);
    };

    const lancar = (vezes) => {
        const r = lancarVarias(contagem, quantidade, vezes);
        setContagem(r.contagem);
        setUltimo(r.ultimo);
        setRodada((n) => n + 1);
    };

    const recomecar = () => {
        setContagem({});
        setUltimo([]);
    };

    const teoricaEscolhida = teoricas.find((t) => t.valor === escolhido);
    const vezesEscolhido = contagem[escolhido] ?? 0;

    return (
        <main className="mainPerfil">
            <Sidebar />

            <section className="perfilPainel">
                <div className="perfilConteudo">
                    <header className="simCabecalho">
                        <Link to="/simulacoes" className="simVoltar">← Todas as simulações</Link>
                        <h1>Probabilidade com dados</h1>
                        <p>
                            Lance os dados e compare: a <strong>barra</strong> é o quanto cada resultado saiu de verdade,
                            o <strong>risco</strong> é a probabilidade calculada.
                        </p>
                    </header>

                    <div className="dadosTopo">
                        <div className="dadosEscolha" role="group" aria-label="Quantos dados">
                            {[1, 2].map((n) => (
                                <button key={n} type="button" aria-pressed={quantidade === n}
                                    className={quantidade === n ? "simBotao" : "simBotao contorno"}
                                    onClick={() => trocarQuantidade(n)}>
                                    {n === 1 ? "1 dado" : "2 dados (soma)"}
                                </button>
                            ))}
                        </div>

                        <div className="dadosUltimo" aria-live="polite">
                            {ultimo.length > 0 ? (
                                <>
                                    <span key={rodada} className="dadosRolando">
                                        {ultimo.map((face, i) => <Dado key={i} face={face} />)}
                                    </span>
                                    <span>
                                        Último lançamento: <strong>{ultimo.join(" + ")}{quantidade === 2 && ` = ${ultimo[0] + ultimo[1]}`}</strong>
                                    </span>
                                </>
                            ) : (
                                <span className="dadosVazio">Ainda não lançou nenhuma vez.</span>
                            )}
                        </div>
                    </div>

                    <div className="dadosBotoes">
                        {VEZES.map((v) => (
                            <button key={v} type="button" className="simBotao" onClick={() => lancar(v)}>
                                Lançar {v === 1 ? "1 vez" : `${v.toLocaleString("pt-BR")} vezes`}
                            </button>
                        ))}
                        <button type="button" className="simBotao contorno" onClick={recomecar} disabled={total === 0}>
                            Recomeçar
                        </button>
                        <span className="dadosTotal">{total.toLocaleString("pt-BR")} lançamentos</span>
                    </div>

                    {/* Gráfico: uma coluna por resultado; tocar numa coluna mostra os números dela */}
                    <div className="dadosGrafico" role="group" aria-label="Frequência de cada resultado. Escolha um resultado para ver os números.">
                        {teoricas.map((t) => {
                            const vezes = contagem[t.valor] ?? 0;
                            const freq = total ? vezes / total : 0;
                            return (
                                <button key={t.valor} type="button"
                                    className={escolhido === t.valor ? "dadosColuna escolhida" : "dadosColuna"}
                                    aria-pressed={escolhido === t.valor}
                                    aria-label={`Resultado ${t.valor}: saiu ${porcentagem(vezes, total)} das vezes; probabilidade ${porcentagem(t.casos, t.total)}`}
                                    onClick={() => setEscolhido(t.valor)}>
                                    <span className="dadosTrilho">
                                        <span className="dadosBarra" style={{ height: `${(freq / topo) * 100}%` }} />
                                        <span className="dadosRisco" style={{ bottom: `${(t.prob / topo) * 100}%` }} />
                                    </span>
                                    <span className="dadosValor">{t.valor}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="dadosLegenda">
                        <span><i className="dadosLegBarra" aria-hidden="true" /> saiu na simulação</span>
                        <span><i className="dadosLegRisco" aria-hidden="true" /> probabilidade calculada</span>
                    </p>

                    {teoricaEscolhida && (
                        <div className="dadosDetalhe" aria-live="polite">
                            <strong>Chance de {nomeResultado} {escolhido}</strong>
                            <p>
                                Calculada: {teoricaEscolhida.casos} {teoricaEscolhida.casos === 1 ? "caso" : "casos"} em{" "}
                                {teoricaEscolhida.total} = <strong>{porcentagem(teoricaEscolhida.casos, teoricaEscolhida.total)}</strong>
                                {quantidade === 2 && ` (dos 36 pares possíveis de dois dados, ${teoricaEscolhida.casos} dão soma ${escolhido})`}.
                            </p>
                            <p>
                                Na simulação: {vezesEscolhido.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")} ={" "}
                                <strong>{porcentagem(vezesEscolhido, total)}</strong>
                                {total > 0 && ` (diferença de ${numeroBR(Math.abs(vezesEscolhido / total - teoricaEscolhida.prob) * 100, 1)} pontos)`}.
                            </p>
                            <p className="dadosDica">
                                {total < 100
                                    ? "Com poucos lançamentos, as barras ficam bem diferentes do risco. Lance mais vezes e veja o que acontece."
                                    : quantidade === 2
                                        ? "Repare que o 7 é o mais comum: tem mais jeitos de somar 7 (1+6, 2+5, 3+4...) do que de somar 2 ou 12."
                                        : "Com muitos lançamentos, as barras ficam quase na altura do risco: é a Lei dos Grandes Números."}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Dados;
