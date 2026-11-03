import { Link } from "react-router";
import { saudacao } from "./trilhaUtils.js";

// "Helpy", o assistente pessoal do aluno (TCC: problema VII, RF009 e RF010).
// Cumprimenta pelo nome, mostra a evolução e diz qual é o próximo passo, com um botão pra ir direto.
// recomendacao = resultado de recomendacao() em trilhaUtils.js
const Assistente = ({ nome, recomendacao }) => {
    const { mensagem, acao, revisoes, estatisticas } = recomendacao;
    const primeiroNome = nome ? nome.trim().split(/\s+/)[0] : "";
    const taxaAcerto = estatisticas.respondidas > 0
        ? Math.round((estatisticas.acertos / estatisticas.respondidas) * 100)
        : null;

    return (
        <section className="assistente" aria-label="Assistente HelpyMath">
            <div className="assistenteCabeca">
                <span className="assistenteAvatar" aria-hidden="true">π</span>
                <div>
                    <strong className="assistenteNome">Helpy</strong>
                    <span className="assistenteCargo">seu assistente de estudos</span>
                </div>
            </div>

            <div className="assistenteBalao" aria-live="polite">
                <p className="assistenteSaudacao">
                    {saudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}!
                </p>
                <p>
                    {mensagem.map((pedaco, i) => (pedaco.destaque ? <strong key={i}>{pedaco.texto}</strong> : <span key={i}>{pedaco.texto}</span>))}
                </p>

                {acao && (
                    <Link to={acao.para} className="assistenteAcao">{acao.rotulo} →</Link>
                )}

                {/* Sugestões de revisão: mapas concluídos em que o aluno errou questões */}
                {revisoes.length > 0 && (
                    <div className="assistenteRevisao">
                        <span>Para revisar:</span>
                        {revisoes.map(({ mapa, erradas }) => (
                            <Link key={mapa.mapaId} to={`/mapas/${mapa.mapaId}/questoes`}>
                                {mapa.nome} ({erradas === 1 ? "1 questão errada" : `${erradas} questões erradas`})
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Resumo da evolução do aluno (RF009 - histórico de estudos) */}
            <ul className="assistenteNumeros">
                <li>
                    <strong>{estatisticas.mapasConcluidos}/{estatisticas.mapasTotal}</strong>
                    <span>mapas concluídos</span>
                </li>
                <li>
                    <strong>{estatisticas.acertos}</strong>
                    <span>questões certas</span>
                </li>
                <li>
                    <strong>{taxaAcerto === null ? "–" : `${taxaAcerto}%`}</strong>
                    <span>de acerto</span>
                </li>
            </ul>
        </section>
    );
};

export default Assistente;
