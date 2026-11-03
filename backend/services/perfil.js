import prisma from './adapter.js';
import { situacaoDosMapas, TIPO_INTERATIVO } from './progresso.js';

// Valores aceitos na edição do perfil
export const OBJETIVOS = ['escola', 'enem', 'concursos'];
export const DIAS_DA_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

// Campos do usuário que o perfil mostra (nunca a senha)
export const CAMPOS_PERFIL = {
    usuarioId: true,
    nome: true,
    email: true,
    admin: true,
    criadoEm: true,
    objetivo: true,
    metaSemanal: true,
    anotacoes: true,
    cronograma: true
};

// Tudo o que a página de perfil precisa, numa consulta só (Figura 4.3.2, CU07 e CU08 do TCC).
// As contas que dependem do dia (sequência, semana) ficam no navegador, no fuso horário do aluno.
export async function dadosDoPerfil(usuarioId, admin) {
    const usuario = await prisma.usuario.findUnique({ where: { usuarioId }, select: CAMPOS_PERFIL });
    if (!usuario) return null;

    // Cada mapa com liberado/concluido/progresso (a mesma situação da trilha)
    const mapas = await situacaoDosMapas(usuarioId, admin);

    // Conteúdos concluídos, do mais recente pro mais antigo, com o(s) mapa(s) de cada um
    const concluidos = await prisma.usuarioconteudo.findMany({
        where: { usuarioId, concluido: true },
        orderBy: { concluidoEm: { sort: 'desc', nulls: 'last' } },
        select: {
            conteudoId: true,
            concluidoEm: true,
            conteudo: {
                select: {
                    titulo: true,
                    mapaconteudo: { select: { mapaconceitual: { select: { mapaId: true, nome: true } } } }
                }
            }
        }
    });

    const conteudosConcluidos = concluidos.map((c) => ({
        conteudoId: c.conteudoId,
        titulo: c.conteudo.titulo,
        concluidoEm: c.concluidoEm,
        mapas: c.conteudo.mapaconteudo.map((mc) => mc.mapaconceitual)
    }));

    // Pendentes: conteúdos interativos dos mapas que o aluno já pode fazer e ainda não concluiu
    const idsConcluidos = new Set(conteudosConcluidos.map((c) => c.conteudoId));
    const mapasEmAndamento = mapas.filter((m) => m.liberado && !m.concluido).map((m) => m.mapaId);

    const vinculos = await prisma.mapaconteudo.findMany({
        where: { mapaId: { in: mapasEmAndamento }, conteudo: { tipo: TIPO_INTERATIVO } },
        orderBy: [{ mapaId: 'asc' }, { conteudoId: 'asc' }],
        select: {
            conteudoId: true,
            conteudo: { select: { titulo: true } },
            mapaconceitual: { select: { mapaId: true, nome: true } }
        }
    });

    const conteudosPendentes = vinculos
        .filter((v) => !idsConcluidos.has(v.conteudoId))
        .map((v) => ({ conteudoId: v.conteudoId, titulo: v.conteudo.titulo, mapa: v.mapaconceitual }));

    // Respostas às questões (última tentativa de cada uma), da mais recente pra mais antiga
    const respostasBanco = await prisma.usuarioquestao.findMany({
        where: { usuarioId },
        orderBy: { respondidaEm: 'desc' },
        take: 200,
        select: {
            questaoId: true,
            correta: true,
            respondidaEm: true,
            questao: { select: { enunciado: true, mapaconceitual: { select: { mapaId: true, nome: true } } } }
        }
    });

    const respostas = respostasBanco.map((r) => ({
        questaoId: r.questaoId,
        correta: r.correta,
        respondidaEm: r.respondidaEm,
        enunciado: r.questao.enunciado,
        mapa: r.questao.mapaconceitual
    }));

    return { usuario, mapas, conteudosConcluidos, conteudosPendentes, respostas };
}

// Confere e limpa o que o aluno mandou pra editar no perfil.
// Devolve { dados } pronto pro prisma.usuario.update, ou { erro } com a mensagem.
export function validarEdicaoPerfil(corpo) {
    const dados = {};

    if (corpo.nome !== undefined) {
        const nome = String(corpo.nome).trim();
        if (nome.length < 2 || nome.length > 80) return { erro: "O nome precisa ter entre 2 e 80 caracteres" };
        dados.nome = nome;
    }

    if (corpo.objetivo !== undefined) {
        if (corpo.objetivo !== null && !OBJETIVOS.includes(corpo.objetivo)) return { erro: "Objetivo inválido" };
        dados.objetivo = corpo.objetivo;
    }

    if (corpo.metaSemanal !== undefined) {
        const meta = Number(corpo.metaSemanal);
        if (!Number.isInteger(meta) || meta < 1 || meta > 50) return { erro: "A meta precisa ser entre 1 e 50 conteúdos por semana" };
        dados.metaSemanal = meta;
    }

    if (corpo.anotacoes !== undefined) {
        const anotacoes = String(corpo.anotacoes ?? '');
        if (anotacoes.length > 5000) return { erro: "As anotações podem ter no máximo 5000 caracteres" };
        dados.anotacoes = anotacoes;
    }

    if (corpo.cronograma !== undefined) {
        if (typeof corpo.cronograma !== 'object' || corpo.cronograma === null || Array.isArray(corpo.cronograma)) {
            return { erro: "Cronograma inválido" };
        }
        // Só os 7 dias, cada um com um texto curto
        const cronograma = {};
        for (const dia of DIAS_DA_SEMANA) {
            const texto = String(corpo.cronograma[dia] ?? '').trim();
            if (texto.length > 80) return { erro: "Cada dia do cronograma pode ter no máximo 80 caracteres" };
            cronograma[dia] = texto;
        }
        dados.cronograma = cronograma;
    }

    return { dados };
}
