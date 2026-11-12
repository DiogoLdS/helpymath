import { useRef, useState } from "react";
import { LETRAS, MAX_FONTE, MAX_RESOLUCAO, MIN_ALTERNATIVAS, novaAlternativa, novaQuestao } from "./questoesUtils.js";
import FormulaEditor from "../Formulas/FormulaEditor.jsx";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { temFormula } from "../Formulas/formulaUtils.js";
import api from "../../../services/api.js";
import { cabecalhoAuth } from "../../utils/auth.js";

// Parte do formulário do mapa onde o admin cadastra as questões (múltipla escolha).
// Quem guarda a lista é o MapaForm; aqui só se mostra e altera.
//
// Fórmulas (KaTeX): cada questão tem um editor de fórmulas. Ele insere no campo em que o cursor
// estava por último (o enunciado, uma das alternativas ou a resolução), igual à explicação dos conteúdos.

const QuestoesForm = ({ questoes, setQuestoes, enviando }) => {
    // Questões com o editor de fórmulas aberto: { idTemp: true }
    const [formulaAberta, setFormulaAberta] = useState({});
    // Campo onde a fórmula vai entrar, por questão: { idTemp: "enunciado" | "resolucao" | idTemp da alternativa }
    const [alvo, setAlvo] = useState({});
    // Os campos de verdade (pra saber a posição do cursor): chave "questao:campo"
    const campos = useRef({});
    // Resolução com IA: questão sendo gerada agora e o aviso que aparece embaixo do campo
    const [gerandoIA, setGerandoIA] = useState(null);
    const [avisoIA, setAvisoIA] = useState({}); // { idTemp: { tipo: "ok" | "alerta" | "erro", texto } }

    const atualizarQuestao = (idTemp, mudancas) => {
        setQuestoes((atual) => atual.map((q) => (q.idTemp === idTemp ? { ...q, ...mudancas } : q)));
    };

    const guardarCampo = (questao, campo) => (el) => { campos.current[`${questao.idTemp}:${campo}`] = el; };
    const marcarAlvo = (questao, campo) => setAlvo((atual) => ({ ...atual, [questao.idTemp]: campo }));

    // Joga a fórmula no enunciado ou na alternativa escolhida, no lugar do cursor
    const inserirFormula = (questao, trecho) => {
        const campoAlvo = alvo[questao.idTemp] ?? "enunciado";
        const alternativa = questao.alternativas.find((a) => a.idTemp === campoAlvo);
        // Enunciado e resolução são textos de várias linhas; alternativa é uma linha só
        const campoTexto = campoAlvo === "resolucao" ? "resolucao" : (!alternativa ? "enunciado" : null);
        const ehEnunciado = campoTexto !== null;
        const textoAtual = ehEnunciado ? questao[campoTexto] : alternativa.texto;
        const chave = `${questao.idTemp}:${ehEnunciado ? campoTexto : campoAlvo}`;
        const el = campos.current[chave];

        const inicio = el ? el.selectionStart : textoAtual.length;
        const fim = el ? el.selectionEnd : textoAtual.length;
        // Alternativa é uma linha só: fórmula em bloco vira fórmula na linha
        const trechoFinal = ehEnunciado ? trecho : trecho.replace(/^\n?\$\$([\s\S]*)\$\$\n?$/, "$$$1$");
        const novoTexto = textoAtual.slice(0, inicio) + trechoFinal + textoAtual.slice(fim);

        if (ehEnunciado) {
            atualizarQuestao(questao.idTemp, { [campoTexto]: novoTexto });
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
        if (alvo[questao.idTemp] === "resolucao") return "Inserir na resolução";
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

    // Pede à IA um rascunho da resolução. O texto entra no campo pro admin ler e corrigir antes de salvar:
    // nada vai pro aluno sem revisão (a regra fica explicada em backend/services/iaResolucao.js).
    const gerarComIA = async (questao) => {
        const avisar = (tipo, texto) => setAvisoIA((atual) => ({ ...atual, [questao.idTemp]: { tipo, texto } }));

        if (!questao.enunciado.trim() || questao.alternativas.some((a) => !a.texto.trim())) {
            avisar("erro", "Escreva o enunciado e todas as alternativas antes de gerar a resolução.");
            return;
        }
        if (questao.indiceCorreta === null) {
            avisar("erro", "Marque a alternativa correta antes de gerar a resolução.");
            return;
        }
        if (questao.resolucao.trim() && !window.confirm("Trocar a resolução que já está escrita pela da IA?")) return;

        setGerandoIA(questao.idTemp);
        avisar("ok", "");
        try {
            const letraCorreta = LETRAS[questao.indiceCorreta];
            const { data } = await api.post("/admin/questoes/resolucao-ia", {
                enunciado: questao.enunciado,
                alternativas: questao.alternativas.map((a, i) => ({ letra: LETRAS[i], texto: a.texto })),
                letraCorreta,
            }, { headers: cabecalhoAuth() });

            atualizarQuestao(questao.idTemp, { resolucao: data.resolucao });
            if (data.confere) {
                avisar("ok", "Rascunho escrito pela IA. Leia com atenção e corrija o que precisar antes de salvar.");
            } else {
                avisar("alerta", `Atenção: a IA chegou na letra ${data.letraEncontrada}, mas a marcada como correta é a ${letraCorreta}. `
                    + "Confira a questão e reescreva a resolução se for preciso.");
            }
        } catch (error) {
            avisar("erro", error.response?.data?.error ?? "Não foi possível gerar a resolução agora. Tente de novo.");
            console.log(error.message);
        } finally {
            setGerandoIA(null);
        }
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
                                {/* Bolinha + letra num label só: clicar (ou tocar) na letra também marca a correta */}
                                <label className="marcarCorreta">
                                    <input
                                        type="radio"
                                        name={`correta-${questao.idTemp}`}
                                        checked={questao.indiceCorreta === indice}
                                        onChange={() => atualizarQuestao(questao.idTemp, { indiceCorreta: indice })}
                                        aria-label={`Alternativa ${LETRAS[indice]} é a correta`}
                                    />
                                    <span className="letraAlternativa" aria-hidden="true">{LETRAS[indice]}</span>
                                </label>
                                <input
                                    type="text"
                                    ref={guardarCampo(questao, alternativa.idTemp)}
                                    value={alternativa.texto}
                                    onChange={(e) => atualizarAlternativa(questao, alternativa.idTemp, e.target.value)}
                                    onFocus={() => marcarAlvo(questao, alternativa.idTemp)}
                                    placeholder={`Texto da alternativa ${LETRAS[indice]}`}
                                    aria-label={`Texto da alternativa ${LETRAS[indice]}`}
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

                    <div className="linhaRotuloResolucao">
                        <label className="rotuloCampoQuestao" htmlFor={`resolucao-${questao.idTemp}`}>
                            Resolução comentada <span>(opcional)</span>
                        </label>
                        <button
                            type="button"
                            className="botaoGerarIA"
                            onClick={() => gerarComIA(questao)}
                            disabled={enviando || gerandoIA !== null}
                        >
                            {gerandoIA === questao.idTemp ? "Escrevendo..." : "Gerar com IA"}
                        </button>
                    </div>
                    <textarea
                        id={`resolucao-${questao.idTemp}`}
                        ref={guardarCampo(questao, "resolucao")}
                        value={questao.resolucao}
                        maxLength={MAX_RESOLUCAO}
                        onChange={(e) => atualizarQuestao(questao.idTemp, { resolucao: e.target.value })}
                        onFocus={() => marcarAlvo(questao, "resolucao")}
                        placeholder="Explique o caminho até a resposta, passo a passo. O aluno vê depois de responder."
                        rows={4}
                        disabled={enviando || gerandoIA === questao.idTemp}
                        aria-describedby={avisoIA[questao.idTemp]?.texto ? `aviso-ia-${questao.idTemp}` : undefined}
                    />
                    {avisoIA[questao.idTemp]?.texto && (
                        <p
                            id={`aviso-ia-${questao.idTemp}`}
                            className={`avisoIA ${avisoIA[questao.idTemp].tipo}`}
                            role={avisoIA[questao.idTemp].tipo === "ok" ? "status" : "alert"}
                        >
                            {avisoIA[questao.idTemp].texto}
                        </p>
                    )}

                    <label className="rotuloCampoQuestao" htmlFor={`fonte-${questao.idTemp}`}>
                        Fonte <span>(opcional)</span>
                    </label>
                    <input
                        type="text"
                        id={`fonte-${questao.idTemp}`}
                        className="campoFonte"
                        value={questao.fonte}
                        maxLength={MAX_FONTE}
                        onChange={(e) => atualizarQuestao(questao.idTemp, { fonte: e.target.value })}
                        placeholder="Ex: ENEM 2023"
                        disabled={enviando}
                    />

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
                                Clique no enunciado, numa alternativa ou na resolução e depois monte a fórmula: ela entra onde o cursor estava.
                            </p>
                            <FormulaEditor
                                onInserir={(trecho) => inserirFormula(questao, trecho)}
                                disabled={enviando}
                                rotuloInserir={nomeDoAlvo(questao)}
                                permitirBloco={!nomeDoAlvo(questao).startsWith("Inserir na alternativa")}
                            />
                        </>
                    )}

                    {/* Como o aluno vai ver a questão, com as fórmulas desenhadas */}
                    {(temFormula(questao.enunciado) || temFormula(questao.resolucao) || questao.alternativas.some((a) => temFormula(a.texto))) && (
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
                                {questao.resolucao.trim() && (
                                    <div className="previaResolucao">
                                        <strong>Resolução:</strong> <TextoComFormulas texto={questao.resolucao} />
                                    </div>
                                )}
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
