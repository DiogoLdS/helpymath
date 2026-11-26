import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import "../Questoes/Questoes.css";
import "./Simulado.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import AvisoVisitante from "../Visitante/AvisoVisitante.jsx";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { TextoComMidia } from "../Midia/Midia.jsx";
import { formulasNaLinha } from "../Formulas/formulaUtils.js";
import { cabecalhoAuth, ehVisitante, usuarioEhAdmin } from "../../utils/auth.js";
import { Resolucao } from "../Questoes/RespostaQuestao.jsx";
import { contarRespondidas, limparRascunho, porcentagemDeAcerto, respostasParaEnvio } from "./simuladoUtils.js";

// Simulado (ex: "ENEM 2024"): o aluno marca todas as questões e entrega no fim, como numa prova.
// Só depois da entrega aparecem a nota, o gabarito e as resoluções. Dá para refazer quando quiser.
// As marcações ficam guardadas no navegador enquanto ele faz, pra não perder tudo se a página recarregar.

const chaveRascunho = (mapaId) => `simulado-rascunho-${mapaId}`;

function lerRascunho(mapaId) {
    try {
        return JSON.parse(localStorage.getItem(chaveRascunho(mapaId)) ?? "null");
    } catch {
        return null;
    }
}

function gravarRascunho(mapaId, marcadas) {
    try {
        localStorage.setItem(chaveRascunho(mapaId), JSON.stringify(marcadas));
    } catch {
        // sem armazenamento (aba anônima, bloqueado): a prova funciona igual, só não guarda
    }
}

function apagarRascunho(mapaId) {
    try {
        localStorage.removeItem(chaveRascunho(mapaId));
    } catch {
        // idem
    }
}

const Simulado = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const visitante = ehVisitante();
    const admin = usuarioEhAdmin();

    const [simulado, setSimulado] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState("");
    // Alternativa marcada em cada questão: { questaoId: alternativaId }
    const [marcadas, setMarcadas] = useState({});
    // Correção mostrada na tela (a da última entrega, ou a que acabou de chegar)
    const [correcao, setCorrecao] = useState(null);
    // true = está fazendo a prova de novo (esconde a correção antiga)
    const [refazendo, setRefazendo] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [entregando, setEntregando] = useState(false);
    const [erroEntrega, setErroEntrega] = useState("");
    const [soErradas, setSoErradas] = useState(false);

    useTituloPagina(simulado ? `Simulado: ${simulado.nome}` : "Simulado");

    useEffect(() => {
        let ativo = true;

        api.get(`/mapas/${id}/simulado`, { headers: cabecalhoAuth() })
            .then(({ data }) => {
                if (!ativo) return;
                setSimulado(data);
                setCorrecao(data.entrega);
                setRefazendo(false);
                setMarcadas(limparRascunho(data.questoes, lerRascunho(id)));
            })
            .catch((error) => {
                if (!ativo) return;
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                // Não é simulado (mapa comum, ou não existe): a página do mapa resolve
                if (error.response?.status === 404) {
                    navigate(`/mapas/${id}`, { replace: true });
                } else {
                    setErroCarga("Não foi possível carregar o simulado. Tente de novo em instantes.");
                }
                console.log(error.message);
            })
            .finally(() => { if (ativo) setCarregando(false); });

        return () => { ativo = false; };
    }, [id, navigate]);

    const questoes = simulado?.questoes ?? [];
    const respondidas = contarRespondidas(questoes, marcadas);
    const emBranco = questoes.length - respondidas;
    const mostrandoCorrecao = Boolean(correcao) && !refazendo;

    const marcar = (questaoId, alternativaId) => {
        setConfirmando(false);
        setMarcadas((atual) => {
            // Clicar de novo na mesma alternativa desmarca (deixa em branco)
            const nova = { ...atual };
            if (nova[questaoId] === alternativaId) delete nova[questaoId];
            else nova[questaoId] = alternativaId;
            gravarRascunho(id, nova);
            return nova;
        });
    };

    const entregar = async () => {
        // Questão em branco: pede uma confirmação ali mesmo, embaixo do botão
        if (emBranco > 0 && !confirmando) {
            setConfirmando(true);
            return;
        }

        setEntregando(true);
        setErroEntrega("");
        try {
            const { data } = await api.post(
                `/mapas/${id}/simulado`,
                { respostas: respostasParaEnvio(questoes, marcadas) },
                { headers: cabecalhoAuth() }
            );
            apagarRascunho(id);
            setCorrecao(data);
            setRefazendo(false);
            setConfirmando(false);
            setSoErradas(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            setErroEntrega("Não foi possível entregar. Suas marcações continuam aqui: tente de novo.");
            console.log(error.message);
        } finally {
            setEntregando(false);
        }
    };

    const refazer = () => {
        setMarcadas({});
        apagarRascunho(id);
        setRefazendo(true);
        setConfirmando(false);
        setErroEntrega("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const itemDaCorrecao = (questaoId) => correcao?.itens.find((i) => i.questaoId === questaoId) ?? null;

    return (
        <main className="mainQuestoes mainSimulado">
            <Marca comLink />

            {carregando && <Carregando pagina texto="Carregando o simulado" />}

            {!carregando && erroCarga && (
                <div className="questoes-bloqueadas">
                    <p>{erroCarga}</p>
                    <Link to="/mapas?nivel=treino" className="botao-responder">Voltar ao Treino</Link>
                </div>
            )}

            {!carregando && simulado && (
                <>
                    <span className="simuladoEtiqueta">Simulado</span>
                    <h1>{simulado.nome}</h1>
                    <p className="questoesDoMapa">
                        {questoes.length} {questoes.length === 1 ? "questão" : "questões"} ·{" "}
                        <Link to="/mapas?nivel=treino">Treino</Link>
                        {admin && <> · <Link to={`/admin/mapas/${id}/editar`}>Editar simulado</Link></>}
                    </p>

                    {visitante && (
                        <AvisoVisitante compacto texto="Sua prova é corrigida, mas não fica salva. Crie uma conta para guardar a nota." />
                    )}

                    {questoes.length === 0 && <p>Este simulado ainda não tem questões.</p>}

                    {/* Antes de entregar: como funciona */}
                    {!mostrandoCorrecao && questoes.length > 0 && (
                        <p className="simuladoInstrucao">
                            Marque uma alternativa em cada questão e entregue no fim. A nota, o gabarito e as
                            resoluções aparecem depois da entrega.
                        </p>
                    )}

                    {/* Depois de entregar: a nota */}
                    {mostrandoCorrecao && (
                        <section className="questoes-placar simuladoNota" aria-live="polite">
                            <div className="questoes-placar-texto">
                                <strong>
                                    Você acertou {correcao.acertos} de {correcao.total} ({porcentagemDeAcerto(correcao.acertos, correcao.total)}%)
                                </strong>
                                <span>
                                    {correcao.emBranco > 0 && `${correcao.emBranco} em branco · `}
                                    Entregue em {new Date(correcao.entregueEm).toLocaleDateString("pt-BR")}
                                </span>
                            </div>
                            <div className="questoes-placar-barra">
                                <div
                                    className="questoes-placar-preenchido"
                                    style={{ width: `${porcentagemDeAcerto(correcao.acertos, correcao.total)}%` }}
                                />
                            </div>

                            <div className="simuladoAcoesNota">
                                <button type="button" className="botao-responder" onClick={refazer}>
                                    Refazer simulado
                                </button>
                                {correcao.acertos < correcao.total && (
                                    <label className="simuladoFiltro">
                                        <input
                                            type="checkbox"
                                            checked={soErradas}
                                            onChange={(e) => setSoErradas(e.target.checked)}
                                        />
                                        Mostrar só as que errei
                                    </label>
                                )}
                            </div>
                        </section>
                    )}

                    {questoes.map((questao, indice) => {
                        const item = mostrandoCorrecao ? itemDaCorrecao(questao.questaoId) : null;
                        if (item && soErradas && item.correta) return null;

                        return (
                            <section className="questao-card" key={questao.questaoId}>
                                {questao.fonte && <span className="questao-fonte">{questao.fonte}</span>}
                                <div className="enunciado">{indice + 1}. <TextoComMidia texto={questao.enunciado} /></div>

                                <div className="alternativas" role={item ? undefined : "radiogroup"} aria-label={`Alternativas da questão ${indice + 1}`}>
                                    {questao.alternativas.map((alternativa) => {
                                        const marcada = item
                                            ? item.alternativaId === alternativa.id
                                            : marcadas[questao.questaoId] === alternativa.id;

                                        let classe = "alternativa";
                                        if (marcada) classe += " selecionada";
                                        if (item) {
                                            if (alternativa.letra === item.letraCorreta) classe += " correta";
                                            else if (marcada) classe += " incorreta";
                                        }

                                        return (
                                            <button
                                                type="button"
                                                key={alternativa.id}
                                                className={classe}
                                                role={item ? undefined : "radio"}
                                                aria-checked={item ? undefined : marcada}
                                                aria-pressed={item ? marcada : undefined}
                                                disabled={Boolean(item) || entregando}
                                                onClick={() => marcar(questao.questaoId, alternativa.id)}
                                            >
                                                <strong>{alternativa.letra})</strong> <TextoComFormulas texto={formulasNaLinha(alternativa.texto)} />
                                            </button>
                                        );
                                    })}
                                </div>

                                {item && (
                                    <>
                                        <p className={item.correta ? "feedback correto" : "feedback incorreto"}>
                                            {item.correta
                                                ? "Resposta correta!"
                                                : item.alternativaId === null ? "Questão em branco." : "Resposta incorreta."}
                                        </p>
                                        {(item.resolucao || !item.correta) && (
                                            <Resolucao
                                                resolucao={item.resolucao}
                                                letraCorreta={item.correta ? null : item.letraCorreta}
                                            />
                                        )}
                                    </>
                                )}
                            </section>
                        );
                    })}

                    {/* Barra de entrega: fica presa embaixo da tela enquanto o aluno faz a prova */}
                    {!mostrandoCorrecao && questoes.length > 0 && (
                        <div className="simuladoEntrega">
                            <span className="simuladoContador" aria-live="polite">
                                {respondidas} de {questoes.length} respondidas
                            </span>
                            <button type="button" className="botao-responder" onClick={entregar} disabled={entregando}>
                                {entregando ? <Carregando texto="Corrigindo" /> : confirmando ? "Entregar mesmo assim" : "Entregar simulado"}
                            </button>
                            {confirmando && !entregando && (
                                <p className="simuladoConfirmacao">
                                    {emBranco === 1 ? "1 questão está em branco" : `${emBranco} questões estão em branco`} e
                                    {emBranco === 1 ? " vai contar" : " vão contar"} como erro.{" "}
                                    <button type="button" className="simuladoVoltar" onClick={() => setConfirmando(false)}>
                                        Voltar e responder
                                    </button>
                                </p>
                            )}
                            {erroEntrega && <p className="feedback incorreto">{erroEntrega}</p>}
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default Simulado;
