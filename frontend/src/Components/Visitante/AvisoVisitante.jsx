import { Link } from "react-router";
import "./AvisoVisitante.css";

// Faixa que aparece pra quem está navegando como visitante (sem conta).
// compacto = versão de uma linha (página das questões)
const AvisoVisitante = ({ compacto = false, texto }) => (
    <aside className={compacto ? "avisoVisitante compacto" : "avisoVisitante"}>
        <div>
            <span className="avisoVisitanteEtiqueta">Modo visitante</span>
            <p>
                {texto ?? "Você pode abrir qualquer mapa e fazer as questões, mas nada fica salvo. Com uma conta grátis, você ganha o Helpy (seu assistente de estudos), o plano por nível, a meta da semana e o perfil com seu progresso."}
            </p>
        </div>
        <div className="avisoVisitanteAcoes">
            <Link to="/register" className="avisoVisitanteBotao">Criar conta grátis</Link>
            <Link to="/login" className="avisoVisitanteBotao contorno">Entrar</Link>
        </div>
    </aside>
);

export default AvisoVisitante;
