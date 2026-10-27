import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import "./Questoes.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";

const Questoes = () => {
    useTituloPagina("Questões");

    const { mapaId } = useParams();
    const navigate = useNavigate();
    const [questoes, setQuestoes] = useState([]);
    const [respostas, setRespostas] = useState({});
    const [resultados, setResultados] = useState({});
    const [bloqueado, setBloqueado] = useState(false);

    useEffect(() => {
        const buscarQuestoes = async () => {
            const storedToken = localStorage.getItem('token');

            if (!storedToken) {
                navigate('/login');
                return;
            }

            try {
                const resposta = await api.get(`/mapas/${mapaId}/questoes`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

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

            setResultados((anteriores) => ({ ...anteriores, [questaoId]: resposta.data }));
        } catch (error) {
            console.log(error.message);
        }
    };

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

            {questoes.map((questao) => {
                const resultado = resultados[questao.questaoId];

                return (
                    <section className='questao-card' key={questao.questaoId}>
                        <p className='enunciado'>{questao.enunciado}</p>

                        <div className='alternativas'>
                            {questao.alternativa.map((alternativa) => {
                                const selecionada = respostas[questao.questaoId] === alternativa.id;
                                const ehCorreta = resultado && alternativa.letra === resultado.letraCorreta;

                                let classe = 'alternativa';
                                if (selecionada) classe += ' selecionada';
                                if (resultado && ehCorreta) classe += ' correta';
                                if (resultado && selecionada && !resultado.correto) classe += ' incorreta';

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
                        ) : (
                            <p className={resultado.correto ? 'feedback correto' : 'feedback incorreto'}>
                                {resultado.correto ? 'Resposta correta!' : `Resposta incorreta. Alternativa correta: ${resultado.letraCorreta}`}
                            </p>
                        )}
                    </section>
                );
            })}
        </main>
    );
};

export default Questoes;
