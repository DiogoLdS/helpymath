import { useState } from "react";
import api from "../../../services/api.js";
import { cabecalhoAuth } from "../../utils/auth.js";
import { TextoComMidia } from "../Midia/Midia.jsx";
import { quandoLibera } from "./resolucaoUtils.js";

// O que aparece embaixo da questão depois que o aluno responde (página Questões e Revisar):
// - acertou: "Resposta correta!" e a resolução, se a questão tiver (pra conferir o raciocínio);
// - errou: "Tentar de novo" ou "Ver resolução". Quem abre a resolução só refaz a questão
//   24 horas depois (senão bastaria ler a resposta e responder de novo pra bater a meta).
//
// resultado: { correto, revelada, resolucao, letraCorreta, liberadaEm }
// onRevelar(dados): avisa a página, que guarda os dados e destaca a alternativa certa.
// semPrazo: visitante e admin (nada fica salvo / não há meta) não esperam as 24 horas.
const RespostaQuestao = ({ questaoId, resultado, temResolucao, semPrazo, textos = {}, onTentarDeNovo, onRevelar }) => {
    const [abrindo, setAbrindo] = useState(false);
    const [erro, setErro] = useState("");

    const revelar = async () => {
        setAbrindo(true);
        setErro("");
        try {
            const { data } = await api.post(`/questoes/${questaoId}/resolucao`, {}, { headers: cabecalhoAuth() });
            onRevelar({ revelada: true, resolucao: data.resolucao, letraCorreta: data.letraCorreta, liberadaEm: data.liberadaEm });
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
                <p className="feedback correto">{textos.correto ?? "Resposta correta!"}</p>
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
                <p className="feedback incorreto">{textos.incorreto ?? "Resposta incorreta."}</p>
                {!resultado.liberadaEm && (
                    <button type="button" className="botao-responder" onClick={onTentarDeNovo}>
                        Tentar de novo
                    </button>
                )}
                {!resultado.revelada && (
                    <button type="button" className="botao-contorno" onClick={revelar} disabled={abrindo}>
                        {abrindo ? "Abrindo..." : rotuloVer}
                    </button>
                )}
            </div>

            {!resultado.revelada && !resultado.liberadaEm && !semPrazo && (
                <p className="questao-aviso">Se abrir a resolução, você só poderá refazer esta questão daqui a 24 horas.</p>
            )}
            {resultado.liberadaEm && (
                <p className="questao-aviso">
                    Você já viu a resolução. Pode refazer esta questão {quandoLibera(resultado.liberadaEm)}.
                </p>
            )}
            {erro && <p className="feedback incorreto">{erro}</p>}

            {resultado.revelada && <Resolucao resolucao={resultado.resolucao} letraCorreta={resultado.letraCorreta} />}
        </>
    );
};

// Caixa da resolução. Quando o aluno errou, diz também qual era a letra certa.
const Resolucao = ({ resolucao, letraCorreta }) => (
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
