// Contas da página do simulado (fora do componente pra dar pra testar direto)

// Lista que vai pro POST /mapas/:id/simulado: uma entrada por questão, null = em branco.
// marcadas = { questaoId: alternativaId }
export function respostasParaEnvio(questoes, marcadas) {
    return questoes.map((q) => ({ questaoId: q.questaoId, alternativaId: marcadas[q.questaoId] ?? null }));
}

// Quantas questões da prova já têm alternativa marcada (ignora lixo de rascunho antigo)
export function contarRespondidas(questoes, marcadas) {
    return questoes.filter((q) => marcadas[q.questaoId] !== undefined && marcadas[q.questaoId] !== null).length;
}

// Nota em porcentagem inteira (0 quando não tem questão)
export function porcentagemDeAcerto(acertos, total) {
    return total > 0 ? Math.round((acertos / total) * 100) : 0;
}

// Rascunho guardado no navegador: só o que ainda existe na prova (o admin pode ter tirado questões/alternativas)
export function limparRascunho(questoes, rascunho) {
    const limpo = {};
    if (!rascunho || typeof rascunho !== "object") return limpo;
    for (const q of questoes) {
        const marcada = Number(rascunho[q.questaoId]);
        if (q.alternativas.some((a) => a.id === marcada)) limpo[q.questaoId] = marcada;
    }
    return limpo;
}
