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
