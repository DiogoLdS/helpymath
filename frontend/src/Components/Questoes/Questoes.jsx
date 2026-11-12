import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import "./Questoes.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import AvisoVisitante from "../Visitante/AvisoVisitante.jsx";
import Carimbo from "../Carimbo/Carimbo.jsx";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { formulasNaLinha } from "../Formulas/formulaUtils.js";
import { cabecalhoAuth, ehVisitante, usuarioEhAdmin } from "../../utils/auth.js";
import RespostaQuestao from "./RespostaQuestao.jsx";
import { quandoLibera } from "./resolucaoUtils.js";

// Precisa bater com NOTA_MINIMA do backend (services/progresso.js)
const NOTA_MINIMA = 0.6;

const Questoes = () => {
    useTituloPagina("Questões");

    const { mapaId } = useParams();
    const navigate = useNavigate();
    const [questoes, setQuestoes] = useState([]);
    // Alternativa escolhida em cada questão: { questaoId: alternativaId }
    const [respostas, setRespostas] = useState({});
    // Correção de cada questão já respondida: { questaoId: { correto, letraCorreta, revelada, resolucao, liberadaEm } }
    // revelada: a resolução já está aberta na tela; liberadaEm: viu a resolução e só refaz a partir dessa data
    const [resultados, setResultados] = useState({});
    const [bloqueado, setBloqueado] = useState(false);
    // Enquanto as questões não chegam, mostra o spinner (e não "Nenhuma questão cadastrada")
    const [carregando, setCarregando] = useState(true);
    // Questão sendo corrigida agora (spinner no botão) e erro de envio, se houver
    const [respondendo, setRespondendo] = useState(null);
    const [erroEnvio, setErroEnvio] = useState({});
    // Placar do mapa: { acertos, total, mapaConcluido, proximo }
    const [placar, setPlacar] = useState(null);
    // Visitante (sem conta): as respostas são corrigidas, mas não ficam salvas
    const visitante = ehVisitante();
    // Admin confere as questões sem o prazo de 24 horas da resolução
    const admin = usuarioEhAdmin();

    useEffect(() => {
        const buscarQuestoes = async () => {
            const headers = cabecalhoAuth();

            try {
                const resposta = await api.get(`/mapas/${mapaId}/questoes`, { headers });
                setQuestoes(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                // O backend só libera as questões depois que o aluno conclui os conteúdos do mapa
                if (error.response?.status === 403) {
                    setBloqueado(true);
                }
                console.log(error.message);
                return;
            }

            // Visitante não tem respostas salvas: o placar é contado aqui mesmo, a cada resposta
            if (!localStorage.getItem('token')) return;

            // Respostas que o aluno já deu antes (pra continuar de onde parou)
            try {
                const { data } = await api.get(`/mapas/${mapaId}/progresso`, { headers });

                const anteriores = {};
                const corrigidas = {};
                for (const r of data.questoes.respostas) {
                    anteriores[r.questaoId] = r.alternativaId;
                    corrigidas[r.questaoId] = { correto: r.correta, letraCorreta: null, revelada: false, liberadaEm: r.liberadaEm ?? null };
                }

                setRespostas(anteriores);
                setResultados(corrigidas);
                setPlacar({
                    acertos: data.questoes.acertos,
                    total: data.questoes.total,
                    mapaConcluido: data.concluido,
                    proximo: data.proximo,
                });
            } catch (error) {
                console.log(error.message);
            }
        };

        buscarQuestoes().finally(() => setCarregando(false));
    }, [mapaId]);

    // Dia em que o mapa foi concluído NESTA visita (o carimbo "bate" com a data); null = já estava concluído
    const [concluidoAgora, setConcluidoAgora] = useState(null);

    const selecionarAlternativa = (questaoId, alternativaId) => {
        if (resultados[questaoId]) return;

        setRespostas((anteriores) => ({ ...anteriores, [questaoId]: alternativaId }));
    };

    const responder = async (questaoId) => {
        const alternativaId = respostas[questaoId];

        if (!alternativaId) return;

        setRespondendo(questaoId);
        setErroEnvio((anteriores) => ({ ...anteriores, [questaoId]: '' }));

        try {
            const resposta = await api.post(`/questoes/${questaoId}/responder`, { alternativaId }, {
                headers: cabecalhoAuth()
            });

            const { correto, letraCorreta, resolucao, resultado, mapaConcluido, proximo } = resposta.data;

            // Acertou: a resolução (se houver) já vem junto e aparece aberta
            setResultados((anteriores) => ({
                ...anteriores,
                [questaoId]: { correto, letraCorreta, revelada: correto, resolucao: resolucao ?? null, liberadaEm: null },
            }));

            if (resultado) {
                // Esta resposta concluiu o mapa agora: o carimbo bate no placar.
                // (O próximo mapa ganha o cadeado abrindo quando o aluno voltar pra trilha.)
                if (mapaConcluido && !placar?.mapaConcluido) setConcluidoAgora(new Date());
                setPlacar({ acertos: resultado.acertos, total: resultado.total, mapaConcluido, proximo });
            }
        } catch (error) {
            // Viu a resolução há pouco (em outra aba ou na Revisar): ainda não pode refazer
            const libera = error.response?.status === 409 ? error.response.data?.liberadaEm : null;
            const mensagem = libera
                ? `Você viu a resolução desta questão. Pode refazer ${quandoLibera(libera)}.`
                : 'Não foi possível enviar sua resposta. Tente de novo.';
            setErroEnvio((anteriores) => ({ ...anteriores, [questaoId]: mensagem }));
            console.log(error.message);
        } finally {
            setRespondendo(null);
        }
    };

    // Libera a questão errada pra uma nova tentativa (a resposta nova substitui a antiga no banco)
    const tentarDeNovo = (questaoId) => {
        const semEssa = (objeto) => {
            const copia = { ...objeto };
            delete copia[questaoId];
            return copia;
        };

        setResultados(semEssa);
        setRespostas(semEssa);
    };

    // Guarda o que veio ao abrir a resolução (a alternativa certa passa a ficar destacada)
    const revelar = (questaoId, dados) => {
        setResultados((anteriores) => ({ ...anteriores, [questaoId]: { ...anteriores[questaoId], ...dados } }));
    };

    const respondidas = Object.keys(resultados).length;

    // Visitante: placar só desta visita (sem meta de conclusão, porque nada é salvo)
    const placarVisitante = visitante && questoes.length > 0 && respondidas > 0
        ? { acertos: Object.values(resultados).filter((r) => r.correto).length, total: questoes.length }
        : null;
    const porcentagem = placar && placar.total > 0 ? Math.round((placar.acertos / placar.total) * 100) : 0;

    return (
        <main className='mainQuestoes'>
            <Marca comLink />
            <h1>Questões</h1>

            {visitante && (
                <AvisoVisitante compacto texto="Suas respostas são corrigidas, mas não ficam salvas. Crie uma conta para guardar o progresso e liberar o próximo mapa." />
            )}

            {placarVisitante && (
                <section className='questoes-placar' aria-live='polite'>
                    <div className='questoes-placar-texto'>
                        <strong>{placarVisitante.acertos} de {placarVisitante.total} certas nesta visita</strong>
                        <span>{respondidas} de {placarVisitante.total} respondidas</span>
                    </div>
                    <div className='questoes-placar-barra'>
                        <div className='questoes-placar-preenchido' style={{ width: `${(placarVisitante.acertos / placarVisitante.total) * 100}%` }} />
                    </div>
                </section>
            )}

            {bloqueado && (
                <div className='questoes-bloqueadas'>
                    <p>As questões deste mapa ainda estão bloqueadas.</p>
                    <p>Volte ao mapa e marque todos os conteúdos como concluídos para liberar.</p>
                    <Link to={`/mapas/${mapaId}`} className='botao-responder'>Voltar ao mapa</Link>
                </div>
            )}

            {carregando && <Carregando pagina texto="Carregando as questões" />}

            {!carregando && !bloqueado && questoes.length === 0 && <p>Nenhuma questão cadastrada para este mapa.</p>}

            {/* Placar: quantas acertou e a meta de 60% pra concluir o mapa */}
            {placar && placar.total > 0 && (
                <section className='questoes-placar' aria-live='polite'>
                    <div className='questoes-placar-texto'>
                        <strong>{placar.acertos} de {placar.total} certas ({porcentagem}%)</strong>
                        <span>Meta: acertar {Math.round(NOTA_MINIMA * 100)}% para concluir o mapa</span>
                    </div>
                    <div className='questoes-placar-barra'>
                        <div className='questoes-placar-preenchido' style={{ width: `${porcentagem}%` }} />
                        <div className='questoes-placar-meta' style={{ left: `${NOTA_MINIMA * 100}%` }} />
                    </div>

                    {placar.mapaConcluido ? (
                        <div className='questoes-concluido'>
                            <Carimbo data={concluidoAgora} animar={Boolean(concluidoAgora)} />
                            <p><strong>Mapa concluído!</strong> Você atingiu a meta.</p>
                            {placar.proximo ? (
                                <Link to={`/mapas/${placar.proximo.mapaId}`} className='botao-responder'>
                                    Próximo mapa: {placar.proximo.nome} →
                                </Link>
                            ) : (
                                <>
                                    <p>Você concluiu todos os mapas deste nível.</p>
                                    <Link to='/mapas' className='botao-responder'>Ver os mapas</Link>
                                </>
                            )}
                        </div>
                    ) : respondidas === questoes.length && questoes.length > 0 && (
                        <p className='questoes-dica'>
                            Ainda não deu {Math.round(NOTA_MINIMA * 100)}%. Use "Tentar de novo" nas questões que você errou.
                        </p>
                    )}
                </section>
            )}

            {questoes.map((questao, indice) => {
                const resultado = resultados[questao.questaoId];

                return (
                    <section className='questao-card' key={questao.questaoId}>
                        {questao.fonte && <span className='questao-fonte'>{questao.fonte}</span>}
                        <div className='enunciado'>{indice + 1}. <TextoComFormulas texto={questao.enunciado} /></div>

                        <div className='alternativas'>
                            {questao.alternativa.map((alternativa) => {
                                const selecionada = respostas[questao.questaoId] === alternativa.id;

                                let classe = 'alternativa';
                                if (selecionada) classe += ' selecionada';
                                // Destaca a alternativa escolhida; a certa só aparece se o aluno abrir a resolução
                                if (resultado && selecionada) classe += resultado.correto ? ' correta' : ' incorreta';
                                else if (resultado?.revelada && resultado.letraCorreta === alternativa.letra) classe += ' correta';

                                return (
                                    <button
                                        type='button'
                                        key={alternativa.id}
                                        className={classe}
                                        disabled={!!resultado}
                                        onClick={() => selecionarAlternativa(questao.questaoId, alternativa.id)}
                                    >
                                        <strong>{alternativa.letra})</strong> <TextoComFormulas texto={formulasNaLinha(alternativa.texto)} />
                                    </button>
                                );
                            })}
                        </div>

                        {!resultado ? (
                            <>
                                <button
                                    type='button'
                                    className='botao-responder'
                                    disabled={!respostas[questao.questaoId] || respondendo !== null}
                                    onClick={() => responder(questao.questaoId)}
                                >
                                    {respondendo === questao.questaoId ? <Carregando texto="Corrigindo" /> : 'Responder'}
                                </button>
                                {erroEnvio[questao.questaoId] && (
                                    <p className='feedback incorreto'>{erroEnvio[questao.questaoId]}</p>
                                )}
                            </>
                        ) : (
                            <RespostaQuestao
                                questaoId={questao.questaoId}
                                resultado={resultado}
                                temResolucao={questao.temResolucao}
                                semPrazo={visitante || admin}
                                onTentarDeNovo={() => tentarDeNovo(questao.questaoId)}
                                onRevelar={(dados) => revelar(questao.questaoId, dados)}
                            />
                        )}
                    </section>
                );
            })}
        </main>
    );
};

export default Questoes;
