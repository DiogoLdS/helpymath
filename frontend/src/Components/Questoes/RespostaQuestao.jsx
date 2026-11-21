import { useState } from "react";
import api from "../../../services/api.js";
import { cabecalhoAuth } from "../../utils/auth.js";
import { TextoComMidia } from "../Midia/Midia.jsx";

// O que aparece embaixo da questão depois que o aluno responde (página Questões e Revisar):
// - acertou: "Resposta correta!" e a resolução, se a questão tiver (pra conferir o raciocínio);
// - errou: "Tentar de novo" ou "Ver resolução" (e, mesmo depois de ver, pode tentar de novo).
//
// resultado: { correto, revelada, resolucao, letraCorreta }
// onRevelar(dados): avisa a página, que guarda os dados e destaca a alternativa certa.
const RespostaQuestao = ({ questaoId, resultado, temResolucao, textos = {}, onTentarDeNovo, onRevelar }) => {
    const [abrindo, setAbrindo] = useState(false);
    const [erro, setErro] = useState("");

    const revelar = async () => {
        setAbrindo(true);
        setErro("");
        try {
            const { data } = await api.post(`/questoes/${questaoId}/resolucao`, {}, { headers: cabecalhoAuth() });
            onRevelar({ revelada: true, resolucao: data.resolucao, letraCorreta: data.letraCorreta });
        } catch (error) {
            setErro(error.response?.data?.error ?? "Não foi possível abrir a resolução. Tente de novo.");
            console.log(error.message);
        } finally {
            setAbrindo(false);
        }
    };

    const rotuloVer = temResolucao === false ? "Ver resposta certa" : "Ver resolução";

    if (resultado.correto) {
        return (
            <>
                <p className="feedback correto" role="status">{textos.correto ?? "Resposta correta!"}</p>
                {resultado.revelada ? (
                    resultado.resolucao && <Resolucao resolucao={resultado.resolucao} />
                ) : temResolucao && (
                    <button type="button" className="botao-contorno" onClick={revelar} disabled={abrindo}>
                        {abrindo ? "Abrindo..." : "Ver resolução"}
                    </button>
                )}
                {erro && <p className="feedback incorreto">{erro}</p>}
            </>
        );
    }

    return (
        <>
            <div className="feedback-linha">
                <p className="feedback incorreto" role="status">{textos.incorreto ?? "Resposta incorreta."}</p>
                <button type="button" className="botao-responder" onClick={onTentarDeNovo}>
                    Tentar de novo
                </button>
                {!resultado.revelada && (
                    <button type="button" className="botao-contorno" onClick={revelar} disabled={abrindo}>
                        {abrindo ? "Abrindo..." : rotuloVer}
                    </button>
                )}
            </div>

            {erro && <p className="feedback incorreto">{erro}</p>}

            {resultado.revelada && <Resolucao resolucao={resultado.resolucao} letraCorreta={resultado.letraCorreta} />}
        </>
    );
};

// Caixa da resolução. Quando o aluno errou, diz também qual era a letra certa.
// (Também usada na correção do simulado.)
export const Resolucao =({ resolucao, letraCorreta }) => (
    <div className="resolucaoQuestao">
        <strong className="resolucaoTitulo">Resolução</strong>
        {letraCorreta && <p className="resolucaoLetra">Resposta certa: letra {letraCorreta}.</p>}
        {resolucao ? (
            <div className="resolucaoTexto"><TextoComMidia texto={resolucao} /></div>
        ) : (
            <p className="resolucaoVazia">Esta questão ainda não tem resolução comentada.</p>
        )}
    </div>
);

export default RespostaQuestao;
