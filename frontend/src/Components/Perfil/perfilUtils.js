// Contas da página de perfil, feitas no navegador (no fuso horário do aluno) a partir do GET /perfil.
// (Fora dos .jsx porque arquivo de componente só deve exportar componentes.)

// Objetivo de estudo (perguntado nas boas-vindas). Cada um muda o plano do aluno:
// a meta sugerida da semana, se o Treino (simulados) entra no plano e a dica da página inicial.
export const OBJETIVOS = [
    {
        chave: "escola",
        nome: "Escola regular",
        descricao: "Acompanhar e reforçar a matéria das aulas.",
        metaSugerida: 3,
        treino: false,
        dica: "Estude um pouco depois das aulas: siga os mapas do seu nível na ordem, sem pressa.",
    },
    {
        chave: "enem",
        nome: "ENEM",
        descricao: "Revisar o ensino médio e treinar questões no estilo da prova.",
        metaSugerida: 5,
        treino: true,
        dica: "Durante a semana, avance nos mapas do seu nível; no fim de semana, faça o Treino com simulados.",
    },
    {
        chave: "concursos",
        nome: "Concursos públicos",
        descricao: "Matemática e raciocínio cobrados em provas de concurso.",
        metaSugerida: 7,
        treino: true,
        dica: "Concurso cobra muito o básico bem feito: revise os fundamentos e faça o Treino toda semana.",
    },
];

export const objetivoDe = (chave) => OBJETIVOS.find((o) => o.chave === chave) ?? null;

// Mesma ordem e chaves do backend (services/perfil.js): a semana começa na segunda
export const DIAS = [
    { chave: "seg", curto: "Seg", nome: "Segunda" },
    { chave: "ter", curto: "Ter", nome: "Terça" },
    { chave: "qua", curto: "Qua", nome: "Quarta" },
    { chave: "qui", curto: "Qui", nome: "Quinta" },
    { chave: "sex", curto: "Sex", nome: "Sexta" },
    { chave: "sab", curto: "Sáb", nome: "Sábado" },
    { chave: "dom", curto: "Dom", nome: "Domingo" },
];

const UM_DIA = 24 * 60 * 60 * 1000;

export function inicioDoDia(data) {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Segunda-feira da semana da data (00:00)
export function inicioDaSemana(data = new Date()) {
    const d = inicioDoDia(data);
    const diaDaSemana = d.getDay(); // 0 = domingo
    d.setDate(d.getDate() - (diaDaSemana === 0 ? 6 : diaDaSemana - 1));
    return d;
}

// Chave do dia ("seg"...) de uma data
export function chaveDoDia(data) {
    return DIAS[(new Date(data).getDay() + 6) % 7].chave;
}

export function formatarData(data, comHora = false) {
    if (!data) return "–";
    return new Date(data).toLocaleDateString("pt-BR", comHora
        ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Tudo o que o aluno fez, numa lista só e com data: conteúdos concluídos e questões respondidas
export function atividades(perfil) {
    const conteudos = perfil.conteudosConcluidos
        .filter((c) => c.concluidoEm)
        .map((c) => ({ tipo: "conteudo", data: new Date(c.concluidoEm), titulo: c.titulo, mapa: c.mapas[0] ?? null }));

    const questoes = perfil.respostas.map((r) => ({
        tipo: "questao", data: new Date(r.respondidaEm), titulo: r.enunciado, mapa: r.mapa, correta: r.correta,
    }));

    return [...conteudos, ...questoes].sort((a, b) => b.data - a.data);
}

// Atividades de cada dia da semana atual e quantos conteúdos foram concluídos nela (meta da semana)
export function resumoDaSemana(lista, agora = new Date()) {
    const inicio = inicioDaSemana(agora);
    const fim = new Date(inicio.getTime() + 7 * UM_DIA);
    const daSemana = lista.filter((a) => a.data >= inicio && a.data < fim);

    const porDia = Object.fromEntries(DIAS.map((d) => [d.chave, 0]));
    for (const a of daSemana) porDia[chaveDoDia(a.data)] += 1;

    return {
        inicio,
        porDia,
        conteudosNaSemana: daSemana.filter((a) => a.tipo === "conteudo").length,
    };
}

// Dias seguidos estudando, contando até hoje. Se ainda não estudou hoje, a sequência
// de ontem continua valendo (só "quebra" se passar um dia inteiro sem estudar).
export function sequenciaDeDias(lista, agora = new Date()) {
    const dias = new Set(lista.map((a) => inicioDoDia(a.data).getTime()));
    let dia = inicioDoDia(agora).getTime();
    if (!dias.has(dia)) dia -= UM_DIA;

    let sequencia = 0;
    while (dias.has(dia)) {
        sequencia += 1;
        dia -= UM_DIA;
    }
    return sequencia;
}

export function estatisticas(perfil, lista) {
    const acertos = perfil.respostas.filter((r) => r.correta).length;
    return {
        mapasConcluidos: perfil.mapas.filter((m) => m.concluido).length,
        mapasTotal: perfil.mapas.length,
        conteudosConcluidos: perfil.conteudosConcluidos.length,
        questoesRespondidas: perfil.respostas.length,
        acertos,
        taxaAcerto: perfil.respostas.length > 0 ? Math.round((acertos / perfil.respostas.length) * 100) : null,
        sequencia: sequenciaDeDias(lista),
    };
}

// Desempenho nas questões de cada mapa que o aluno já respondeu (CU07)
export function desempenhoPorMapa(mapas) {
    return mapas
        .filter((m) => m.progresso && m.progresso.questoesRespondidas > 0)
        .map((m) => ({
            mapa: m,
            acertos: m.progresso.questoesAcertos,
            total: m.progresso.questoesTotal,
            porcentagem: Math.round((m.progresso.questoesAcertos / m.progresso.questoesTotal) * 100),
        }));
}

// Recomendações (CU08 do TCC): primeiro os mapas com pior desempenho nas questões,
// depois os mapas que o aluno pode continuar agora. Vira um carrossel na página.
export function recomendacoes(mapas) {
    const fracos = desempenhoPorMapa(mapas)
        .filter((d) => d.porcentagem < 100)
        .sort((a, b) => a.porcentagem - b.porcentagem)
        .map((d) => ({
            mapa: d.mapa,
            tipo: "revisar",
            motivo: `Você acertou ${d.acertos} de ${d.total} questões (${d.porcentagem}%)`,
            acao: "Revisar questões",
            para: `/mapas/${d.mapa.mapaId}/questoes`,
        }));

    const emAndamento = mapas
        .filter((m) => m.liberado && !m.concluido && !fracos.some((f) => f.mapa.mapaId === m.mapaId))
        .map((m) => {
            const p = m.progresso;
            const comecou = p && (p.conteudosFeitos > 0 || p.questoesRespondidas > 0);
            return {
                mapa: m,
                tipo: comecou ? "continuar" : "comecar",
                motivo: comecou
                    ? `${p.conteudosFeitos} de ${p.conteudosTotal} conteúdos concluídos`
                    : "Próximo mapa da sua trilha",
                acao: comecou ? "Continuar" : "Começar",
                para: `/mapas/${m.mapaId}`,
            };
        });

    return [...fracos, ...emAndamento].slice(0, 8);
}

// Conquistas (RF017 do TCC): calculadas a partir do que o aluno já fez
export function conquistas(perfil, stats, metaBatida) {
    const niveisCompletos = [...new Set(perfil.mapas.map((m) => m.nivel))]
        .filter((nivel) => perfil.mapas.filter((m) => m.nivel === nivel).every((m) => m.concluido)).length;
    const mapaPerfeito = perfil.mapas.some((m) => m.concluido && m.progresso
        && m.progresso.questoesTotal >= 3 && m.progresso.questoesAcertos === m.progresso.questoesTotal);

    const lista = [
        { id: "primeiro-passo", simbolo: "1", titulo: "Primeiro passo", descricao: "Conclua seu primeiro conteúdo", atual: stats.conteudosConcluidos, alvo: 1 },
        { id: "estudioso", simbolo: "10", titulo: "Estudioso", descricao: "Conclua 10 conteúdos", atual: stats.conteudosConcluidos, alvo: 10 },
        { id: "primeira-questao", simbolo: "?", titulo: "Mão na massa", descricao: "Responda sua primeira questão", atual: stats.questoesRespondidas, alvo: 1 },
        { id: "na-mosca", simbolo: "✓", titulo: "Na mosca", descricao: "Acerte 10 questões", atual: stats.acertos, alvo: 10 },
        { id: "mapa-concluido", simbolo: "π", titulo: "Primeiro mapa", descricao: "Conclua um mapa conceitual", atual: stats.mapasConcluidos, alvo: 1 },
        { id: "colecionador", simbolo: "Σ", titulo: "Colecionador", descricao: "Conclua 5 mapas", atual: stats.mapasConcluidos, alvo: 5 },
        { id: "nivel-completo", simbolo: "√", titulo: "Nível completo", descricao: "Conclua todos os mapas de um nível", atual: niveisCompletos, alvo: 1 },
        { id: "perfeito", simbolo: "100", titulo: "Gabaritou", descricao: "Acerte 100% de um mapa (3+ questões)", atual: mapaPerfeito ? 1 : 0, alvo: 1 },
        { id: "constante", simbolo: "3d", titulo: "Constância", descricao: "Estude 3 dias seguidos", atual: stats.sequencia, alvo: 3 },
        { id: "semana", simbolo: "7d", titulo: "Semana cheia", descricao: "Estude 7 dias seguidos", atual: stats.sequencia, alvo: 7 },
        { id: "meta", simbolo: "≥", titulo: "Meta batida", descricao: "Cumpra sua meta da semana", atual: metaBatida ? 1 : 0, alvo: 1 },
    ];

    return lista.map((c) => ({ ...c, conquistada: c.atual >= c.alvo, atual: Math.min(c.atual, c.alvo) }));
}

// Iniciais do nome pro avatar ("Diogo Lima" -> "DL")
export function iniciais(nome) {
    const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    return ((partes[0][0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

// Pontos do aluno (mostrados na página inicial): 10 por conteúdo concluído e 5 por questão certa
export const PONTOS_POR_CONTEUDO = 10;
export const PONTOS_POR_ACERTO = 5;

export function pontos(stats) {
    return stats.conteudosConcluidos * PONTOS_POR_CONTEUDO + stats.acertos * PONTOS_POR_ACERTO;
}
