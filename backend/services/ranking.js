import prisma from './adapter.js';

// Mesmos pontos do perfil (frontend/src/Components/Perfil/perfilUtils.js)
export const PONTOS_POR_CONTEUDO = 10;
export const PONTOS_POR_ACERTO = 5;
export const TAMANHO_DO_RANKING = 10;
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

// Privacidade: no ranking aparece só o primeiro nome e a inicial do sobrenome ("Ana S.")
export function nomeCurto(nome = '') {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'Aluno';
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

// Ordena por pontos e dá a posição. Empate = mesma posição (1, 2, 2, 4...).
// Quem não fez nenhum ponto fica de fora.
export function classificar(alunos) {
    const comPontos = alunos
        .filter((a) => a.pontos > 0)
        .sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos || a.usuarioId - b.usuarioId);

    const resultado = [];
    comPontos.forEach((aluno, i) => {
        // Mesma pontuação do anterior: herda a posição dele
        const empatou = i > 0 && comPontos[i - 1].pontos === aluno.pontos;
        resultado.push({ ...aluno, posicao: empatou ? resultado[i - 1].posicao : i + 1 });
    });
    return resultado;
}

// Ranking dos alunos (admin não entra). periodo: "geral" (desde sempre) ou "semana" (últimos 7 dias).
// Volta o top 10 e a linha de quem pediu (mesmo que esteja fora do top 10).
export async function rankingDosAlunos(periodo, usuarioId) {
    const desde = periodo === 'semana' ? new Date(Date.now() - SETE_DIAS) : null;

    const [alunos, conteudos, acertos] = await Promise.all([
        prisma.usuario.findMany({ where: { admin: false }, select: { usuarioId: true, nome: true } }),
        prisma.usuarioconteudo.groupBy({
            by: ['usuarioId'],
            where: { concluido: true, ...(desde && { concluidoEm: { gte: desde } }) },
            _count: { _all: true }
        }),
        prisma.usuarioquestao.groupBy({
            by: ['usuarioId'],
            where: { correta: true, ...(desde && { respondidaEm: { gte: desde } }) },
            _count: { _all: true }
        })
    ]);

    const conteudosPorAluno = new Map(conteudos.map((c) => [c.usuarioId, c._count._all]));
    const acertosPorAluno = new Map(acertos.map((a) => [a.usuarioId, a._count._all]));

    const classificados = classificar(alunos.map((aluno) => {
        const feitos = conteudosPorAluno.get(aluno.usuarioId) ?? 0;
        const certos = acertosPorAluno.get(aluno.usuarioId) ?? 0;
        return {
            usuarioId: aluno.usuarioId,
            nome: aluno.nome,
            conteudos: feitos,
            acertos: certos,
            pontos: feitos * PONTOS_POR_CONTEUDO + certos * PONTOS_POR_ACERTO
        };
    }));

    // O id e o nome completo não saem daqui: só o nome curto e se a linha é de quem pediu
    const publico = (a) => ({
        posicao: a.posicao,
        nome: nomeCurto(a.nome),
        pontos: a.pontos,
        conteudos: a.conteudos,
        acertos: a.acertos,
        voce: a.usuarioId === usuarioId
    });

    const minhaLinha = classificados.find((a) => a.usuarioId === usuarioId);

    return {
        periodo,
        participantes: classificados.length,
        top: classificados.slice(0, TAMANHO_DO_RANKING).map(publico),
        // null = quem pediu ainda não tem pontos no período (ou é admin)
        eu: minhaLinha ? publico(minhaLinha) : null
    };
}
