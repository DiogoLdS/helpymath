import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import MapaForm from "../AdminCriarMapa/MapaForm.jsx";
import {
    LETRAS,
    criarQuestaoComAlternativas,
    questaoDoBanco,
} from "../AdminCriarMapa/questoesUtils.js";
import "../AdminCriarMapa/AdminCriarMapa.css";
import useTituloPagina from "../../utils/useTituloPagina.js";

const AdminEditarMapa = () => {
    useTituloPagina("Editar mapa");

    const { id } = useParams();
    const navigate = useNavigate();

    // Mapa como veio do banco: serve de base pra descobrir o que o admin mudou
    const [mapaOriginal, setMapaOriginal] = useState(null);
    const [questoesOriginais, setQuestoesOriginais] = useState([]);
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
                const headers = { Authorization: `Bearer ${storedToken}` };

                // Mapa (nome + conteúdos) e questões vêm de rotas diferentes; busca as duas juntas
                const [respostaMapa, respostaQuestoes] = await Promise.all([
                    api.get(`/mapas/${id}`, { headers }),
                    api.get(`/admin/mapas/${id}/questoes`, { headers }),
                ]);

                setMapaOriginal(respostaMapa.data);
                setQuestoesOriginais(respostaQuestoes.data);
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

    const salvar = async (nome, conteudos, questoes, nivel) => {
        setErro("");

        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        setEnviando(true);

        try {
            // 1) Nome e dificuldade do mapa
            if (nome !== mapaOriginal.nome || nivel !== mapaOriginal.nivel) {
                setEtapaAtual("Atualizando o mapa...");
                await api.patch(`/mapas/${id}`, { nome, nivel }, { headers });
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

            // 5) Questões que o admin tirou da lista (o backend apaga as alternativas junto)
            const questoesMantidas = questoes.filter((q) => q.questaoId).map((q) => q.questaoId);

            for (const original of questoesOriginais) {
                if (!questoesMantidas.includes(original.questaoId)) {
                    setEtapaAtual("Removendo questões...");
                    await api.delete(`/questoes/${original.questaoId}`, { headers });
                }
            }

            // 6) Questões que já existiam: só manda pro banco o que mudou
            for (const questao of questoes.filter((q) => q.questaoId)) {
                const original = questoesOriginais.find((o) => o.questaoId === questao.questaoId);

                setEtapaAtual("Atualizando questões...");

                if (questao.enunciado.trim() !== original.enunciado) {
                    await api.patch(
                        `/questoes/${questao.questaoId}`,
                        { enunciado: questao.enunciado.trim() },
                        { headers }
                    );
                }

                // Alternativas removidas
                const alternativasMantidas = questao.alternativas
                    .filter((a) => a.alternativaId)
                    .map((a) => a.alternativaId);

                for (const alternativaOriginal of original.alternativa) {
                    if (!alternativasMantidas.includes(alternativaOriginal.id)) {
                        await api.delete(`/alternativas/${alternativaOriginal.id}`, { headers });
                    }
                }

                // Alternativas que ficaram (podem ter mudado de texto, de letra ou de correta) e as novas
                for (let j = 0; j < questao.alternativas.length; j++) {
                    const alternativa = questao.alternativas[j];
                    const dados = {
                        texto: alternativa.texto.trim(),
                        letra: LETRAS[j],
                        correta: j === questao.indiceCorreta,
                    };

                    if (!alternativa.alternativaId) {
                        await api.post(`/questoes/${questao.questaoId}/alternativas`, dados, { headers });
                        continue;
                    }

                    const alternativaOriginal = original.alternativa.find((a) => a.id === alternativa.alternativaId);
                    const mudou =
                        dados.texto !== alternativaOriginal.texto ||
                        dados.letra !== alternativaOriginal.letra ||
                        dados.correta !== alternativaOriginal.correta;

                    if (mudou) {
                        await api.patch(`/alternativas/${alternativa.alternativaId}`, dados, { headers });
                    }
                }
            }

            // 7) Questões novas
            const questoesNovas = questoes.filter((q) => !q.questaoId);

            for (let i = 0; i < questoesNovas.length; i++) {
                setEtapaAtual(`Salvando questão nova ${i + 1} de ${questoesNovas.length}...`);
                await criarQuestaoComAlternativas(id, questoesNovas[i], headers);
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
        nivel: mapaOriginal.nivel,
        conteudos: mapaOriginal.conteudos.map((c) => ({
            idTemp: `existente-${c.conteudoId}`,
            conteudoId: c.conteudoId,
            titulo: c.titulo,
            explicacao: c.explicacao ?? "",
            tipo: c.tipo,
            formulaAtiva: (c.explicacao ?? "").includes("$"),
        })),
        questoes: questoesOriginais.map(questaoDoBanco),
    };

    return (
        <main className="mainAdmin">
            <Sidebar />

            <section className="adminPainel">
                <div className="adminConteudo">
                    <h1>Editar mapa conceitual</h1>
                    <p className="subtitulo">
                        Altere o nome do mapa e adicione, edite ou remova os conteúdos e as questões dele.
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
                            mostrarQuestoes
                        />
                    )}
                </div>
            </section>
        </main>
    );
};

export default AdminEditarMapa;