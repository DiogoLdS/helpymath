import { useEffect } from "react";
import { useNavigate } from "react-router";
import "./Home.css"
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import InicioAluno from "./InicioAluno.jsx";
import InicioAdmin from "./InicioAdmin.jsx";

// Página inicial (/inicio). Muda conforme quem entrou:
// - ADMIN: painel de gestão (números, o que precisa de atenção, mapas, onde os alunos erram, usuários)
// - ALUNO: escolher o nível, com o progresso real, o próximo passo e a pontuação
// Quem decide é o "admin" de dentro do token de login; quem protege de verdade é o backend (authAdmin).
const Home = () => {
    const admin = usuarioEhAdmin();
    useTituloPagina(admin ? "Painel do administrador" : "Início");

    const navigate = useNavigate();
    const storedToken = localStorage.getItem('token');

    useEffect(() => {
        // Sem token, a pessoa ainda não entrou: mostra a página de apresentação do site
        if (!storedToken) {
            navigate('/');
        }
    }, [storedToken, navigate]);

    const sair = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

    if (!storedToken) {
        return null;
    }

    return (
        <main className='mainHome'>
            <Sidebar />

            <section className={admin ? 'home homeAdmin' : 'home'}>
                {admin ? <InicioAdmin sair={sair} /> : <InicioAluno sair={sair} />}
            </section>
        </main>
    )
}

export default Home;
