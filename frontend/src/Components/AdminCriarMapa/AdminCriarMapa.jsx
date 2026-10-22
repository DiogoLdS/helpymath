import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import MapaForm from "./MapaForm.jsx";
import { criarQuestaoComAlternativas } from "./questoesUtils.js";
import "./AdminCriarMapa.css";

const VALORES_INICIAIS = { nome: "", conteudos: [], questoes: [] };

const AdminCriarMapa = () => {
    const navigate = useNavigate();

    const [enviando, setEnviando] = useState(false);
    const [etapaAtual, setEtapaAtual] = useState("");
    const [erro, setErro] = useState("");

    // Só decide o que mostrar: quem protege de verdade é o backend (authAdmin).
    const storedToken = localStorage.getItem("token");
    const autorizado = usuarioEhAdmin();

    useEffect(() => {
        if (!storedToken) {
            navigate("/login");
            return;
        }

        if (!autorizado) {
            navigate("/mapas");
        }
    }, [storedToken, autorizado, navigate]);

    const salvar = async (nome, conteudos, questoes) => {
        setErro("");

        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        setEnviando(true);

        try {
            setEtapaAtual("Criando mapa conceitual...");
            const respostaMapa = await api.post("/criarMapa", { nome }, { headers });
            const mapaId = respostaMapa.data.mapaId;

            for (let i = 0; i < conteudos.length; i++) {
                const conteudo = conteudos[i];

                setEtapaAtual(`Salvando conteúdo ${i + 1} de ${conteudos.length}...`);

                const respostaConteudo = await api.post(
                    "/criarConteudo",
                    {
                        titulo: conteudo.titulo.trim(),
                        explicacao: conteudo.explicacao.trim(),
                        tipo: Number(conteudo.tipo),
                    },
                    { headers }
                );
                const conteudoId = respostaConteudo.data.conteudoId;

                await api.post(`/mapas/${mapaId}/conteudo`, { conteudoId }, { headers });
            }

            for (let i = 0; i < questoes.length; i++) {
                setEtapaAtual(`Salvando questão ${i + 1} de ${questoes.length}...`);
                await criarQuestaoComAlternativas(mapaId, questoes[i], headers);
            }

            navigate(`/mapas/${mapaId}`);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
            if (error.response?.status === 403) {
                setErro("Acesso restrito a administradores.");
            } else {
                setErro("Não foi possível concluir o cadastro. Tente novamente em instantes.");
            }
            console.log(error.message);
        } finally {
            setEnviando(false);
            setEtapaAtual("");
        }
    };

    if (!autorizado) {
        return null;
    }

    return (
        <main className="mainAdmin">
            <Sidebar />

            <section className="adminPainel">
                <div className="adminConteudo">
                    <h1>Criar mapa conceitual</h1>
                    <p className="subtitulo">
                        Cadastre um novo mapa conceitual e os conteúdos que farão parte dele.
                    </p>

                    <MapaForm
                        valoresIniciais={VALORES_INICIAIS}
                        onSubmit={salvar}
                        enviando={enviando}
                        etapaAtual={etapaAtual}
                        erro={erro}
                        rotuloBotao="Criar mapa"
                        linkCancelar="/mapas"
                        mostrarQuestoes
                    />
                </div>
            </section>
        </main>
    );
};

export default AdminCriarMapa;