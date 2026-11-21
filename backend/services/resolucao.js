// Regras da resolução comentada das questões (sem banco, pra dar pra testar direto).
//
// - A resolução aparece sozinha quando o aluno acerta (pra ele conferir o raciocínio).
// - Quando erra, ele escolhe: "Tentar de novo" ou "Ver resolução". Pode refazer a questão na hora,
//   mesmo depois de ver a resolução.

export const MAX_RESOLUCAO = 5000;
export const MAX_FONTE = 60;

// Limpa e confere os campos que o admin manda. Só valida o que veio (undefined = não mexe).
// Devolve { dados } ou { erro }.
export function validarCamposQuestao({ resolucao, fonte }) {
    const dados = {};

    if (resolucao !== undefined) {
        if (resolucao !== null && typeof resolucao !== 'string') return { erro: 'Resolução inválida.' };
        const texto = (resolucao ?? '').trim();
        if (texto.length > MAX_RESOLUCAO) return { erro: `A resolução pode ter no máximo ${MAX_RESOLUCAO} caracteres.` };
        dados.resolucao = texto || null;
    }

    if (fonte !== undefined) {
        if (fonte !== null && typeof fonte !== 'string') return { erro: 'Fonte inválida.' };
        const texto = (fonte ?? '').trim().replace(/\s+/g, ' ');
        if (texto.length > MAX_FONTE) return { erro: `A fonte pode ter no máximo ${MAX_FONTE} caracteres.` };
        dados.fonte = texto || null;
    }

    return { dados };
}
