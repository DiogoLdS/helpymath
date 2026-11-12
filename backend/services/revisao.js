import prisma from './adapter.js';
import { liberadaEm } from './resolucao.js';

// "Revisar erros": as questões que o aluno errou (na última tentativa), de todos os mapas, num lugar só.
// Vem agrupado por mapa, na ordem da trilha. A alternativa correta NÃO vai junto (o aluno refaz a questão).
// Pra responder, a página usa a mesma rota das questões (POST /questoes/:id/responder).
export async function questoesParaRevisar(usuarioId) {
    const erradas = await prisma.usuarioquestao.findMany({
        where: { usuarioId, correta: false },
        orderBy: { respondidaEm: 'desc' },
        select: {
            respondidaEm: true,
            resolucaoVistaEm: true,
            questao: {
                select: {
                    questaoId: true,
                    enunciado: true,
                    alternativa: { select: { id: true, letra: true, texto: true }, orderBy: { letra: 'asc' } },
                    mapaconceitual: { select: { mapaId: true, nome: true, nivel: true, ordem: true } }
                }
            }
        }
    });

    // Agrupa por mapa, mantendo a ordem da trilha (ordem, depois id)
    const porMapa = new Map();
    for (const { respondidaEm, resolucaoVistaEm, questao } of erradas) {
        const mapa = questao.mapaconceitual;
        if (!porMapa.has(mapa.mapaId)) {
            porMapa.set(mapa.mapaId, { mapaId: mapa.mapaId, nome: mapa.nome, nivel: mapa.nivel, ordem: mapa.ordem, questoes: [] });
        }
        porMapa.get(mapa.mapaId).questoes.push({
            questaoId: questao.questaoId,
            enunciado: questao.enunciado,
            erradaEm: respondidaEm,
            // Viu a resolução há pouco: só pode refazer a partir desta data (null = já pode)
            liberadaEm: liberadaEm(resolucaoVistaEm),
            alternativa: questao.alternativa
        });
    }

    // Mesma regra de ORDEM_DOS_MAPAS (services/ordemMapas.js): ordem, depois id
    const mapas = [...porMapa.values()]
        .sort((a, b) => a.ordem - b.ordem || a.mapaId - b.mapaId)
        .map((mapa) => ({ mapaId: mapa.mapaId, nome: mapa.nome, nivel: mapa.nivel, questoes: mapa.questoes }));

    return { total: erradas.length, mapas };
}
