import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import "./Comemoracao.css";

// Confete: posições e cores fixas (sem sorteio na renderização), cada pedaço com um atraso diferente
const CORES = ["#E0A800", "#567EBB", "#2E8B57", "#D9534F", "#8E6CC0", "#2B4C7E"];
const CONFETES = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 37) % 100,
    cor: CORES[i % CORES.length],
    atraso: (i % 9) * 0.12,
    duracao: 2.2 + (i % 5) * 0.3,
    giro: i % 2 === 0 ? 1 : -1,
}));

// Tela de comemoração: mapa concluído e/ou mapa novo desbloqueado.
// titulo: frase grande; mapa: { mapaId, nome } do mapa desbloqueado (opcional, vira o botão principal)
const Comemoracao = ({ titulo, texto, mapa, fechar }) => {
    const botao = useRef(null);

    useEffect(() => {
        botao.current?.focus();
        const teclado = (e) => { if (e.key === "Escape") fechar(); };
        document.addEventListener("keydown", teclado);
        return () => document.removeEventListener("keydown", teclado);
    }, [fechar]);

    return createPortal(
        <div className="cmFundo" onClick={fechar}>
            <div className="cmConfetes" aria-hidden="true">
                {CONFETES.map((c, i) => (
                    <span
                        key={i}
                        style={{
                            left: `${c.left}%`,
                            backgroundColor: c.cor,
                            animationDelay: `${c.atraso}s`,
                            animationDuration: `${c.duracao}s`,
                            "--giro": c.giro,
                        }}
                    />
                ))}
            </div>

            <section
                className="cmCartao"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cmTitulo"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="cmIcone" aria-hidden="true">🎉</span>
                <h2 id="cmTitulo">{titulo}</h2>
                {texto && <p>{texto}</p>}

                <div className="cmAcoes">
                    {mapa ? (
                        <Link ref={botao} to={`/mapas/${mapa.mapaId}`} className="cmBotao" onClick={fechar}>
                            Ir para {mapa.nome} →
                        </Link>
                    ) : (
                        <Link ref={botao} to="/mapas" className="cmBotao" onClick={fechar}>Ver a trilha</Link>
                    )}
                    <button type="button" className="cmBotao secundario" onClick={fechar}>Continuar aqui</button>
                </div>
            </section>
        </div>,
        document.body
    );
};

export default Comemoracao;
