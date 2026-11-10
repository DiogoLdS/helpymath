import prisma from './adapter.js';
import { NOTA_MINIMA } from './progresso.js';

// Teste diagnóstico (perguntas de boas-vindas): para quem não sabe por qual nível começar.
// Usa as questões que já existem nos mapas: algumas de cada nível, do Básico ao Avançado.
// As respostas daqui NÃO contam no progresso dos mapas: servem só pra sugerir o nível.
export const NIVEIS_DIAGNOSTICO = ['basico', 'intermediario', 'avancado'];
export const QUESTOES_POR_NIVEL = 3;

// Embaralha uma cópia da lista (Fisher-Yates)
function embaralhar(lista, sortear = Math.random) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(sortear() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Sorteia as questões do teste. Só entram questões com alternativa correta (as outras ninguém acerta).
// Nunca manda qual alternativa é a correta.
export async function questoesDoDiagnostico(sortear = Math.random) {
    const questoes = await prisma.questao.findMany({
        where: {
            mapaconceitual: { nivel: { in: NIVEIS_DIAGNOSTICO } },
            alternativa: { some: { correta: true } }
        },
        select: {
            questaoId: true,
            enunciado: true,
            mapaconceitual: { select: { nivel: true } },
            alternativa: { select: { id: true, letra: true, texto: true }, orderBy: { letra: 'asc' } }
        }
    });

    return NIVEIS_DIAGNOSTICO.flatMap((nivel) => embaralhar(questoes.filter((q) => q.mapaconceitual.nivel === nivel), sortear)
        .slice(0, QUESTOES_POR_NIVEL)
        .map((q) => ({
            questaoId: q.questaoId,
            nivel,
            enunciado: q.enunciado,
            alternativas: q.alternativa
        })));
}

// Corrige o teste e sugere o nível: o primeiro nível (do Básico pro Avançado) em que o aluno
// acertou menos de 60%. Se passou em todos, sugere o último que tinha questões.
// respostas = [{ questaoId, alternativaId }] (alternativaId null = "não sei", conta como erro)
export async function corrigirDiagnostico(respostas) {
    if (!Array.isArray(respostas) || respostas.length === 0 || respostas.length > 30) {
        return { erro: "Respostas inválidas" };
    }
    const ids = [...new Set(respostas.map((r) => Number(r?.questaoId)))];
    if (ids.some((id) => !Number.isInteger(id))) return { erro: "Respostas inválidas" };

    const questoes = await prisma.questao.findMany({
        where: { questaoId: { in: ids }, mapaconceitual: { nivel: { in: NIVEIS_DIAGNOSTICO } } },
        select: {
            questaoId: true,
            mapaconceitual: { select: { nivel: true } },
            alternativa: { where: { correta: true }, select: { id: true } }
        }
    });

    const porNivel = NIVEIS_DIAGNOSTICO.map((nivel) => ({ nivel, total: 0, acertos: 0 }));
    for (const q of questoes) {
        const resultado = porNivel.find((p) => p.nivel === q.mapaconceitual.nivel);
        const resposta = respostas.find((r) => Number(r.questaoId) === q.questaoId);
        resultado.total += 1;
        if (q.alternativa.some((a) => a.id === Number(resposta?.alternativaId))) resultado.acertos += 1;
    }

    const comQuestoes = porNivel.filter((p) => p.total > 0);
    const primeiroFraco = comQuestoes.find((p) => p.acertos / p.total < NOTA_MINIMA);
    const sugerido = primeiroFraco?.nivel ?? comQuestoes.at(-1)?.nivel ?? 'basico';

    return { sugerido, porNivel };
}
