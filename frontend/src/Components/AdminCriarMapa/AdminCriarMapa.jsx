import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import MapaForm from "./MapaForm.jsx";
import { criarQuestaoComAlternativas } from "./questoesUtils.js";
import "./AdminCriarMapa.css";
import useTituloPagina from "../../utils/useTituloPagina.js";

const VALORES_INICIAIS = { nome: "", conteudos: [], questoes: [] };

// /admin/mapas/criar?tipo=simulado já abre na opção "Simulado" (atalho do Treino na trilha)
const AdminCriarMapa = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const comecaSimulado = searchParams.get("tipo") === "simulado";
    const [criandoSimulado, setCriandoSimulado] = useState(comecaSimulado);

    useTituloPagina(criandoSimulado ? "Criar simulado" : "Criar mapa");

    const [enviando, setEnviando] = useState(false);
    const [etapaAtual, setEtapaAtual] = useState("");
    const [erro, setErro] = useState("");
    // Mapas da trilha: pra escolher a posição do mapa novo e os mapas que ele pode citar
    const [mapas, setMapas] = useState(null);

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
            return;
        }

        // Sem a lista, o formulário funciona igual (o mapa vai pro fim do nível e não cita outros)
        api.get("/mapas", { headers: { Authorization: `Bearer ${storedToken}` } })
            .then((r) => setMapas(r.data))
            .catch((error) => console.log(error.message));
    }, [storedToken, autorizado, navigate]);

    const salvar = async (nome, conteudos, questoes, nivel, posicao, simulado) => {
        setErro("");

        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        setEnviando(true);

        try {
            setEtapaAtual(simulado ? "Criando simulado..." : "Criando mapa conceitual...");
            const respostaMapa = await api.post("/criarMapa", { nome, nivel, posicao, simulado }, { headers });
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

            navigate(simulado ? `/mapas/${mapaId}/simulado` : `/mapas/${mapaId}`);
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
                    <h1>{criandoSimulado ? "Criar simulado" : "Criar mapa conceitual"}</h1>
                    <p className="subtitulo">
                        {criandoSimulado
                            ? "Cadastre um simulado (ex: ENEM 2024) com as questões dele."
                            : "Cadastre um novo mapa conceitual e os conteúdos que farão parte dele."}
                    </p>

                    <MapaForm
                        // Trocar ?tipo= na URL recomeça o formulário na opção certa
                        key={comecaSimulado ? "simulado" : "mapa"}
                        valoresIniciais={{ ...VALORES_INICIAIS, simulado: comecaSimulado }}
                        podeTrocarTipo
                        onTrocarTipo={setCriandoSimulado}
                        onSubmit={salvar}
                        enviando={enviando}
                        etapaAtual={etapaAtual}
                        erro={erro}
                        rotuloBotao={criandoSimulado ? "Criar simulado" : "Criar mapa"}
                        linkCancelar="/mapas"
                        mostrarQuestoes
                        mapas={mapas}
                    />
                </div>
            </section>
        </main>
    );
};

export default AdminCriarMapa;