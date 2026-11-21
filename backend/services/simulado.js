import prisma from './adapter.js';

// Simulados: "mapas" do Treino que só têm questões (ex: "ENEM 2024") e são feitos como prova.
// - O aluno marca as alternativas de todas as questões e entrega; só aí vê a nota, o gabarito e as resoluções.
// - Cada resposta fica salva em usuarioquestao, como nas questões dos mapas (conta no ranking, no perfil
//   e no "Revisar erros"). Questão deixada em branco conta como erro na nota, mas não é salva.
// - Depois de entregar, o aluno pode refazer o simulado quando quiser (a nova entrega substitui a anterior).
// - Visitante (sem conta) faz e vê a correção, mas nada fica salvo.

const MAX_QUESTOES = 200;

// Corrige as respostas (sem banco, pra dar pra testar direto).
// questoes = [{ questaoId, resolucao, alternativa: [{ id, letra, correta }] }] na ordem da prova
// respostas = [{ questaoId, alternativaId }] (alternativaId null ou ausente = em branco)
// Devolve { total, acertos, emBranco, itens } com um item por questão, na ordem da prova.
export function corrigirSimulado(questoes, respostas) {
    const marcadas = new Map();
    for (const r of Array.isArray(respostas) ? respostas : []) {
        const alternativaId = Number(r?.alternativaId);
        if (r?.alternativaId !== null && r?.alternativaId !== undefined && Number.isInteger(alternativaId)) {
            marcadas.set(Number(r?.questaoId), alternativaId);
        }
    }

    const itens = questoes.map((q) => {
        // Alternativa que não é dessa questão vale como em branco
        const marcada = q.alternativa.find((a) => a.id === marcadas.get(q.questaoId)) ?? null;
        const certa = q.alternativa.find((a) => a.correta) ?? null;
        return {
            questaoId: q.questaoId,
            alternativaId: marcada?.id ?? null,
            letraMarcada: marcada?.letra ?? null,
            letraCorreta: certa?.letra ?? null,
            correta: Boolean(marcada?.correta),
            resolucao: q.resolucao ?? null
        };
    });

    return {
        total: itens.length,
        acertos: itens.filter((i) => i.correta).length,
        emBranco: itens.filter((i) => i.alternativaId === null).length,
        itens
    };
}

// Questões do simulado, com tudo o que a correção precisa (a rota tira o gabarito antes de mandar pro aluno)
async function carregarSimulado(mapaId) {
    const mapa = await prisma.mapaconceitual.findUnique({
        where: { mapaId },
        select: { mapaId: true, nome: true, simulado: true }
    });
    if (!mapa || !mapa.simulado) return null;

    const questoes = await prisma.questao.findMany({
        where: { mapaId },
        orderBy: { questaoId: 'asc' },
        select: {
            questaoId: true,
            enunciado: true,
            fonte: true,
            resolucao: true,
            alternativa: { orderBy: { letra: 'asc' }, select: { id: true, letra: true, texto: true, correta: true } }
        }
    });

    return { mapa, questoes };
}

// Última entrega do aluno (null se nunca entregou): monta a correção a partir das respostas salvas
async function ultimaEntrega(questoes, usuarioId) {
    const salvas = await prisma.usuarioquestao.findMany({
        where: { usuarioId, questaoId: { in: questoes.map((q) => q.questaoId) } },
        select: { questaoId: true, alternativaId: true, respondidaEm: true }
    });
    if (salvas.length === 0) return null;

    const entregueEm = new Date(Math.max(...salvas.map((s) => new Date(s.respondidaEm).getTime())));
    return { ...corrigirSimulado(questoes, salvas), entregueEm };
}

// GET: a prova (sem gabarito nem resolução) e, se o aluno já entregou, a correção da última entrega.
// Devolve null se o mapa não existe ou não é simulado.
export async function buscarSimulado(mapaId, usuarioId = null, admin = false) {
    const dados = await carregarSimulado(mapaId);
    if (!dados) return null;

    const entrega = usuarioId ? await ultimaEntrega(dados.questoes, usuarioId) : null;

    return {
        mapaId: dados.mapa.mapaId,
        nome: dados.mapa.nome,
        questoes: dados.questoes.map((q) => ({
            questaoId: q.questaoId,
            enunciado: q.enunciado,
            fonte: q.fonte,
            alternativas: q.alternativa.map(({ id, letra, texto }) => ({ id, letra, texto }))
        })),
        entrega
    };
}

// POST: corrige a prova e salva as respostas. Devolve a correção, ou { erro, status }.
export async function entregarSimulado(mapaId, usuarioId, admin, respostas) {
    if (!Array.isArray(respostas) || respostas.length > MAX_QUESTOES) {
        return { erro: 'Respostas inválidas', status: 400 };
    }

    const dados = await carregarSimulado(mapaId);
    if (!dados) return { erro: 'Simulado não encontrado', status: 404 };
    if (dados.questoes.length === 0) return { erro: 'Este simulado ainda não tem questões', status: 400 };

    const resultado = corrigirSimulado(dados.questoes, respostas);

    // Visitante: só corrige
    if (!usuarioId) return { ...resultado, entregueEm: new Date(), visitante: true };

    const agora = new Date();
    const emBranco = resultado.itens.filter((i) => i.alternativaId === null).map((i) => i.questaoId);

    // Tudo ou nada: as respostas novas substituem as da entrega anterior.
    // As em branco apagam a resposta antiga, senão a correção salva misturaria duas entregas.
    await prisma.$transaction([
        ...resultado.itens.filter((i) => i.alternativaId !== null).map((i) => {
            const dadosResposta = {
                alternativaId: i.alternativaId,
                correta: i.correta,
                respondidaEm: agora,
                // O gabarito aparece na entrega: errada fica registrada como "viu a resolução"
                resolucaoVistaEm: i.correta ? null : agora
            };
            return prisma.usuarioquestao.upsert({
                where: { usuarioId_questaoId: { usuarioId, questaoId: i.questaoId } },
                update: dadosResposta,
                create: { usuarioId, questaoId: i.questaoId, ...dadosResposta }
            });
        }),
        prisma.usuarioquestao.deleteMany({ where: { usuarioId, questaoId: { in: emBranco } } })
    ]);

    return { ...resultado, entregueEm: agora };
}
