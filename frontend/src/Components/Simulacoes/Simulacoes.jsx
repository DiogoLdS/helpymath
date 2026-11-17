import { Link } from "react-router";
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import simulacoes from "../../data/simulacoes.js";
import "../Perfil/Perfil.css";
import "./Simulacoes.css";

// Lista das simulações do próprio HelpyMath. Aberta pra todo mundo (visitante também): nada é salvo.
const Simulacoes = () => {
    useTituloPagina("Simulações");

    return (
        <main className="mainPerfil">
            <Sidebar />

            <section className="perfilPainel">
                <div className="perfilConteudo">
                    <header className="simCabecalho">
                        <h1>Simulações</h1>
                        <p>
                            Aqui você mexe nos números e vê o que acontece. Use junto com os mapas: entender
                            na prática ajuda a ligar a fórmula ao significado dela.
                        </p>
                    </header>

                    <ul className="simLista">
                        {simulacoes.map((sim) => (
                            <li key={sim.caminho}>
                                <Link to={sim.caminho} className="simCartao">
                                    <span className="simAssunto">{sim.assunto}</span>
                                    <strong>{sim.nome}</strong>
                                    <span>{sim.descricao}</span>
                                    <span className="simAbrir" aria-hidden="true">Abrir →</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
};

export default Simulacoes;
