// Funções de apoio das questões (fora do QuestoesForm.jsx porque arquivo de componente só deve exportar componentes)
//
// Cada questão: { idTemp, enunciado, alternativas: [{ idTemp, texto }], indiceCorreta }
// A letra (A, B, C...) não é guardada: sai da posição da alternativa na lista.
// Questões e alternativas que já estão no banco trazem também questaoId / alternativaId.

import api from "../../../services/api.js";

export const LETRAS = ["A", "B", "C", "D", "E"];
export const MIN_ALTERNATIVAS = 2;

let proximoIdTemporario = 1;

export const novaAlternativa = () => ({ idTemp: proximoIdTemporario++, texto: "" });

export const novaQuestao = () => ({
    idTemp: proximoIdTemporario++,
    enunciado: "",
    // Começa com 4 alternativas (A-D), que é o mais comum; dá pra adicionar a E ou tirar
    alternativas: [novaAlternativa(), novaAlternativa(), novaAlternativa(), novaAlternativa()],
    indiceCorreta: null,
});

// Devolve a mensagem do primeiro problema encontrado, ou "" se estiver tudo certo
export function validarQuestoes(questoes) {
    for (let i = 0; i < questoes.length; i++) {
        const q = questoes[i];
        const numero = i + 1;

        if (!q.enunciado.trim()) {
            return `A questão ${numero} precisa de um enunciado.`;
        }

        if (q.alternativas.some((a) => !a.texto.trim())) {
            return `Preencha todas as alternativas da questão ${numero} (ou remova as que sobrarem).`;
        }

        if (q.indiceCorreta === null) {
            return `Marque qual é a alternativa correta da questão ${numero}.`;
        }
    }

    return "";
}

// Converte uma questão como vem do banco (GET /admin/mapas/:id/questoes) pro formato do formulário
export function questaoDoBanco(q) {
    const indiceCorreta = q.alternativa.findIndex((a) => a.correta);

    return {
        idTemp: `existente-${q.questaoId}`,
        questaoId: q.questaoId,
        enunciado: q.enunciado,
        alternativas: q.alternativa.map((a) => ({
            idTemp: `existente-alt-${a.id}`,
            alternativaId: a.id,
            texto: a.texto,
        })),
        // Se nenhuma estiver marcada no banco, o admin vai ter que marcar antes de salvar
        indiceCorreta: indiceCorreta === -1 ? null : indiceCorreta,
    };
}

// Cria no banco uma questão nova do mapa e, depois, cada alternativa dela
export async function criarQuestaoComAlternativas(mapaId, questao, headers) {
    const respostaQuestao = await api.post(
        "/criarQuestao",
        {
            mapaId,
            // O banco pede uma data pra questão; usa o dia em que ela foi cadastrada
            data: new Date().toISOString().slice(0, 10),
            enunciado: questao.enunciado.trim(),
        },
        { headers }
    );
    const questaoId = respostaQuestao.data.questaoId;

    for (let j = 0; j < questao.alternativas.length; j++) {
        await api.post(
            `/questoes/${questaoId}/alternativas`,
            {
                texto: questao.alternativas[j].texto.trim(),
                letra: LETRAS[j],
                correta: j === questao.indiceCorreta,
            },
            { headers }
        );
    }
}
