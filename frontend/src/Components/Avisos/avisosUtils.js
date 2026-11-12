import { atividades, inicioDoDia, resumoDaSemana, sequenciaDeDias } from "../Perfil/perfilUtils.js";

// Avisos do sino da barra lateral, montados com os dados do GET /perfil (nada novo no banco).
// Cada aviso: { id, icone, texto, link, tipo } — tipo "importante" ganha destaque.
export function avisosDoAluno(perfil, agora = new Date()) {
    const avisos = [];
    const lista = atividades(perfil);
    const semana = resumoDaSemana(lista, agora);
    const meta = perfil.usuario.metaSemanal ?? 5;

    // Sequência: estudou ontem mas ainda não hoje -> lembrete pra não perder
    const sequencia = sequenciaDeDias(lista, agora);
    const estudouHoje = lista.some((a) => inicioDoDia(a.data).getTime() === inicioDoDia(agora).getTime());
    if (sequencia > 0 && !estudouHoje) {
        avisos.push({
            id: "sequencia",
            icone: "🔥",
            texto: `Estude hoje para manter sua sequência de ${sequencia} ${sequencia === 1 ? "dia" : "dias"}.`,
            link: "/mapas",
            tipo: "importante",
        });
    }

    // Meta da semana
    if (semana.conteudosNaSemana >= meta) {
        avisos.push({ id: "meta", icone: "🎉", texto: `Meta da semana batida: ${semana.conteudosNaSemana} de ${meta} conteúdos!`, link: "/perfil" });
    } else {
        const faltam = meta - semana.conteudosNaSemana;
        avisos.push({
            id: "meta",
            icone: "🎯",
            texto: `Faltam ${faltam} ${faltam === 1 ? "conteúdo" : "conteúdos"} para a meta da semana.`,
            link: "/mapas",
        });
    }

    // Mapas liberados que o aluno ainda nem começou (ex: acabou de desbloquear)
    const novos = perfil.mapas.filter((m) => m.liberado && !m.concluido && m.progresso
        && m.progresso.conteudosFeitos === 0 && m.progresso.questoesRespondidas === 0);
    for (const mapa of novos.slice(0, 2)) {
        avisos.push({ id: `mapa-${mapa.mapaId}`, icone: "🔓", texto: `O mapa "${mapa.nome}" está liberado. Que tal começar?`, link: `/mapas/${mapa.mapaId}` });
    }

    // Questões erradas para refazer
    const erradas = perfil.respostas.filter((r) => !r.correta);
    if (erradas.length > 0) {
        const mapa = erradas[0].mapa;
        avisos.push({
            id: "revisar",
            icone: "✏️",
            texto: `${erradas.length} ${erradas.length === 1 ? "questão errada espera" : "questões erradas esperam"} uma nova tentativa.`,
            link: mapa ? `/mapas/${mapa.mapaId}/questoes` : "/mapas",
        });
    }

    // Conteúdos pendentes nos mapas em andamento
    if (perfil.conteudosPendentes.length > 0 && novos.length === 0) {
        const proximo = perfil.conteudosPendentes[0];
        avisos.push({
            id: "continuar",
            icone: "📘",
            texto: `Continue de onde parou: "${proximo.titulo}"${proximo.mapa ? ` (${proximo.mapa.nome})` : ""}.`,
            link: proximo.mapa ? `/mapas/${proximo.mapa.mapaId}` : "/mapas",
        });
    }

    return avisos;
}
