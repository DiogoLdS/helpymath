import prisma from './adapter.js';
import { ORDEM_DOS_MAPAS } from './ordemMapas.js';
import { liberadaEm } from './resolucao.js';

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

    const respostas = (await prisma.usuarioquestao.findMany({
        where: { usuarioId: usuarioId, questaoId: { in: ids } },
        select: { questaoId: true, alternativaId: true, correta: true, resolucaoVistaEm: true }
    })).map(({ resolucaoVistaEm, ...resposta }) => ({
        ...resposta,
        // Viu a resolução depois de errar: data em que pode refazer (null = já pode)
        liberadaEm: liberadaEm(resolucaoVistaEm)
    }));
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

// Níveis que formam a escada da trilha, do mais fácil pro mais difícil. O Treino fica de fora: é aberto pra todos.
export const ESCADA_DE_NIVEIS = ['basico', 'intermediario', 'avancado'];
const NOME_DO_NIVEL = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado', treino: 'Treino' };

// Até qual degrau da escada o aluno já começa liberado: o nível dele (escolhido ou sugerido pelo teste)
// e todos os de baixo. Sem nível (ou com Treino) começa no Básico.
export function degrauInicial(nivelDoAluno) {
    return Math.max(ESCADA_DE_NIVEIS.indexOf(nivelDoAluno), 0);
}

// Situação de todos os mapas pro usuário.
// Mapa concluído = todos os conteúdos interativos concluídos + 60% de acerto nas questões.
// Níveis: o aluno começa com o nível dele e os de baixo liberados (quem é Intermediário pode fazer o Básico,
// mas não o Avançado). O nível seguinte só abre quando ele conclui TODOS os mapas do nível de baixo.
// O Treino é aberto pra todos.
// Dentro de cada nível os mapas seguem a ordem da trilha: o primeiro fica liberado e cada um dos outros
// libera quando o anterior (do mesmo nível) é concluído.
// Admin vê tudo liberado (precisa acessar qualquer mapa pra editar e conferir).
// Visitante (usuarioId null, sem conta): tudo liberado e nada concluído, porque não há progresso salvo.
export async function situacaoDosMapas(usuarioId, admin) {
    const visitante = usuarioId === null || usuarioId === undefined;
    const mapas = await prisma.mapaconceitual.findMany({
        select: { mapaId: true, nome: true, nivel: true, simulado: true },
        orderBy: ORDEM_DOS_MAPAS
    });

    let inicial = ESCADA_DE_NIVEIS.length; // visitante e admin: escada toda liberada
    if (!visitante && !admin) {
        const usuario = await prisma.usuario.findUnique({ where: { usuarioId }, select: { nivel: true } });
        inicial = degrauInicial(usuario?.nivel);
    }

    // Mapas agrupados por nível, na ordem da trilha
    const porNivel = {};
    for (const mapa of mapas) (porNivel[mapa.nivel] ??= []).push(mapa);

    // Os níveis da escada primeiro (o de cima depende de o de baixo estar concluído), depois os outros (Treino)
    const ordemDosNiveis = [...ESCADA_DE_NIVEIS, ...Object.keys(porNivel).filter((n) => !ESCADA_DE_NIVEIS.includes(n))];

    const situacaoPorId = new Map();
    let ultimoAberto = null; // último nível da escada liberado até agora (e se já foi concluído inteiro)
    let escadaLivre = true;  // false depois do primeiro nível trancado: os de cima também ficam trancados

    for (const nivel of ordemDosNiveis) {
        const degrau = ESCADA_DE_NIVEIS.indexOf(nivel);
        const naEscada = degrau !== -1;
        const nivelLiberado = !naEscada || (escadaLivre && (degrau <= inicial || ultimoAberto.concluido));
        // Nível aberto por ter concluído o de baixo (pra animar o cadeado do primeiro mapa dele)
        const liberadoPorConclusao = naEscada && nivelLiberado && degrau > inicial;
        // Nível trancado: o de baixo dele é o que precisa ser concluído inteiro
        const deBaixo = naEscada ? ESCADA_DE_NIVEIS[degrau - 1] : null;
        const nivelPendente = !nivelLiberado && deBaixo ? { nivel: deBaixo, nome: NOME_DO_NIVEL[deBaixo] } : null;

        let anterior = null;
        let todosConcluidos = true;

        for (const mapa of porNivel[nivel] ?? []) {
            // Simulado: sempre aberto e fora da sequência (não tranca nem é trancado pelos mapas do lado)
            if (mapa.simulado) {
                situacaoPorId.set(mapa.mapaId, await situacaoDoSimulado(mapa, usuarioId, visitante));
                continue;
            }

            const liberado = visitante || admin || (nivelLiberado && (anterior === null || anterior.concluido));

            // Mapa trancado não conta como concluído, mesmo que esteja vazio (sem conteúdos nem questões)
            let concluido = false;
            // Números do aluno no mapa, usados na trilha e no assistente da página de mapas (null se trancado)
            let progresso = null;

            if (liberado && !visitante) {
                const conteudos = await progressoNoMapa(mapa.mapaId, usuarioId);
                const questoes = await resultadoQuestoes(mapa.mapaId, usuarioId);

                concluido = conteudos.pendentes.length === 0 && questoes.aprovado;
                progresso = {
                    conteudosFeitos: conteudos.concluidos.length,
                    conteudosTotal: conteudos.total,
                    questoesRespondidas: questoes.respondidas,
                    questoesAcertos: questoes.acertos,
                    questoesTotal: questoes.total
                };
            }

            situacaoPorId.set(mapa.mapaId, {
                ...mapa,
                concluido,
                liberado,
                progresso,
                // Pra mensagem "conclua o mapa X primeiro"
                anterior: anterior ? { mapaId: anterior.mapaId, nome: anterior.nome } : null,
                // Nível ainda trancado: { nivel, nome } do nível que falta concluir inteiro (senão null)
                nivelPendente: visitante || admin ? null : nivelPendente,
                liberadoPorConclusao: !visitante && !admin && liberadoPorConclusao
            });

            anterior = { mapaId: mapa.mapaId, nome: mapa.nome, concluido };
            if (!concluido) todosConcluidos = false;
        }

        if (naEscada) {
            if (nivelLiberado) ultimoAberto = { nivel, concluido: todosConcluidos };
            else escadaLivre = false;
        }
    }

    // Devolve na ordem original da trilha
    return mapas.map((m) => situacaoPorId.get(m.mapaId));
}

// Simulado na trilha: sempre liberado; "concluído" = o aluno já entregou (respondeu alguma questão dele)
async function situacaoDoSimulado(mapa, usuarioId, visitante) {
    let concluido = false;
    let progresso = null;

    if (!visitante) {
        const questoes = await resultadoQuestoes(mapa.mapaId, usuarioId);
        concluido = questoes.respondidas > 0;
        progresso = {
            conteudosFeitos: 0,
            conteudosTotal: 0,
            questoesRespondidas: questoes.respondidas,
            questoesAcertos: questoes.acertos,
            questoesTotal: questoes.total
        };
    }

    return { ...mapa, concluido, liberado: true, progresso, anterior: null, nivelPendente: null, liberadoPorConclusao: false };
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
