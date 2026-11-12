import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import api from "../../../services/api.js";
import { cabecalhoAuth, usuarioEhAdmin } from "../../utils/auth.js";
import Carregando from "../Carregando/Carregando.jsx";
import { avisosDoAluno } from "./avisosUtils.js";
import "./Avisos.css";

// Painel do sino da barra lateral: o que o aluno tem pra fazer agora.
// Busca o perfil só quando abre (a barra aparece em todas as páginas, não vale pesar todas elas).
// Fecha com Esc, clicando fora ou num aviso.
const AvisosPainel = ({ fechar }) => {
    const admin = usuarioEhAdmin();
    const [avisos, setAvisos] = useState(admin ? [] : null);
    const [erro, setErro] = useState(false);
    const painel = useRef(null);

    useEffect(() => {
        if (admin) return;
        api.get("/perfil", { headers: cabecalhoAuth() })
            .then((resposta) => setAvisos(avisosDoAluno(resposta.data)))
            .catch((error) => {
                console.log(error.message);
                setErro(true);
            });
    }, [admin]);

    useEffect(() => {
        painel.current?.focus();
        const teclado = (e) => { if (e.key === "Escape") fechar(); };
        document.addEventListener("keydown", teclado);
        return () => document.removeEventListener("keydown", teclado);
    }, [fechar]);

    return (
        <div className="avisosFundo" onClick={fechar}>
            <section
                className="avisosPainel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="avisosTitulo"
                tabIndex={-1}
                ref={painel}
                onClick={(e) => e.stopPropagation()}
            >
                <header>
                    <h2 id="avisosTitulo">Avisos</h2>
                    <button type="button" className="avisosFechar" onClick={fechar} aria-label="Fechar avisos">×</button>
                </header>

                {admin && (
                    <p className="avisosVazio">
                        Os avisos dos mapas (sem conteúdo, sem questões, questão sem alternativa correta) ficam no{" "}
                        <Link to="/inicio" onClick={fechar}>painel do administrador</Link>.
                    </p>
                )}

                {!admin && erro && <p className="avisosVazio">Não foi possível carregar os avisos agora.</p>}
                {!admin && !erro && avisos === null && <Carregando texto="Carregando avisos" />}

                {avisos && avisos.length > 0 && (
                    <ul className="avisosLista">
                        {avisos.map((aviso) => (
                            <li key={aviso.id} className={aviso.tipo === "importante" ? "importante" : undefined}>
                                <Link to={aviso.link} onClick={fechar}>
                                    <span className="avisosIcone" aria-hidden="true">{aviso.icone}</span>
                                    <span>{aviso.texto}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {!admin && avisos && avisos.length === 0 && (
                    <p className="avisosVazio">Nenhum aviso por enquanto. Bons estudos!</p>
                )}
            </section>
        </div>
    );
};

export default AvisosPainel;
