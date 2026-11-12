import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import { decodificarToken, usuarioEhAdmin } from "../../utils/auth.js";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import { OBJETIVOS, objetivoDe } from "../Perfil/perfilUtils.js";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { formulasNaLinha } from "../Formulas/formulaUtils.js";
import "./BoasVindas.css";

// Níveis que dá pra escolher como ponto de partida (o Treino é de simulados, entra no plano pelo objetivo)
const NIVEIS_PARTIDA = niveis.filter((n) => n.chave !== "treino");
const nomeDoNivel = (chave) => niveis.find((n) => n.chave === chave)?.nome ?? chave;
const METAS = [3, 5, 7, 10];

// Perguntas de boas-vindas: aparecem logo depois do cadastro (e quando o aluno quer refazer pelo início).
// 1) Pra que vai estudar  2) Por qual nível começar, ou o teste diagnóstico se não souber  3) Meta da semana.
// No fim grava tudo no perfil (PATCH /perfil) e vai pra página inicial, que passa a mostrar o plano.
const BoasVindas = () => {
    useTituloPagina("Boas-vindas");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const primeiroNome = (decodificarToken(token ?? "")?.nome ?? "").trim().split(/\s+/)[0];

    const [carregando, setCarregando] = useState(true);
    const [etapa, setEtapa] = useState("objetivo");
    const [objetivo, setObjetivo] = useState(null);
    const [nivel, setNivel] = useState(null);
    const [meta, setMeta] = useState(null);
    const [jaRespondeu, setJaRespondeu] = useState(false);

    // Teste diagnóstico
    const [questoes, setQuestoes] = useState(null);
    const [indice, setIndice] = useState(0);
    const [respostas, setRespostas] = useState([]);
    const [resultado, setResultado] = useState(null);

    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        // Admin não estuda pela trilha: vai direto pro painel
        if (usuarioEhAdmin()) {
            navigate("/inicio", { replace: true });
            return;
        }
        // Quem já respondeu antes vê as respostas atuais marcadas
        api.get("/me", { headers })
            .then((r) => {
                setObjetivo(r.data?.objetivo ?? null);
                setNivel(r.data?.nivel ?? null);
                setMeta(r.data?.boasVindasEm ? r.data.metaSemanal : null);
                setJaRespondeu(Boolean(r.data?.boasVindasEm));
            })
            .catch((error) => {
                if (error.response?.status === 401) navigate("/login");
            })
            .finally(() => setCarregando(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const salvar = async (dados) => {
        setOcupado(true);
        setErro("");
        try {
            await api.patch("/perfil", { ...dados, boasVindas: true }, { headers });
            navigate("/inicio");
        } catch (error) {
            setErro(error.response?.data?.error ?? "Não foi possível salvar agora. Tente de novo.");
            setOcupado(false);
        }
    };

    const comecarTeste = async () => {
        setOcupado(true);
        setErro("");
        try {
            const r = await api.get("/diagnostico", { headers });
            setQuestoes(Array.isArray(r.data) ? r.data : []);
            setIndice(0);
            setRespostas([]);
            setResultado(null);
            setEtapa("teste");
        } catch {
            setErro("Não foi possível carregar o teste agora. Escolha um nível ou tente de novo.");
        } finally {
            setOcupado(false);
        }
    };

    const responder = async (alternativaId) => {
        const novas = [...respostas, { questaoId: questoes[indice].questaoId, alternativaId }];
        setRespostas(novas);
        if (indice + 1 < questoes.length) {
            setIndice(indice + 1);
            return;
        }
        // Última questão: corrige no servidor e mostra o nível sugerido
        setOcupado(true);
        try {
            const r = await api.post("/diagnostico", { respostas: novas }, { headers });
            setResultado(r.data);
            setNivel(r.data.sugerido);
            setEtapa("resultado");
        } catch {
            setErro("Não foi possível corrigir o teste. Tente de novo.");
            setEtapa("nivel");
        } finally {
            setOcupado(false);
        }
    };

    const irParaMeta = () => {
        if (meta === null) setMeta(objetivoDe(objetivo)?.metaSugerida ?? 5);
        setEtapa("meta");
    };

    if (carregando) {
        return <main className="mainBoasVindas"><Carregando pagina texto="Carregando" /></main>;
    }

    // Barrinha de progresso das etapas (o teste conta como parte da etapa do nível)
    const passo = { objetivo: 1, nivel: 2, teste: 2, resultado: 2, meta: 3 }[etapa];
    const sugestaoMeta = objetivoDe(objetivo)?.metaSugerida;

    return (
        <main className="mainBoasVindas">
            <section className="boasVindas">
                <header className="bvTopo">
                    <Marca />
                    <div className="bvPassos" aria-label={`Etapa ${passo} de 3`}>
                        {[1, 2, 3].map((n) => <span key={n} className={n <= passo ? "feito" : ""} />)}
                    </div>
                    {/* Dá pra pular e responder depois pelo início */}
                    <button type="button" className="bvPular" onClick={() => (jaRespondeu ? navigate("/inicio") : salvar({}))} disabled={ocupado}>
                        {jaRespondeu ? "Voltar ao início" : "Pular por agora"}
                    </button>
                </header>

                {erro && <p className="bvErro" role="alert">{erro}</p>}

                {/* ---------- 1. Objetivo ---------- */}
                {etapa === "objetivo" && (
                    <div className="bvEtapa">
                        <h1>{primeiroNome ? `Que bom ter você aqui, ${primeiroNome}!` : "Que bom ter você aqui!"}</h1>
                        <p className="bvTexto">Três perguntas rápidas e o HelpyMath monta um plano de estudos pra você.</p>

                        <h2>Para que você vai estudar matemática?</h2>
                        <div className="bvOpcoes">
                            {OBJETIVOS.map((o) => (
                                <button
                                    type="button"
                                    key={o.chave}
                                    className={objetivo === o.chave ? "bvOpcao ativo" : "bvOpcao"}
                                    aria-pressed={objetivo === o.chave}
                                    onClick={() => setObjetivo(o.chave)}
                                >
                                    <strong>{o.nome}</strong>
                                    <span>{o.descricao}</span>
                                </button>
                            ))}
                        </div>
                        <small className="bvNota">Isso define sua meta sugerida, se os simulados do Treino entram no seu plano e as dicas do Helpy.</small>

                        <div className="bvAcoes">
                            <button type="button" className="bvBotao" onClick={() => setEtapa("nivel")} disabled={!objetivo}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* ---------- 2. Nível ou teste diagnóstico ---------- */}
                {etapa === "nivel" && (
                    <div className="bvEtapa">
                        <h2>Você já sabe por onde começar?</h2>
                        <p className="bvTexto">
                            Se você já sabe o seu nível, é só escolher. Se não tem certeza, faça o <strong>teste diagnóstico</strong>:
                            são poucas questões e ele sugere o nível certo pra você não perder tempo com o que já sabe
                            (nem pular o que ainda falta).
                        </p>

                        <div className="bvOpcoes">
                            {NIVEIS_PARTIDA.map((n) => (
                                <button
                                    type="button"
                                    key={n.chave}
                                    className={nivel === n.chave ? `bvOpcao bvNivel bv-${n.chave} ativo` : `bvOpcao bvNivel bv-${n.chave}`}
                                    aria-pressed={nivel === n.chave}
                                    onClick={() => setNivel(n.chave)}
                                >
                                    <strong>{n.nome}</strong>
                                    <span>{n.descricao}</span>
                                </button>
                            ))}
                        </div>

                        <button type="button" className="bvTeste" onClick={comecarTeste} disabled={ocupado}>
                            {ocupado ? <Carregando texto="Preparando o teste" /> : <><strong>Não sei meu nível</strong> · fazer o teste diagnóstico</>}
                        </button>

                        <div className="bvAcoes">
                            <button type="button" className="bvBotao bvContorno" onClick={() => setEtapa("objetivo")}>← Voltar</button>
                            <button type="button" className="bvBotao" onClick={irParaMeta} disabled={!nivel}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* ---------- Teste diagnóstico: uma questão por vez ---------- */}
                {etapa === "teste" && questoes && questoes.length === 0 && (
                    <div className="bvEtapa">
                        <h2>O teste ainda não tem questões</h2>
                        <p className="bvTexto">Os mapas ainda não têm questões suficientes para o teste. Sugerimos começar pelo Básico; você pode mudar depois.</p>
                        <div className="bvAcoes">
                            <button type="button" className="bvBotao bvContorno" onClick={() => setEtapa("nivel")}>← Escolher outro</button>
                            <button type="button" className="bvBotao" onClick={() => { setNivel("basico"); irParaMeta(); }}>Começar pelo Básico →</button>
                        </div>
                    </div>
                )}

                {etapa === "teste" && questoes && questoes.length > 0 && (
                    <div className="bvEtapa">
                        <p className="bvContador">Questão {indice + 1} de {questoes.length} · {nomeDoNivel(questoes[indice].nivel)}</p>
                        <div className="bvBarra"><div style={{ width: `${(indice / questoes.length) * 100}%` }} /></div>

                        <div className="bvEnunciado" role="heading" aria-level={2}><TextoComFormulas texto={questoes[indice].enunciado} /></div>
                        <div className="bvAlternativas">
                            {questoes[indice].alternativas.map((a) => (
                                <button type="button" key={a.id} className="bvAlternativa" onClick={() => responder(a.id)} disabled={ocupado}>
                                    <strong>{a.letra})</strong> <TextoComFormulas texto={formulasNaLinha(a.texto)} />
                                </button>
                            ))}
                        </div>

                        <div className="bvAcoes">
                            <button type="button" className="bvBotao bvContorno" onClick={() => setEtapa("nivel")} disabled={ocupado}>Sair do teste</button>
                            <button type="button" className="bvBotao bvContorno" onClick={() => responder(null)} disabled={ocupado}>
                                {ocupado ? <Carregando texto="Corrigindo" /> : "Não sei"}
                            </button>
                        </div>
                        <small className="bvNota">O teste não conta no seu progresso: ele só serve para sugerir o nível.</small>
                    </div>
                )}

                {/* ---------- Resultado do teste ---------- */}
                {etapa === "resultado" && resultado && (
                    <div className="bvEtapa">
                        <h2>Sugerimos começar no nível <span className={`bvDestaque bv-${resultado.sugerido}`}>{nomeDoNivel(resultado.sugerido)}</span></h2>

                        <ul className="bvResultado">
                            {resultado.porNivel.filter((p) => p.total > 0).map((p) => (
                                <li key={p.nivel}>
                                    <span>{nomeDoNivel(p.nivel)}</span>
                                    <div className="bvBarra"><div style={{ width: `${(p.acertos / p.total) * 100}%` }} /></div>
                                    <strong>{p.acertos} de {p.total}</strong>
                                </li>
                            ))}
                        </ul>
                        <p className="bvTexto">Prefere outro? Escolha abaixo; dá pra mudar quando quiser.</p>
                        <div className="bvChips">
                            {NIVEIS_PARTIDA.map((n) => (
                                <button type="button" key={n.chave} className={nivel === n.chave ? "bvChip ativo" : "bvChip"} aria-pressed={nivel === n.chave} onClick={() => setNivel(n.chave)}>
                                    {n.nome}
                                </button>
                            ))}
                        </div>

                        <div className="bvAcoes">
                            <button type="button" className="bvBotao bvContorno" onClick={comecarTeste} disabled={ocupado}>Refazer o teste</button>
                            <button type="button" className="bvBotao" onClick={irParaMeta}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* ---------- 3. Meta da semana ---------- */}
                {etapa === "meta" && (
                    <div className="bvEtapa">
                        <h2>Quantos conteúdos por semana você quer estudar?</h2>
                        <p className="bvTexto">Cada conteúdo leva poucos minutos. A meta aparece no seu início e no perfil.</p>

                        <div className="bvChips bvMetas">
                            {METAS.map((m) => (
                                <button type="button" key={m} className={meta === m ? "bvChip ativo" : "bvChip"} aria-pressed={meta === m} onClick={() => setMeta(m)}>
                                    <strong>{m}</strong> por semana
                                    {m === sugestaoMeta && <em>sugerido para {objetivoDe(objetivo).nome}</em>}
                                </button>
                            ))}
                        </div>

                        <div className="bvResumo">
                            <strong>Seu plano:</strong> {objetivoDe(objetivo)?.nome} · começar no {nomeDoNivel(nivel)} · {meta} conteúdos por semana
                            {objetivoDe(objetivo)?.treino && " · Treino com simulados toda semana"}
                        </div>

                        <div className="bvAcoes">
                            <button type="button" className="bvBotao bvContorno" onClick={() => setEtapa("nivel")} disabled={ocupado}>← Voltar</button>
                            <button type="button" className="bvBotao" onClick={() => salvar({ objetivo, nivel, metaSemanal: meta })} disabled={ocupado || !meta}>
                                {ocupado ? <Carregando texto="Salvando" /> : "Começar a estudar →"}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
};

export default BoasVindas;
