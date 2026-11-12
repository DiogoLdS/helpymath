import { Link, useLocation, useNavigate } from "react-router";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { ehVisitante } from "../../utils/auth.js";
import Marca from "../Marca/Marca.jsx";
import "./NaoEncontrada.css";

// Página 404: qualquer endereço que não existe cai aqui (antes era uma tela em branco)
const NaoEncontrada = () => {
    useTituloPagina("Página não encontrada");
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const visitante = ehVisitante();

    return (
        <main className="naoEncontrada">
            <Marca comLink para={visitante ? "/" : "/inicio"} />

            <section className="neCartao">
                <p className="neCodigo" aria-hidden="true">4<span>π</span>4</p>
                <h1>Essa página não existe</h1>
                <p className="neTexto">
                    Não encontramos <code>{pathname}</code>. O link pode estar errado ou a página foi removida.
                    Mas a matemática continua aqui!
                </p>

                <div className="neAcoes">
                    <Link to={visitante ? "/" : "/inicio"} className="neBotao">
                        {visitante ? "Ir para a página inicial" : "Voltar ao início"}
                    </Link>
                    <Link to="/mapas" className="neBotao secundario">Ver os mapas</Link>
                    <button type="button" className="neBotao secundario" onClick={() => navigate(-1)}>
                        Voltar à página anterior
                    </button>
                </div>
            </section>
        </main>
    );
};

export default NaoEncontrada;
