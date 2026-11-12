import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import useTituloPagina from "../../utils/useTituloPagina.js";
import { cabecalhoAuth, ehVisitante } from "../../utils/auth.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import AvisoVisitante from "../Visitante/AvisoVisitante.jsx";
import Carimbo from "../Carimbo/Carimbo.jsx";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { formulasNaLinha } from "../Formulas/formulaUtils.js";
import niveis from "../../data/niveis.js";
import "../Questoes/Questoes.css";
import "./Revisar.css";

const nomeDoNivel = (chave) => niveis.find((n) => n.chave === chave)?.nome ?? chave;

// Revisar erros: todas as questões que o aluno errou, de todos os mapas, num lugar só.
// Responde pela mesma rota da página de questões; acertar aqui conta igual (pode até concluir o mapa).
const Revisar = () => {
    useTituloPagina("Revisar erros");
    const navigate = useNavigate();
    const visitante = ehVisitante();

    const [revisao, setRevisao] = useState(null);
    const [erro, setErro] = useState("");
    const [respostas, setRespostas] = useState({});     // { questaoId: alternativaId }
    const [resultados, setResultados] = useState({});   // { questaoId: { correto } }
    const [respondendo, setRespondendo] = useState(null);
    const [mapasConcluidos, setMapasConcluidos] = useState([]); // mapas concluídos nesta revisão

    useEffect(() => {
        if (visitante) return;
        api.get("/revisao", { headers: cabecalhoAuth() })
            .then((resposta) => setRevisao(resposta.data))
            .catch((error) => {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setErro("Não foi possível carregar suas questões para revisar. Tente novamente em instantes.");
                console.log(error.message);
            });
    }, [visitante, navigate]);

    const responder = async (questaoId, mapa) => {
        const alternativaId = respostas[questaoId];
        if (!alternativaId) return;

        setRespondendo(questaoId);
        try {
            const resposta = await api.post(`/questoes/${questaoId}/responder`, { alternativaId }, { headers: cabecalhoAuth() });
            const { correto, mapaConcluido, proximo } = resposta.data;
            setResultados((atual) => ({ ...atual, [questaoId]: { correto } }));

            if (mapaConcluido && !mapasConcluidos.some((m) => m.mapaId === mapa.mapaId)) {
                setMapasConcluidos((atual) => [...atual, { mapaId: mapa.mapaId, nome: mapa.nome, proximo, em: new Date() }]);
            }
        } catch (error) {
            window.alert(error.response?.data?.error ?? "Não foi possível enviar sua resposta. Tente de novo.");
            console.log(error.message);
        } finally {
            setRespondendo(null);
        }
    };

    const tentarDeNovo = (questaoId) => {
        const semEssa = (objeto) => {
            const copia = { ...objeto };
            delete copia[questaoId];
            return copia;
        };
        setResultados(semEssa);
        setRespostas(semEssa);
    };

    const corrigidasAgora = Object.values(resultados).filter((r) => r.correto).length;

    return (
        <main className="mainQuestoes">
            <Marca comLink />
            <h1>Revisar erros</h1>


            <p className="rvIntro">
                Aqui ficam as questões que você errou, de todos os mapas. Acertar aqui vale igual: conta pontos
                e pode até concluir o mapa.
            </p>

            {visitante && (
                <AvisoVisitante compacto texto="Crie uma conta para guardar suas respostas e revisar as questões que você errou." />
            )}

            {!visitante && erro && <p className="questoes-dica">{erro}</p>}
            {!visitante && !erro && !revisao && <Carregando pagina texto="Juntando suas questões" />}

            {revisao && revisao.total === 0 && (
                <div className="rvVazio">
                    <p><strong>Nada para revisar!</strong> Você não tem nenhuma questão errada no momento.</p>
                    <Link to="/mapas" className="botao-responder">Ir para os mapas</Link>
                </div>
            )}

            {revisao && revisao.total > 0 && (
                <section className="questoes-placar" aria-live="polite">
                    <div className="questoes-placar-texto">
                        <strong>{corrigidasAgora} de {revisao.total} corrigidas</strong>
                        <span>{revisao.mapas.length} {revisao.mapas.length === 1 ? "mapa" : "mapas"}</span>
                    </div>
                    <div className="questoes-placar-barra">
                        <div className="questoes-placar-preenchido" style={{ width: `${(corrigidasAgora / revisao.total) * 100}%` }} />
                    </div>
                </section>
            )}

            {mapasConcluidos.map((m) => (
                <div className="questoes-concluido rvConcluido" key={m.mapaId} role="status">
                    <Carimbo data={m.em} animar />
                    <p><strong>Mapa "{m.nome}" concluído!</strong> A revisão valeu a pena.</p>
                    {m.proximo && (
                        <Link to={`/mapas/${m.proximo.mapaId}`} className="botao-responder">
                            Próximo mapa: {m.proximo.nome} →
                        </Link>
                    )}
                </div>
            ))}

            {revisao?.mapas.map((mapa) => (
                <section key={mapa.mapaId} className="rvMapa">
                    <header className="rvMapaCabecalho">
                        <h2>{mapa.nome}</h2>
                        <span>{nomeDoNivel(mapa.nivel)} · {mapa.questoes.length} {mapa.questoes.length === 1 ? "questão" : "questões"}</span>
                        <Link to={`/mapas/${mapa.mapaId}`}>Rever o conteúdo do mapa →</Link>
                    </header>

                    {mapa.questoes.map((questao) => {
                        const resultado = resultados[questao.questaoId];
                        return (
                            <article className="questao-card" key={questao.questaoId}>
                                <div className="enunciado"><TextoComFormulas texto={questao.enunciado} /></div>

                                <div className="alternativas">
                                    {questao.alternativa.map((alternativa) => {
                                        const selecionada = respostas[questao.questaoId] === alternativa.id;
                                        let classe = "alternativa";
                                        if (selecionada) classe += " selecionada";
                                        if (resultado && selecionada) classe += resultado.correto ? " correta" : " incorreta";
                                        return (
                                            <button
                                                type="button"
                                                key={alternativa.id}
                                                className={classe}
                                                disabled={!!resultado}
                                                onClick={() => setRespostas((atual) => ({ ...atual, [questao.questaoId]: alternativa.id }))}
                                            >
                                                <strong>{alternativa.letra})</strong> <TextoComFormulas texto={formulasNaLinha(alternativa.texto)} />
                                            </button>
                                        );
                                    })}
                                </div>

                                {!resultado ? (
                                    <button
                                        type="button"
                                        className="botao-responder"
                                        disabled={!respostas[questao.questaoId] || respondendo !== null}
                                        onClick={() => responder(questao.questaoId, mapa)}
                                    >
                                        {respondendo === questao.questaoId ? <Carregando texto="Corrigindo" /> : "Responder"}
                                    </button>
                                ) : resultado.correto ? (
                                    <p className="feedback correto">Agora foi! Resposta correta.</p>
                                ) : (
                                    <div className="feedback-linha">
                                        <p className="feedback incorreto">Ainda não. Que tal rever o conteúdo do mapa?</p>
                                        <button type="button" className="botao-responder" onClick={() => tentarDeNovo(questao.questaoId)}>
                                            Tentar de novo
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            ))}
        </main>
    );
};

export default Revisar;
