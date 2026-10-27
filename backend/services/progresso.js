import prisma from './adapter.js';

// Tipo de conteúdo que o aluno precisa "Marcar como concluído": o botão explicativo (tipo 1),
// que abre a janela com a explicação. Indicadores (tipo 2) e links (tipo 3) não contam.
export const TIPO_INTERATIVO = 1;

// Progresso de um usuário num mapa: quais conteúdos interativos ele já concluiu e quais faltam.
export async function progressoNoMapa(mapaId, usuarioId) {
    const vinculos = await prisma.mapaconteudo.findMany({
        where: { mapaId: mapaId, conteudo: { tipo: TIPO_INTERATIVO } },
        select: { conteudoId: true }
    });
    const interativos = vinculos.map((v) => v.conteudoId);

    const feitos = await prisma.usuarioconteudo.findMany({
        where: { usuarioId: usuarioId, conteudoId: { in: interativos }, concluido: true },
        select: { conteudoId: true }
    });
    const concluidos = feitos.map((f) => f.conteudoId);

    return {
        concluidos,
        pendentes: interativos.filter((id) => !concluidos.includes(id)),
        total: interativos.length
    };
}

// Para concluir o mapa, o aluno precisa acertar pelo menos 60% das questões dele
export const NOTA_MINIMA = 0.6;

// Resultado do aluno nas questões de um mapa (vale a última tentativa de cada questão)
export async function resultadoQuestoes(mapaId, usuarioId) {
    const questoes = await prisma.questao.findMany({
        where: { mapaId: mapaId },
        select: { questaoId: true }
    });
    const ids = questoes.map((q) => q.questaoId);

    const respostas = await prisma.usuarioquestao.findMany({
        where: { usuarioId: usuarioId, questaoId: { in: ids } },
        select: { questaoId: true, alternativaId: true, correta: true }
    });
    const acertos = respostas.filter((r) => r.correta).length;

    return {
        total: ids.length,
        respondidas: respostas.length,
        acertos,
        respostas,
        // Mapa sem questões não trava ninguém
        aprovado: ids.length === 0 || acertos / ids.length >= NOTA_MINIMA
    };
}

// Mapa concluído = todos os conteúdos interativos concluídos + 60% de acerto nas questões
export async function mapaConcluido(mapaId, usuarioId) {
    const { pendentes } = await progressoNoMapa(mapaId, usuarioId);
    if (pendentes.length > 0) return false;

    const { aprovado } = await resultadoQuestoes(mapaId, usuarioId);
    return aprovado;
}

// Situação de todos os mapas pro usuário. Dentro de cada nível os mapas seguem a ordem de criação:
// o primeiro fica liberado e cada um dos outros libera quando o anterior (do mesmo nível) é concluído.
// Admin vê tudo liberado (precisa acessar qualquer mapa pra editar e conferir).
export async function situacaoDosMapas(usuarioId, admin) {
    const mapas = await prisma.mapaconceitual.findMany({
        select: { mapaId: true, nome: true, nivel: true },
        orderBy: { mapaId: 'asc' }
    });

    const anteriorPorNivel = {};
    const situacao = [];

    for (const mapa of mapas) {
        const anterior = anteriorPorNivel[mapa.nivel] ?? null;
        const liberado = admin || anterior === null || anterior.concluido;
        // Mapa trancado não conta como concluído, mesmo que esteja vazio (sem conteúdos nem questões)
        const concluido = liberado && await mapaConcluido(mapa.mapaId, usuarioId);

        situacao.push({
            ...mapa,
            concluido,
            liberado,
            // Pra mensagem "conclua o mapa X primeiro"
            anterior: anterior ? { mapaId: anterior.mapaId, nome: anterior.nome } : null
        });

        anteriorPorNivel[mapa.nivel] = { mapaId: mapa.mapaId, nome: mapa.nome, concluido };
    }

    return situacao;
}

// Situação de um mapa só, com o próximo do mesmo nível (ou null se for o último)
export async function situacaoDoMapa(mapaId, usuarioId, admin) {
    const todos = await situacaoDosMapas(usuarioId, admin);
    const mapa = todos.find((m) => m.mapaId === mapaId);
    if (!mapa) return null;

    const doNivel = todos.filter((m) => m.nivel === mapa.nivel);
    const proximo = doNivel[doNivel.findIndex((m) => m.mapaId === mapaId) + 1] ?? null;

    return {
        ...mapa,
        proximo: proximo ? { mapaId: proximo.mapaId, nome: proximo.nome } : null
    };
}
