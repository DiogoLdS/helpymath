import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import Cronograma from "./Cronograma.jsx";
import Anotacoes from "./Anotacoes.jsx";
import EditarConta from "./EditarConta.jsx";
import {
    OBJETIVOS,
    atividades,
    conquistas,
    desempenhoPorMapa,
    estatisticas,
    formatarData,
    iniciais,
    recomendacoes,
    resumoDaSemana,
} from "./perfilUtils.js";
import "./Perfil.css";
import Carregando from "../Carregando/Carregando.jsx";

// Página de perfil do aluno (Figura 4.3.2 do TCC, CU07 e CU08, RF009, RF010, RF016 e RF017):
// dados da conta, números, meta da semana, cronograma em carrossel, recomendações em carrossel,
// conteúdos concluídos e pendentes, desempenho, histórico, conquistas e anotações.
const Perfil = () => {
    useTituloPagina("Meu perfil");
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    const [erro, setErro] = useState("");
    const [editando, setEditando] = useState(false);
    const [salvandoMeta, setSalvandoMeta] = useState(false);
    const carrosselRecomendacoes = useRef(null);

    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    useEffect(() => {
        const buscarPerfil = async () => {
            if (!localStorage.getItem("token")) {
                navigate("/login");
                return;
            }

            try {
                const resposta = await api.get("/perfil", { headers: headers() });
                setPerfil(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setErro("Não foi possível carregar seu perfil. Tente novamente em instantes.");
                console.log(error.message);
            }
        };

        buscarPerfil();
    }, [navigate]);

    // Salva mudanças no perfil (nome, objetivo, meta, anotações, cronograma). Devolve true se deu certo.
    const salvarPerfil = async (mudancas) => {
        try {
            const resposta = await api.patch("/perfil", mudancas, { headers: headers() });
            // Mudou o nome: o servidor manda um login novo (o nome vai dentro dele)
            if (resposta.data.token) {
                localStorage.setItem("token", resposta.data.token);
            }
            setPerfil((atual) => ({ ...atual, usuario: resposta.data.usuario }));
            return true;
        } catch (error) {
            console.log(error.message);
            return false;
        }
    };

    // Devolve a mensagem de erro, ou "" se a senha foi trocada
    const trocarSenha = async (senhaAtual, novaSenha) => {
        try {
            await api.patch("/perfil/senha", { senhaAtual, novaSenha }, { headers: headers() });
            return "";
        } catch (error) {
            return error.response?.data?.error ?? "Não foi possível trocar a senha.";
        }
    };

    const sair = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (erro || !perfil) {
        return (
            <main className="mainPerfil">
                <Sidebar />
                <section className="perfilPainel">
                    {erro
                        ? <p className="perfilCarregando">{erro}</p>
                        : <Carregando pagina texto="Carregando seu perfil" />}
                </section>
            </main>
        );
    }

    const { usuario } = perfil;
    const lista = atividades(perfil);
    const stats = estatisticas(perfil, lista);
    const semana = resumoDaSemana(lista);
    const metaBatida = semana.conteudosNaSemana >= usuario.metaSemanal;
    const medalhas = conquistas(perfil, stats, metaBatida);
    const sugestoes = recomendacoes(perfil.mapas);
    const desempenho = desempenhoPorMapa(perfil.mapas);
    const objetivo = OBJETIVOS.find((o) => o.chave === usuario.objetivo);
    const nivelAtual = niveis.find((n) => perfil.mapas.some((m) => m.nivel === n.chave && m.liberado && !m.concluido));

    return (
        <main className="mainPerfil">
            <Sidebar />

            <section className="perfilPainel">
                <div className="perfilConteudo">

                    {/* ---------- Cabeçalho: quem é o aluno ---------- */}
                    <header className="perfilCabecalho">
                        <span className="perfilAvatar" aria-hidden="true">{iniciais(usuario.nome)}</span>
                        <div className="perfilIdentidade">
                            <h1>{usuario.nome}</h1>
                            <p>{usuario.email}</p>
                            <div className="perfilEtiquetas">
                                <span>Estuda desde {new Date(usuario.criadoEm).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                                {objetivo && <span>Objetivo: {objetivo.nome}</span>}
                                {nivelAtual && <span>Estudando: {nivelAtual.nome}</span>}
                                {usuario.admin && <span className="perfilEtiquetaAdmin">Administrador</span>}
                            </div>
                        </div>
                        <div className="perfilCabecalhoAcoes">
                            <button type="button" className="perfilBotao" onClick={() => setEditando((v) => !v)} aria-expanded={editando}>
                                {editando ? "Fechar edição" : "Editar perfil"}
                            </button>
                            <button type="button" className="perfilBotao perfilBotaoContorno" onClick={sair}>Sair</button>
                        </div>
                    </header>

                    {editando && (
                        <EditarConta
                            usuario={usuario}
                            onSalvar={salvarPerfil}
                            onTrocarSenha={trocarSenha}
                            onFechar={() => setEditando(false)}
                        />
                    )}

                    {/* ---------- Números ---------- */}
                    <ul className="perfilNumeros">
                        <li><strong>{stats.sequencia}</strong><span>{stats.sequencia === 1 ? "dia seguido" : "dias seguidos"}</span></li>
                        <li><strong>{stats.mapasConcluidos}/{stats.mapasTotal}</strong><span>mapas concluídos</span></li>
                        <li><strong>{stats.conteudosConcluidos}</strong><span>conteúdos concluídos</span></li>
                        <li><strong>{stats.questoesRespondidas}</strong><span>questões respondidas</span></li>
                        <li><strong>{stats.taxaAcerto === null ? "–" : `${stats.taxaAcerto}%`}</strong><span>de acerto</span></li>
                    </ul>

                    {/* ---------- Meta da semana (RF016) ---------- */}
                    <section className="perfilBloco perfilMeta">
                        <div className="perfilBlocoTitulo">
                            <span className="perfilSimbolo" aria-hidden="true">≥</span>
                            <h2>Meta da semana</h2>
                        </div>
                        <p>
                            <strong>{semana.conteudosNaSemana} de {usuario.metaSemanal}</strong> conteúdos concluídos nesta semana
                            {metaBatida ? " · meta cumprida!" : ""}
                        </p>
                        <div className="perfilBarra">
                            <div style={{ width: `${Math.min(semana.conteudosNaSemana / usuario.metaSemanal, 1) * 100}%` }} />
                        </div>
                        <label className="perfilMetaEscolha">
                            Minha meta:
                            <select
                                value={usuario.metaSemanal}
                                onChange={async (e) => {
                                    setSalvandoMeta(true);
                                    await salvarPerfil({ metaSemanal: Number(e.target.value) });
                                    setSalvandoMeta(false);
                                }}
                                disabled={salvandoMeta}
                            >
                                {[1, 2, 3, 5, 7, 10, 15, 20, 30].map((n) => (
                                    <option key={n} value={n}>{n} {n === 1 ? "conteúdo" : "conteúdos"} por semana</option>
                                ))}
                            </select>
                            {salvandoMeta && <Carregando texto="Salvando" />}
                        </label>
                    </section>

                    {/* ---------- Cronograma em carrossel (Figura 4.3.2) ---------- */}
                    <section className="perfilBloco">
                        <div className="perfilBlocoTitulo">
                            <span className="perfilSimbolo" aria-hidden="true">Σ</span>
                            <h2>Cronograma da semana</h2>
                        </div>
                        <Cronograma
                            cronograma={usuario.cronograma}
                            porDia={semana.porDia}
                            inicioSemana={semana.inicio}
                            onSalvar={salvarPerfil}
                        />
                    </section>

                    {/* ---------- Recomendações em carrossel (CU08 / RF010) ---------- */}
                    <section className="perfilBloco">
                        <div className="perfilBlocoTitulo">
                            <span className="perfilSimbolo" aria-hidden="true">→</span>
                            <h2>Recomendado para você</h2>
                            {sugestoes.length > 2 && (
                                <div className="cronogramaSetas">
                                    <button type="button" onClick={() => carrosselRecomendacoes.current?.scrollBy({ left: -260, behavior: "smooth" })} aria-label="Anteriores">‹</button>
                                    <button type="button" onClick={() => carrosselRecomendacoes.current?.scrollBy({ left: 260, behavior: "smooth" })} aria-label="Próximas">›</button>
                                </div>
                            )}
                        </div>
                        {sugestoes.length === 0 ? (
                            <p className="perfilVazio">Nada para recomendar agora: você está em dia! Que tal explorar outro nível na <Link to="/mapas">sua trilha</Link>?</p>
                        ) : (
                            <div className="recomendacoes" ref={carrosselRecomendacoes}>
                                {sugestoes.map((s) => (
                                    <Link key={`${s.tipo}-${s.mapa.mapaId}`} to={s.para} className={`recomendacao ${s.tipo}`}>
                                        <span className="recomendacaoTipo">
                                            {s.tipo === "revisar" ? "Para revisar" : s.tipo === "continuar" ? "Em andamento" : "Próximo passo"}
                                        </span>
                                        <strong>{s.mapa.nome}</strong>
                                        <span>{s.motivo}</span>
                                        <span className="recomendacaoAcao">{s.acao} →</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ---------- Conteúdos concluídos e pendentes (tabelas da Figura 4.3.2) ---------- */}
                    <div className="perfilDuasColunas">
                        <section className="perfilBloco">
                            <div className="perfilBlocoTitulo">
                                <span className="perfilSimbolo" aria-hidden="true">✓</span>
                                <h2>Conteúdos concluídos</h2>
                            </div>
                            {perfil.conteudosConcluidos.length === 0 ? (
                                <p className="perfilVazio">Você ainda não concluiu nenhum conteúdo.</p>
                            ) : (
                                <div className="perfilTabelaRolagem">
                                    <table className="perfilTabela">
                                        <thead><tr><th>Conteúdo</th><th>Mapa</th><th>Quando</th></tr></thead>
                                        <tbody>
                                            {perfil.conteudosConcluidos.map((c) => (
                                                <tr key={c.conteudoId}>
                                                    <td>{c.titulo}</td>
                                                    <td>{c.mapas.map((m) => m.nome).join(", ") || "–"}</td>
                                                    <td>{formatarData(c.concluidoEm)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section className="perfilBloco">
                            <div className="perfilBlocoTitulo">
                                <span className="perfilSimbolo" aria-hidden="true">○</span>
                                <h2>Conteúdos pendentes</h2>
                            </div>
                            {perfil.conteudosPendentes.length === 0 ? (
                                <p className="perfilVazio">Nenhum conteúdo pendente nos mapas liberados.</p>
                            ) : (
                                <div className="perfilTabelaRolagem">
                                    <table className="perfilTabela">
                                        <thead><tr><th>Conteúdo</th><th>Mapa</th><th></th></tr></thead>
                                        <tbody>
                                            {perfil.conteudosPendentes.map((c) => (
                                                <tr key={`${c.mapa.mapaId}-${c.conteudoId}`}>
                                                    <td>{c.titulo}</td>
                                                    <td>{c.mapa.nome}</td>
                                                    <td><Link to={`/mapas/${c.mapa.mapaId}`}>Estudar</Link></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ---------- Desempenho e histórico (CU07 / RF009) ---------- */}
                    <div className="perfilDuasColunas">
                        <section className="perfilBloco">
                            <div className="perfilBlocoTitulo">
                                <span className="perfilSimbolo" aria-hidden="true">%</span>
                                <h2>Desempenho nas questões</h2>
                            </div>
                            {desempenho.length === 0 ? (
                                <p className="perfilVazio">Responda as questões de um mapa para ver seu desempenho aqui.</p>
                            ) : (
                                <ul className="desempenho">
                                    {desempenho.map((d) => (
                                        <li key={d.mapa.mapaId}>
                                            <div className="desempenhoTopo">
                                                <span>{d.mapa.nome}</span>
                                                <strong>{d.acertos}/{d.total} · {d.porcentagem}%</strong>
                                            </div>
                                            <div className={d.porcentagem >= 60 ? "perfilBarra" : "perfilBarra fraca"}>
                                                <div style={{ width: `${d.porcentagem}%` }} />
                                                <span className="perfilBarraMeta" title="Meta: 60%" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="perfilBloco">
                            <div className="perfilBlocoTitulo">
                                <span className="perfilSimbolo" aria-hidden="true">∴</span>
                                <h2>Histórico recente</h2>
                            </div>
                            {lista.length === 0 ? (
                                <p className="perfilVazio">Seu histórico de estudos aparece aqui assim que você começar.</p>
                            ) : (
                                <ol className="historico">
                                    {lista.slice(0, 10).map((a, i) => (
                                        <li key={i} className={a.tipo === "questao" ? (a.correta ? "certa" : "errada") : "conteudo"}>
                                            <span className="historicoQuando">{formatarData(a.data, true)}</span>
                                            <span className="historicoTexto">
                                                {a.tipo === "conteudo"
                                                    ? <>Concluiu <strong>{a.titulo}</strong></>
                                                    : <>{a.correta ? "Acertou" : "Errou"} uma questão</>}
                                                {a.mapa && <> em <em>{a.mapa.nome}</em></>}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>

                    {/* ---------- Conquistas (RF017) ---------- */}
                    <section className="perfilBloco">
                        <div className="perfilBlocoTitulo">
                            <span className="perfilSimbolo" aria-hidden="true">★</span>
                            <h2>Conquistas</h2>
                            <span className="perfilDica">{medalhas.filter((m) => m.conquistada).length} de {medalhas.length}</span>
                        </div>
                        <ul className="conquistas">
                            {medalhas.map((m) => (
                                <li key={m.id} className={m.conquistada ? "conquista ganha" : "conquista"} title={m.descricao}>
                                    <span className="conquistaSelo" aria-hidden="true">{m.simbolo}</span>
                                    <strong>{m.titulo}</strong>
                                    <span>{m.descricao}</span>
                                    {!m.conquistada && m.alvo > 1 && <span className="conquistaProgresso">{m.atual}/{m.alvo}</span>}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ---------- Anotações (Figura 4.3.2) ---------- */}
                    <section className="perfilBloco">
                        <div className="perfilBlocoTitulo">
                            <span className="perfilSimbolo" aria-hidden="true">✎</span>
                            <h2>Minhas anotações</h2>
                        </div>
                        <Anotacoes texto={usuario.anotacoes} onSalvar={salvarPerfil} />
                    </section>
                </div>
            </section>
        </main>
    );
};

export default Perfil;
