import { LETRAS, MIN_ALTERNATIVAS, novaAlternativa, novaQuestao } from "./questoesUtils.js";

// Parte do formulário do mapa onde o admin cadastra as questões (múltipla escolha).
// Quem guarda a lista é o MapaForm; aqui só se mostra e altera.

const QuestoesForm = ({ questoes, setQuestoes, enviando }) => {
    const atualizarQuestao = (idTemp, mudancas) => {
        setQuestoes((atual) => atual.map((q) => (q.idTemp === idTemp ? { ...q, ...mudancas } : q)));
    };

    const atualizarAlternativa = (questao, idTempAlternativa, texto) => {
        atualizarQuestao(questao.idTemp, {
            alternativas: questao.alternativas.map((a) =>
                a.idTemp === idTempAlternativa ? { ...a, texto } : a
            ),
        });
    };

    const adicionarAlternativa = (questao) => {
        atualizarQuestao(questao.idTemp, { alternativas: [...questao.alternativas, novaAlternativa()] });
    };

    const removerAlternativa = (questao, indice) => {
        // Como a letra vem da posição, a marcação de correta precisa acompanhar quem mudou de lugar
        let indiceCorreta = questao.indiceCorreta;
        if (indiceCorreta === indice) indiceCorreta = null;
        else if (indiceCorreta !== null && indiceCorreta > indice) indiceCorreta -= 1;

        atualizarQuestao(questao.idTemp, {
            alternativas: questao.alternativas.filter((_, i) => i !== indice),
            indiceCorreta,
        });
    };

    const removerQuestao = (idTemp) => {
        setQuestoes((atual) => atual.filter((q) => q.idTemp !== idTemp));
    };

    return (
        <div className="secaoConteudos">
            <div className="cabecalhoConteudos">
                <h2>Questões do mapa</h2>
                <button
                    type="button"
                    className="botaoSecundario"
                    onClick={() => setQuestoes((atual) => [...atual, novaQuestao()])}
                    disabled={enviando}
                >
                    + Adicionar questão
                </button>
            </div>

            {questoes.length === 0 && (
                <p className="vazio">
                    Nenhuma questão adicionada ainda. Elas aparecem para o aluno no botão
                    "Fazer questões" do mapa.
                </p>
            )}

            {questoes.map((questao, indiceQuestao) => (
                <div className="cardConteudo" key={questao.idTemp}>
                    <label className="rotuloQuestao" htmlFor={`enunciado-${questao.idTemp}`}>
                        Questão {indiceQuestao + 1}
                    </label>
                    <textarea
                        id={`enunciado-${questao.idTemp}`}
                        value={questao.enunciado}
                        onChange={(e) => atualizarQuestao(questao.idTemp, { enunciado: e.target.value })}
                        placeholder="Enunciado da questão"
                        rows={3}
                        disabled={enviando}
                    />

                    <fieldset className="alternativasQuestao" disabled={enviando}>
                        <legend>Alternativas (marque a correta)</legend>

                        {questao.alternativas.map((alternativa, indice) => (
                            <div className="linhaAlternativa" key={alternativa.idTemp}>
                                <input
                                    type="radio"
                                    name={`correta-${questao.idTemp}`}
                                    checked={questao.indiceCorreta === indice}
                                    onChange={() => atualizarQuestao(questao.idTemp, { indiceCorreta: indice })}
                                    aria-label={`Alternativa ${LETRAS[indice]} é a correta`}
                                />
                                <span className="letraAlternativa">{LETRAS[indice]}</span>
                                <input
                                    type="text"
                                    value={alternativa.texto}
                                    onChange={(e) => atualizarAlternativa(questao, alternativa.idTemp, e.target.value)}
                                    placeholder={`Texto da alternativa ${LETRAS[indice]}`}
                                />
                                <button
                                    type="button"
                                    className="botaoRemoverAlternativa"
                                    onClick={() => removerAlternativa(questao, indice)}
                                    disabled={questao.alternativas.length <= MIN_ALTERNATIVAS}
                                    aria-label={`Remover alternativa ${LETRAS[indice]}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {questao.alternativas.length < LETRAS.length && (
                            <button
                                type="button"
                                className="botaoAdicionarAlternativa"
                                onClick={() => adicionarAlternativa(questao)}
                            >
                                + Alternativa {LETRAS[questao.alternativas.length]}
                            </button>
                        )}
                    </fieldset>

                    <div className="acoesConteudo">
                        <button
                            type="button"
                            className="botaoRemover"
                            onClick={() => removerQuestao(questao.idTemp)}
                            disabled={enviando}
                        >
                            Remover questão
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuestoesForm;
