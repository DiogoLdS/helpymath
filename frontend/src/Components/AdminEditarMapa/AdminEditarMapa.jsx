import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import MapaForm from "../AdminCriarMapa/MapaForm.jsx";
import "../AdminCriarMapa/AdminCriarMapa.css";

const AdminEditarMapa = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mapa como veio do banco: serve de base pra descobrir o que o admin mudou
    const [mapaOriginal, setMapaOriginal] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState("");

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
            navigate(`/mapas/${id}`);
            return;
        }

        const buscarMapa = async () => {
            setCarregando(true);
            setErroCarga("");

            try {
                const resposta = await api.get(`/mapas/${id}`, {
                    headers: { Authorization: `Bearer ${storedToken}` }
                });

                setMapaOriginal(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }

                setErroCarga(
                    error.response?.status === 404
                        ? "Mapa conceitual não encontrado."
                        : "Não foi possível carregar este mapa conceitual."
                );
                console.log(error.message);
            } finally {
                setCarregando(false);
            }
        };

        buscarMapa();
    }, [id, storedToken, autorizado, navigate]);

    const salvar = async (nome, conteudos) => {
        setErro("");

        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        setEnviando(true);

        try {
            // 1) Nome do mapa
            if (nome !== mapaOriginal.nome) {
                setEtapaAtual("Atualizando o nome do mapa...");
                await api.patch(`/mapas/${id}`, { nome }, { headers });
            }

            // 2) Conteúdos que o admin tirou da lista saem do mapa
            const idsMantidos = conteudos
                .filter((c) => c.conteudoId)
                .map((c) => c.conteudoId);

            for (const original of mapaOriginal.conteudos) {
                if (!idsMantidos.includes(original.conteudoId)) {
                    setEtapaAtual("Removendo conteúdos...");
                    await api.delete(`/mapas/${id}/conteudo/${original.conteudoId}`, { headers });
                }
            }

            // 3) Conteúdos que já existiam: só manda pro banco os que mudaram
            for (const conteudo of conteudos.filter((c) => c.conteudoId)) {
                const original = mapaOriginal.conteudos.find((o) => o.conteudoId === conteudo.conteudoId);

                const alterado =
                    conteudo.titulo.trim() !== original.titulo ||
                    conteudo.explicacao.trim() !== (original.explicacao ?? "") ||
                    Number(conteudo.tipo) !== original.tipo;

                if (alterado) {
                    setEtapaAtual(`Atualizando "${conteudo.titulo.trim()}"...`);
                    await api.patch(
                        `/conteudo/${conteudo.conteudoId}`,
                        {
                            titulo: conteudo.titulo.trim(),
                            explicacao: conteudo.explicacao.trim(),
                            tipo: Number(conteudo.tipo),
                        },
                        { headers }
                    );
                }
            }

            // 4) Conteúdos novos: cria e já vincula ao mapa
            const novos = conteudos.filter((c) => !c.conteudoId);

            for (let i = 0; i < novos.length; i++) {
                const conteudo = novos[i];

                setEtapaAtual(`Salvando conteúdo novo ${i + 1} de ${novos.length}...`);

                const respostaConteudo = await api.post(
                    "/criarConteudo",
                    {
                        titulo: conteudo.titulo.trim(),
                        explicacao: conteudo.explicacao.trim(),
                        tipo: Number(conteudo.tipo),
                    },
                    { headers }
                );

                await api.post(
                    `/mapas/${id}/conteudo`,
                    { conteudoId: respostaConteudo.data.conteudoId },
                    { headers }
                );
            }

            navigate(`/mapas/${id}`);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
            if (error.response?.status === 403) {
                setErro("Acesso restrito a administradores.");
            } else {
                setErro("Não foi possível salvar as alterações. Tente novamente em instantes.");
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

    // Conteúdos já salvos entram no formulário com o conteudoId do banco
    const valoresIniciais = mapaOriginal && {
        nome: mapaOriginal.nome,
        conteudos: mapaOriginal.conteudos.map((c) => ({
            idTemp: `existente-${c.conteudoId}`,
            conteudoId: c.conteudoId,
            titulo: c.titulo,
            explicacao: c.explicacao ?? "",
            tipo: c.tipo,
            formulaAtiva: (c.explicacao ?? "").includes("$"),
        })),
    };

    return (
        <main className="mainAdmin">
            <Sidebar />

            <section className="adminPainel">
                <div className="adminConteudo">
                    <h1>Editar mapa conceitual</h1>
                    <p className="subtitulo">
                        Altere o nome do mapa e adicione, edite ou remova os conteúdos dele.
                    </p>

                    {carregando && <p className="mensagemAdmin">Carregando...</p>}

                    {!carregando && erroCarga && <p className="mensagemErro">{erroCarga}</p>}

                    {!carregando && valoresIniciais && (
                        <MapaForm
                            key={id}
                            valoresIniciais={valoresIniciais}
                            onSubmit={salvar}
                            enviando={enviando}
                            etapaAtual={etapaAtual}
                            erro={erro}
                            rotuloBotao="Salvar alterações"
                            permitirMover={false}
                            linkCancelar={`/mapas/${id}`}
                        />
                    )}
                </div>
            </section>
        </main>
    );
};

export default AdminEditarMapa;