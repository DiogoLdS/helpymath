import { useRef, useState } from "react";
import { LETRAS, MIN_ALTERNATIVAS, novaAlternativa, novaQuestao } from "./questoesUtils.js";
import FormulaEditor from "../Formulas/FormulaEditor.jsx";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { temFormula } from "../Formulas/formulaUtils.js";

// Parte do formulário do mapa onde o admin cadastra as questões (múltipla escolha).
// Quem guarda a lista é o MapaForm; aqui só se mostra e altera.
//
// Fórmulas (KaTeX): cada questão tem um editor de fórmulas. Ele insere no campo em que o cursor
// estava por último (o enunciado ou uma das alternativas), igual à explicação dos conteúdos.

const QuestoesForm = ({ questoes, setQuestoes, enviando }) => {
    // Questões com o editor de fórmulas aberto: { idTemp: true }
    const [formulaAberta, setFormulaAberta] = useState({});
    // Campo onde a fórmula vai entrar, por questão: { idTemp: "enunciado" | idTemp da alternativa }
    const [alvo, setAlvo] = useState({});
    // Os campos de verdade (pra saber a posição do cursor): chave "questao:campo"
    const campos = useRef({});

    const atualizarQuestao = (idTemp, mudancas) => {
        setQuestoes((atual) => atual.map((q) => (q.idTemp === idTemp ? { ...q, ...mudancas } : q)));
    };

    const guardarCampo = (questao, campo) => (el) => { campos.current[`${questao.idTemp}:${campo}`] = el; };
    const marcarAlvo = (questao, campo) => setAlvo((atual) => ({ ...atual, [questao.idTemp]: campo }));

    // Joga a fórmula no enunciado ou na alternativa escolhida, no lugar do cursor
    const inserirFormula = (questao, trecho) => {
        const campoAlvo = alvo[questao.idTemp] ?? "enunciado";
        const alternativa = questao.alternativas.find((a) => a.idTemp === campoAlvo);
        const ehEnunciado = campoAlvo === "enunciado" || !alternativa;
        const textoAtual = ehEnunciado ? questao.enunciado : alternativa.texto;
        const chave = `${questao.idTemp}:${ehEnunciado ? "enunciado" : campoAlvo}`;
        const el = campos.current[chave];

        const inicio = el ? el.selectionStart : textoAtual.length;
        const fim = el ? el.selectionEnd : textoAtual.length;
        // Alternativa é uma linha só: fórmula em bloco vira fórmula na linha
        const trechoFinal = ehEnunciado ? trecho : trecho.replace(/^\n?\$\$([\s\S]*)\$\$\n?$/, "$$$1$");
        const novoTexto = textoAtual.slice(0, inicio) + trechoFinal + textoAtual.slice(fim);

        if (ehEnunciado) {
            atualizarQuestao(questao.idTemp, { enunciado: novoTexto });
        } else {
            atualizarAlternativa(questao, alternativa.idTemp, novoTexto);
        }

        requestAnimationFrame(() => {
            const campo = campos.current[chave];
            if (!campo) return;
            const posicao = inicio + trechoFinal.length;
            campo.focus();
            campo.setSelectionRange(posicao, posicao);
        });
    };

    // Nome do campo onde a fórmula vai entrar, pro botão ("Inserir no enunciado", "Inserir na alternativa B")
    const nomeDoAlvo = (questao) => {
        const indice = questao.alternativas.findIndex((a) => a.idTemp === alvo[questao.idTemp]);
        return indice >= 0 ? `Inserir na alternativa ${LETRAS[indice]}` : "Inserir no enunciado";
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
                        ref={guardarCampo(questao, "enunciado")}
                        value={questao.enunciado}
                        onChange={(e) => atualizarQuestao(questao.idTemp, { enunciado: e.target.value })}
                        onFocus={() => marcarAlvo(questao, "enunciado")}
                        placeholder="Enunciado da questão (fórmulas entre $, ex: Resolva $x^2 - 4 = 0$)"
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
                                    ref={guardarCampo(questao, alternativa.idTemp)}
                                    value={alternativa.texto}
                                    onChange={(e) => atualizarAlternativa(questao, alternativa.idTemp, e.target.value)}
                                    onFocus={() => marcarAlvo(questao, alternativa.idTemp)}
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

                    <label className="opcaoFormula">
                        <input
                            type="checkbox"
                            checked={Boolean(formulaAberta[questao.idTemp])}
                            onChange={(e) => setFormulaAberta((atual) => ({ ...atual, [questao.idTemp]: e.target.checked }))}
                            disabled={enviando}
                        />
                        Escrever fórmulas matemáticas nesta questão
                    </label>

                    {formulaAberta[questao.idTemp] && (
                        <>
                            <p className="dicaTipo">
                                Clique no enunciado ou numa alternativa e depois monte a fórmula: ela entra onde o cursor estava.
                            </p>
                            <FormulaEditor
                                onInserir={(trecho) => inserirFormula(questao, trecho)}
                                disabled={enviando}
                                rotuloInserir={nomeDoAlvo(questao)}
                                permitirBloco={nomeDoAlvo(questao) === "Inserir no enunciado"}
                            />
                        </>
                    )}

                    {/* Como o aluno vai ver a questão, com as fórmulas desenhadas */}
                    {(temFormula(questao.enunciado) || questao.alternativas.some((a) => temFormula(a.texto))) && (
                        <div className="previaExplicacao">
                            <span>Pré-visualização da questão</span>
                            <div>
                                <div className="previaEnunciado"><TextoComFormulas texto={questao.enunciado} /></div>
                                <ol className="previaAlternativas">
                                    {questao.alternativas.map((a, i) => (
                                        <li key={a.idTemp} className={questao.indiceCorreta === i ? "correta" : undefined}>
                                            <strong>{LETRAS[i]})</strong> <TextoComFormulas texto={a.texto} />
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}

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
