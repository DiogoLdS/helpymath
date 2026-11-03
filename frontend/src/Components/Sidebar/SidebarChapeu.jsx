import { Link } from "react-router";
import "./SidebarChapeu.css";
import logo from "../../Assets/Images/logo.svg";
import chapeu from "../../Assets/Images/chapeu.svg";
import mensagem from "../../Assets/Images/mensagem.svg";
import sino from "../../Assets/Images/sino.svg";
import pessoa from "../../Assets/Images/pessoa.svg";
import mais from "../../Assets/Images/mais.svg";
import { usuarioEhAdmin } from "../../utils/auth.js";

const Sidebar = () => {
    return (
        <section className="art">
            <div className="logo" id="logospace1">
                <Link to="/inicio" className="btnSB"><img src={logo} alt="HelpyMath, página inicial" title="HelpyMath" id="logo" /></Link>
            </div>
            <div className="linhaLogo"></div>
            <div className="iconspace" id="iconspace1">
                <Link to="/mapas" className="btnSB"><img src={chapeu} alt="Chapeu" id="form" /></Link>
                <div className="space"></div>
            </div>
            <div className="iconspace" id="iconspace2">
                <img src={mensagem} alt="Ícone de Mensagem" id="chat" />
            </div>
            <div className="iconspace" id="iconspace3">
                <img src={sino} alt="Ícone de Sino" id="sino" />
            </div>
            <div className="iconspace" id="iconspace4">
                <Link to="/perfil" className="btnSB" title="Meu perfil"><img src={pessoa} alt="Meu perfil" id="pess" /></Link>
            </div>
            {/* "+" = criar mapa: só aparece pra administrador (o backend também só deixa admin criar) */}
            {usuarioEhAdmin() && (
                <div className="iconspace" id="iconspace5">
                    <Link to="/admin/mapas/criar" className="btnSB" title="Criar mapa"><img src={mais} alt="Criar mapa" id="mais" /></Link>
                </div>
            )}
        </section>
    );
};

export default Sidebar;
