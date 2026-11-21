import { Link, useLocation } from "react-router";
import "./SidebarChapeu.css";
import logo from "../../Assets/Images/logo.svg";
import chapeu from "../../Assets/Images/chapeu.svg";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import trofeu from "../../Assets/Images/trofeu.svg";
import AvisosPainel from "../Avisos/AvisosPainel.jsx";
import sino from "../../Assets/Images/sino.svg";
import pessoa from "../../Assets/Images/pessoa.svg";
import mais from "../../Assets/Images/mais.svg";
import grafico from "../../Assets/Images/grafico.svg";
import { ehVisitante, usuarioEhAdmin } from "../../utils/auth.js";
import { itemDaPagina } from "./sidebarUtils.js";

const Sidebar = () => {
    // Visitante (sem conta): só os mapas e um atalho pra entrar; sem início, mensagens, avisos e perfil
    const visitante = ehVisitante();
    const atual = itemDaPagina(useLocation().pathname);
    // Classe e aria-current do item da página aberta
    const classe = (item, base) => (item && atual === item ? `${base} ativo` : base);
    const marcar = (item) => (item && atual === item ? { "aria-current": "page" } : {});
    const [avisosAbertos, setAvisosAbertos] = useState(false);
    const fecharAvisos = useCallback(() => setAvisosAbertos(false), []);

    return (
        <section className="art">
            {/* Visitante não tem início (a logo leva aos mapas): aí quem fica marcado é o chapéu */}
            <div className={classe(visitante ? null : "inicio", "logo")} id="logospace1">
                <Link to={visitante ? "/mapas" : "/inicio"} className="btnSB" {...marcar(visitante ? null : "inicio")}><img src={logo} alt="HelpyMath, página inicial" title="HelpyMath" id="logo" /></Link>
            </div>
            <div className="linhaLogo"></div>
            <div className={classe("mapas", "iconspace")} id="iconspace1">
                <Link to="/mapas" className="btnSB" title="Mapas" {...marcar("mapas")}><img src={chapeu} alt="Mapas" id="form" /></Link>
            </div>
            {/* Simulações: aparece pra todo mundo, visitante também */}
            <div className={classe("simulacoes", "iconspace")} id="iconspaceSim">
                <Link to="/simulacoes" className="btnSB" title="Simulações" {...marcar("simulacoes")}><img src={grafico} alt="Simulações" id="sim" /></Link>
            </div>
            {!visitante && (
                <>
                    {/* Ranking (era o ícone de mensagem, que não fazia nada). O id "chat" fica pelo tamanho no CSS. */}
                    <div className={classe("ranking", "iconspace")} id="iconspace2">
                        <Link to="/ranking" className="btnSB" title="Ranking" {...marcar("ranking")}><img src={trofeu} alt="Ranking" id="chat" /></Link>
                    </div>
                    {/* Avisos: abre um painel com o que o aluno tem pra fazer agora */}
                    <div className="iconspace" id="iconspace3">
                        <button
                            type="button"
                            className="btnSB btnSino"
                            title="Avisos"
                            aria-haspopup="dialog"
                            aria-expanded={avisosAbertos}
                            onClick={() => setAvisosAbertos(true)}
                        >
                            <img src={sino} alt="Avisos" id="sino" />
                        </button>
                    </div>
                </>
            )}
            {avisosAbertos && createPortal(<AvisosPainel fechar={fecharAvisos} />, document.body)}
            <div className={classe("perfil", "iconspace")} id="iconspace4">
                {visitante
                    ? <Link to="/login" className="btnSB" title="Entrar ou criar conta" {...marcar("perfil")}><img src={pessoa} alt="Entrar ou criar conta" id="pess" /></Link>
                    : <Link to="/perfil" className="btnSB" title="Meu perfil" {...marcar("perfil")}><img src={pessoa} alt="Meu perfil" id="pess" /></Link>}
            </div>
            {/* "+" = criar mapa: só aparece pra administrador (o backend também só deixa admin criar) */}
            {usuarioEhAdmin() && (
                <div className={classe("criar", "iconspace")} id="iconspace5">
                    <Link to="/admin/mapas/criar" className="btnSB" title="Criar mapa" {...marcar("criar")}><img src={mais} alt="Criar mapa" id="mais" /></Link>
                </div>
            )}
        </section>
    );
};

export default Sidebar;
