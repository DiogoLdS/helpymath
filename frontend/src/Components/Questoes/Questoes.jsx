import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import "./Questoes.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";

// Precisa bater com NOTA_MINIMA do backend (services/progresso.js)
const NOTA_MINIMA = 0.6;

const Questoes = () => {
    useTituloPagina("Questões");

    const { mapaId } = useParams();
    const navigate = useNavigate();
    const [questoes, setQuestoes] = useState([]);
    // Alternativa escolhida em cada questão: { questaoId: alternativaId }
    const [respostas, setRespostas] = useState({});
    // Correção de cada questão já respondida: { questaoId: { correto, letraCorreta } }
    const [resultados, setResultados] = useState({});
    const [bloqueado, setBloqueado] = useState(false);
    // Placar do mapa: { acertos, total, mapaConcluido, proximo }
    const [placar, setPlacar] = useState(null);

    useEffect(() => {
        const buscarQuestoes = async () => {
            const storedToken = localStorage.getItem('token');

            if (!storedToken) {
                navigate('/login');
                return;
            }

            const headers = { Authorization: `Bearer ${storedToken}` };

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

            // Respostas que o aluno já deu antes (pra continuar de onde parou)
            try {
                const { data } = await api.get(`/mapas/${mapaId}/progresso`, { headers });

                const anteriores = {};
                const corrigidas = {};
                for (const r of data.questoes.respostas) {
                    anteriores[r.questaoId] = r.alternativaId;
                    corrigidas[r.questaoId] = { correto: r.correta, letraCorreta: null };
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

        buscarQuestoes();
    }, [mapaId]);

    const selecionarAlternativa = (questaoId, alternativaId) => {
        if (resultados[questaoId]) return;

        setRespostas((anteriores) => ({ ...anteriores, [questaoId]: alternativaId }));
    };

    const responder = async (questaoId) => {
        const alternativaId = respostas[questaoId];

        if (!alternativaId) return;

        const storedToken = localStorage.getItem('token');

        try {
            const resposta = await api.post(`/questoes/${questaoId}/responder`, { alternativaId }, {
                headers: {
                    Authorization: `Bearer ${storedToken}`
                }
            });

            const { correto, letraCorreta, resultado, mapaConcluido, proximo } = resposta.data;

            setResultados((anteriores) => ({ ...anteriores, [questaoId]: { correto, letraCorreta } }));

            if (resultado) {
                setPlacar({ acertos: resultado.acertos, total: resultado.total, mapaConcluido, proximo });
            }
        } catch (error) {
            console.log(error.message);
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

    const respondidas = Object.keys(resultados).length;
    const porcentagem = placar && placar.total > 0 ? Math.round((placar.acertos / placar.total) * 100) : 0;

    return (
        <main className='mainQuestoes'>
            <Marca comLink />
            <h1>Questões</h1>

            {bloqueado && (
                <div className='questoes-bloqueadas'>
                    <p>As questões deste mapa ainda estão bloqueadas.</p>
                    <p>Volte ao mapa e marque todos os conteúdos como concluídos para liberar.</p>
                    <Link to={`/mapas/${mapaId}`} className='botao-responder'>Voltar ao mapa</Link>
                </div>
            )}

            {!bloqueado && questoes.length === 0 && <p>Nenhuma questão cadastrada para este mapa.</p>}

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
                        <p className='enunciado'>{indice + 1}. {questao.enunciado}</p>

                        <div className='alternativas'>
                            {questao.alternativa.map((alternativa) => {
                                const selecionada = respostas[questao.questaoId] === alternativa.id;

                                let classe = 'alternativa';
                                if (selecionada) classe += ' selecionada';
                                // Só destaca a alternativa escolhida: se errou, a certa não é revelada
                                if (resultado && selecionada) classe += resultado.correto ? ' correta' : ' incorreta';

                                return (
                                    <button
                                        type='button'
                                        key={alternativa.id}
                                        className={classe}
                                        disabled={!!resultado}
                                        onClick={() => selecionarAlternativa(questao.questaoId, alternativa.id)}
                                    >
                                        <strong>{alternativa.letra})</strong> {alternativa.texto}
                                    </button>
                                );
                            })}
                        </div>

                        {!resultado ? (
                            <button
                                type='button'
                                className='botao-responder'
                                disabled={!respostas[questao.questaoId]}
                                onClick={() => responder(questao.questaoId)}
                            >
                                Responder
                            </button>
                        ) : resultado.correto ? (
                            <p className='feedback correto'>Resposta correta!</p>
                        ) : (
                            <div className='feedback-linha'>
                                <p className='feedback incorreto'>Resposta incorreta.</p>
                                <button
                                    type='button'
                                    className='botao-responder'
                                    onClick={() => tentarDeNovo(questao.questaoId)}
                                >
                                    Tentar de novo
                                </button>
                            </div>
                        )}
                    </section>
                );
            })}
        </main>
    );
};

export default Questoes;
