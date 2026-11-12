import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Carregando from "../Carregando/Carregando.jsx";
import AvisoVisitante from "../Visitante/AvisoVisitante.jsx";
import { cabecalhoAuth, ehVisitante } from "../../utils/auth.js";
import { MEDALHAS, PERIODOS } from "./rankingUtils.js";
import "../Perfil/Perfil.css";
import "./Ranking.css";

// Ranking de pontos dos alunos: 10 por conteúdo concluído e 5 por questão certa (os mesmos do perfil).
// Dá pra ver a semana (últimos 7 dias, todo mundo tem chance) ou o geral (desde sempre).
// Só aparece o primeiro nome e a inicial do sobrenome; admin não entra.
const Ranking = () => {
    useTituloPagina("Ranking");
    const navigate = useNavigate();
    const visitante = ehVisitante();

    const [periodo, setPeriodo] = useState("semana");
    const [ranking, setRanking] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (visitante) return;

        const buscar = async () => {
            setRanking(null);
            setErro("");
            try {
                const resposta = await api.get("/ranking", { params: { periodo }, headers: cabecalhoAuth() });
                setRanking(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setErro("Não foi possível carregar o ranking. Tente novamente em instantes.");
                console.log(error.message);
            }
        };
        buscar();
    }, [periodo, visitante, navigate]);

    const euForaDoTop = ranking?.eu && !ranking.top.some((a) => a.voce);

    return (
        <main className="mainPerfil">
            <Sidebar />

            <section className="perfilPainel">
                <div className="perfilConteudo">
                    <header className="rkCabecalho">
                        <div>
                            <h1>Ranking</h1>
                            <p>
                                Cada conteúdo concluído vale <strong>10 pontos</strong> e cada questão certa vale{" "}
                                <strong>5 pontos</strong>. Estude, acerte e suba!
                            </p>
                        </div>

                        {!visitante && (
                            <div className="rkPeriodos" role="tablist" aria-label="Período do ranking">
                                {PERIODOS.map((p) => (
                                    <button
                                        type="button"
                                        role="tab"
                                        key={p.chave}
                                        aria-selected={periodo === p.chave}
                                        className={periodo === p.chave ? "rkPeriodo ativo" : "rkPeriodo"}
                                        onClick={() => setPeriodo(p.chave)}
                                    >
                                        {p.nome}
                                    </button>
                                ))}
                            </div>
                        )}
                    </header>

                    {visitante && (
                        <AvisoVisitante texto="O ranking é só para quem tem conta: crie a sua (é grátis) para somar pontos e aparecer aqui." />
                    )}

                    {!visitante && erro && <p className="perfilCarregando">{erro}</p>}
                    {!visitante && !erro && !ranking && <Carregando pagina texto="Carregando o ranking" />}

                    {ranking && (
                        <>
                            <p className="rkDescricao">
                                {PERIODOS.find((p) => p.chave === ranking.periodo).descricao}
                                {ranking.participantes > 0 && ` · ${ranking.participantes} ${ranking.participantes === 1 ? "aluno pontuou" : "alunos pontuaram"}`}
                            </p>

                            {ranking.top.length === 0 ? (
                                <div className="rkVazio">
                                    <p>Ninguém pontuou {ranking.periodo === "semana" ? "nesta semana" : "ainda"}. Que tal ser o primeiro?</p>
                                    <Link to="/mapas" className="rkBotao">Ir para os mapas</Link>
                                </div>
                            ) : (
                                <ol className="rkLista">
                                    {ranking.top.map((aluno, i) => <LinhaRanking key={i} aluno={aluno} />)}
                                    {euForaDoTop && (
                                        <>
                                            <li className="rkSeparador" aria-hidden="true">⋯</li>
                                            <LinhaRanking aluno={ranking.eu} />
                                        </>
                                    )}
                                </ol>
                            )}

                            {/* Quem ainda não pontuou no período (admin também cai aqui) */}
                            {!ranking.eu && ranking.top.length > 0 && (
                                <p className="rkDica">
                                    Você ainda não tem pontos {ranking.periodo === "semana" ? "nesta semana" : "no ranking"}.{" "}
                                    <Link to="/mapas">Conclua um conteúdo</Link> para entrar na lista.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

const LinhaRanking = ({ aluno }) => (
    <li className={`rkLinha${aluno.voce ? " voce" : ""}${aluno.posicao <= 3 ? ` podio${aluno.posicao}` : ""}`}>
        <span className="rkPosicao" aria-label={`${aluno.posicao}º lugar`}>
            {MEDALHAS[aluno.posicao] ?? `${aluno.posicao}º`}
        </span>
        <span className="rkNome">
            {aluno.nome}
            {aluno.voce && <span className="rkVoce">você</span>}
        </span>
        <span className="rkDetalhe">
            {aluno.conteudos} {aluno.conteudos === 1 ? "conteúdo" : "conteúdos"} · {aluno.acertos} {aluno.acertos === 1 ? "acerto" : "acertos"}
        </span>
        <strong className="rkPontos">{aluno.pontos} pts</strong>
    </li>
);

export default Ranking;
