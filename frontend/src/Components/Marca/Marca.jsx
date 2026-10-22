import { Link } from "react-router";
import logo from "../../Assets/Images/logo.svg";
import "./Marca.css";

// Logo + nome do site. O logo é branco, então fica num quadradinho azul pra aparecer em fundo claro.
// grande = true -> versão maior (telas de login/cadastro)
// comLink = true -> clicar leva pra página inicial
const Marca = ({ grande = false, comLink = false }) => {
    const conteudo = (
        <>
            <span className="marcaSimbolo"><img src={logo} alt="" /></span>
            <span className="marcaNome">Helpy<strong>Math</strong></span>
        </>
    );

    const classe = grande ? "marca marcaGrande" : "marca";

    if (comLink) {
        return <Link to="/" className={classe} aria-label="HelpyMath, ir para a página inicial">{conteudo}</Link>;
    }

    return <span className={classe}>{conteudo}</span>;
};

export default Marca;
