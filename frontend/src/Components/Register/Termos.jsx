import { useState } from "react";
import TextoTermos from "../Termos/TextoTermos.jsx";
import Janela from "../Janela/Janela.jsx";

// Janela com os Termos e Condições. O botão "Li e concordo" só libera depois que a pessoa
// rola o texto até o fim: a conta só é criada por quem leu os termos.
const Termos = ({ onAceitar, onFechar }) => {
    const [chegouAoFim, setChegouAoFim] = useState(false);

    const conferirRolagem = (e) => {
        const caixa = e.currentTarget;
        // Uma folguinha de 8px, porque o navegador às vezes para um pouco antes do fim exato
        if (caixa.scrollTop + caixa.clientHeight >= caixa.scrollHeight - 8) {
            setChegouAoFim(true);
        }
    };

    return (
        <>
            <div className="termosFundo" onClick={onFechar} />
            <Janela className="termosJanela" aria-labelledby="termosTitulo" onFechar={onFechar}>
                <h2 id="termosTitulo">Termos e Condições de Uso</h2>
                <p className="termosDica">Leia até o fim para poder aceitar.</p>

                <div className="termosTexto" onScroll={conferirRolagem} tabIndex={0}>
                    <TextoTermos />

                    <p className="termosFim">Fim dos termos.</p>
                </div>

                <div className="termosAcoes">
                    <button type="button" className="termosBotao" onClick={onAceitar} disabled={!chegouAoFim}>
                        {chegouAoFim ? "Li e concordo" : "Role até o fim para aceitar"}
                    </button>
                    <button type="button" className="termosBotao termosBotaoContorno" onClick={onFechar}>
                        Fechar
                    </button>
                </div>
            </Janela>
        </>
    );
};

export default Termos;
