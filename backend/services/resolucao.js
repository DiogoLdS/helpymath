// Regras da resolução comentada das questões (sem banco, pra dar pra testar direto).
//
// - A resolução aparece sozinha quando o aluno acerta (pra ele conferir o raciocínio).
// - Quando erra, ele escolhe: "Tentar de novo" ou "Ver resolução".
// - Quem viu a resolução de uma questão errada só pode refazê-la depois de ESPERA_MS
//   (senão bastaria ler a resposta e responder de novo pra bater a meta do mapa).

export const ESPERA_MS = 24 * 60 * 60 * 1000;
export const MAX_RESOLUCAO = 5000;
export const MAX_FONTE = 60;

// Quando a questão volta a poder ser respondida; null = já pode
export function liberadaEm(resolucaoVistaEm, agora = new Date()) {
    if (!resolucaoVistaEm) return null;
    const libera = new Date(new Date(resolucaoVistaEm).getTime() + ESPERA_MS);
    return libera > agora ? libera : null;
}

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

// Data no formato que o aluno lê ("amanhã às 14:30" fica pra tela; aqui só a hora certinha)
export function mensagemEspera(libera) {
    const hora = libera.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    return `Você viu a resolução desta questão. Ela libera para refazer amanhã, às ${hora}.`;
}
