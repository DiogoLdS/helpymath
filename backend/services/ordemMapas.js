import prisma from './adapter.js';

// Ordem dos mapas na trilha: dentro de cada nível, quem tem "ordem" menor vem primeiro.
// Empate (não deveria acontecer) desempata pelo id, ou seja, pela ordem de criação.
export const ORDEM_DOS_MAPAS = [{ ordem: 'asc' }, { mapaId: 'asc' }];

// Mapa novo (ou que mudou de nível) entra no fim da trilha
export async function proximaOrdem() {
    const { _max } = await prisma.mapaconceitual.aggregate({ _max: { ordem: true } });
    return (_max.ordem ?? 0) + 1;
}

// Sobe ou desce o mapa uma posição dentro do nível dele.
// Renumera o nível inteiro (1, 2, 3...) já com a troca, assim nunca sobra empate.
// Devolve null se o mapa não existe e false se ele já está na ponta.
export async function moverMapa(mapaId, direcao) {
    const mapa = await prisma.mapaconceitual.findUnique({ where: { mapaId }, select: { nivel: true } });
    if (!mapa) return null;

    const doNivel = await prisma.mapaconceitual.findMany({
        where: { nivel: mapa.nivel },
        orderBy: ORDEM_DOS_MAPAS,
        select: { mapaId: true, ordem: true }
    });

    const i = doNivel.findIndex((m) => m.mapaId === mapaId);
    const j = direcao === 'cima' ? i - 1 : i + 1;
    if (j < 0 || j >= doNivel.length) return false;

    // As ordens que o nível já usa, em ordem: o mapa só troca de lugar, sem mexer nos outros níveis
    const ordensUsadas = doNivel.map((m) => m.ordem).sort((a, b) => a - b);
    const novaSequencia = [...doNivel];
    [novaSequencia[i], novaSequencia[j]] = [novaSequencia[j], novaSequencia[i]];

    // Se havia ordens repetidas no nível, abre espaço com números novos e únicos
    const semEmpate = new Set(ordensUsadas).size === ordensUsadas.length;
    const base = semEmpate ? null : await proximaOrdem();

    await prisma.$transaction(
        novaSequencia.map((m, posicao) => prisma.mapaconceitual.update({
            where: { mapaId: m.mapaId },
            data: { ordem: semEmpate ? ordensUsadas[posicao] : base + posicao }
        }))
    );

    return true;
}
