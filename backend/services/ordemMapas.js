import prisma from './adapter.js';

// Ordem dos mapas na trilha: dentro de cada nível, quem tem "ordem" menor vem primeiro.
// Empate (não deveria acontecer) desempata pelo id, ou seja, pela ordem de criação.
export const ORDEM_DOS_MAPAS = [{ ordem: 'asc' }, { mapaId: 'asc' }];

// Mapa novo (ou que mudou de nível) entra no fim da trilha
export async function proximaOrdem() {
    const { _max } = await prisma.mapaconceitual.aggregate({ _max: { ordem: true } });
    return (_max.ordem ?? 0) + 1;
}

// Mapas do nível, na ordem da trilha
async function mapasDoNivel(nivel) {
    return prisma.mapaconceitual.findMany({
        where: { nivel },
        orderBy: ORDEM_DOS_MAPAS,
        select: { mapaId: true, ordem: true }
    });
}

// Renumera o nível com a nova sequência, usando as mesmas "ordem" que o nível já tinha
// (assim os outros níveis não mudam). Se havia ordens repetidas, usa números novos e únicos.
async function renumerar(doNivel, novaSequencia) {
    const ordensUsadas = doNivel.map((m) => m.ordem).sort((a, b) => a - b);
    const semEmpate = new Set(ordensUsadas).size === ordensUsadas.length;
    const base = semEmpate ? null : await proximaOrdem();

    await prisma.$transaction(
        novaSequencia.map((m, posicao) => prisma.mapaconceitual.update({
            where: { mapaId: m.mapaId },
            data: { ordem: semEmpate ? ordensUsadas[posicao] : base + posicao }
        }))
    );
}

// Coloca o mapa numa posição do nível dele (0 = primeiro). Posição maior que o nível vai pro fim.
// Devolve null se o mapa não existe, false se ele já estava nessa posição e true se mudou.
export async function posicionarMapa(mapaId, posicao) {
    const mapa = await prisma.mapaconceitual.findUnique({ where: { mapaId }, select: { nivel: true } });
    if (!mapa) return null;

    const doNivel = await mapasDoNivel(mapa.nivel);
    const i = doNivel.findIndex((m) => m.mapaId === mapaId);
    const destino = Math.min(Math.max(posicao, 0), doNivel.length - 1);
    if (destino === i) return false;

    const novaSequencia = doNivel.filter((m) => m.mapaId !== mapaId);
    novaSequencia.splice(destino, 0, doNivel[i]);
    await renumerar(doNivel, novaSequencia);
    return true;
}

// Sobe ou desce o mapa uma posição dentro do nível dele (setinhas do painel).
// Devolve null se o mapa não existe e false se ele já está na ponta.
export async function moverMapa(mapaId, direcao) {
    const mapa = await prisma.mapaconceitual.findUnique({ where: { mapaId }, select: { nivel: true } });
    if (!mapa) return null;

    const doNivel = await mapasDoNivel(mapa.nivel);
    const i = doNivel.findIndex((m) => m.mapaId === mapaId);
    const j = direcao === 'cima' ? i - 1 : i + 1;
    if (j < 0 || j >= doNivel.length) return false;

    return posicionarMapa(mapaId, j);
}
