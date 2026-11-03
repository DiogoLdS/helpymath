import prisma from './adapter.js';

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

// Dados do painel do administrador (página inicial de quem é admin):
// números gerais, mapas com o que têm e como os alunos vão neles, questões com problema e usuários.
export async function dadosDoPainelAdmin() {
    const desde = new Date(Date.now() - SETE_DIAS);

    const [usuarios, mapas, totalConteudos, totalQuestoes, respostas, semCorreta, conteudosNaSemana, respostasNaSemana] = await Promise.all([
        prisma.usuario.findMany({
            orderBy: { criadoEm: 'desc' },
            select: {
                usuarioId: true,
                nome: true,
                email: true,
                admin: true,
                criadoEm: true,
                _count: {
                    select: {
                        usuarioconteudo: { where: { concluido: true } },
                        usuarioquestao: true
                    }
                }
            }
        }),
        prisma.mapaconceitual.findMany({
            orderBy: { mapaId: 'asc' },
            select: {
                mapaId: true,
                nome: true,
                nivel: true,
                _count: { select: { mapaconteudo: true, questao: true } }
            }
        }),
        prisma.conteudo.count(),
        prisma.questao.count(),
        // Respostas dos alunos (última tentativa de cada um), pra taxa de acerto de cada mapa
        prisma.usuarioquestao.findMany({ select: { correta: true, questao: { select: { mapaId: true } } } }),
        // Questão sem nenhuma alternativa marcada como correta: ninguém consegue acertar
        prisma.questao.findMany({
            where: { alternativa: { none: { correta: true } } },
            select: { questaoId: true, enunciado: true, mapaId: true }
        }),
        prisma.usuarioconteudo.count({ where: { concluido: true, concluidoEm: { gte: desde } } }),
        prisma.usuarioquestao.count({ where: { respondidaEm: { gte: desde } } })
    ]);

    // Respostas e acertos por mapa
    const porMapa = new Map();
    for (const r of respostas) {
        const atual = porMapa.get(r.questao.mapaId) ?? { respostas: 0, acertos: 0 };
        atual.respostas += 1;
        if (r.correta) atual.acertos += 1;
        porMapa.set(r.questao.mapaId, atual);
    }

    return {
        totais: {
            alunos: usuarios.filter((u) => !u.admin).length,
            admins: usuarios.filter((u) => u.admin).length,
            mapas: mapas.length,
            conteudos: totalConteudos,
            questoes: totalQuestoes
        },
        semana: { conteudosConcluidos: conteudosNaSemana, questoesRespondidas: respostasNaSemana },
        mapas: mapas.map((m) => ({
            mapaId: m.mapaId,
            nome: m.nome,
            nivel: m.nivel,
            conteudos: m._count.mapaconteudo,
            questoes: m._count.questao,
            respostas: porMapa.get(m.mapaId)?.respostas ?? 0,
            acertos: porMapa.get(m.mapaId)?.acertos ?? 0
        })),
        questoesSemCorreta: semCorreta,
        usuarios: usuarios.map((u) => ({
            usuarioId: u.usuarioId,
            nome: u.nome,
            email: u.email,
            admin: u.admin,
            criadoEm: u.criadoEm,
            conteudosConcluidos: u._count.usuarioconteudo,
            questoesRespondidas: u._count.usuarioquestao
        }))
    };
}
