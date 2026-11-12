import { Link, useNavigate } from "react-router";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { ehVisitante } from "../../utils/auth.js";
import Marca from "../Marca/Marca.jsx";
import TextoTermos from "./TextoTermos.jsx";
import "./Termos.css";

// Termos de uso e privacidade com endereço próprio (/termos): dá pra ler e mandar o link sem criar conta
const PaginaTermos = () => {
    useTituloPagina("Termos de uso e privacidade");
    const navigate = useNavigate();
    const visitante = ehVisitante();

    return (
        <main className="paginaTermos">
            <Marca comLink para={visitante ? "/" : "/inicio"} />

            <article className="ptFolha">
                <h1>Termos de uso e privacidade</h1>
                <p className="ptAtualizado">Última atualização: novembro de 2026</p>
                <TextoTermos nivel={2} />
            </article>

            <div className="ptAcoes">
                <button type="button" className="ptBotao" onClick={() => navigate(-1)}>← Voltar</button>
                {visitante && <Link to="/register" className="ptBotao ptBotaoCheio">Criar conta</Link>}
            </div>
        </main>
    );
};

export default PaginaTermos;
