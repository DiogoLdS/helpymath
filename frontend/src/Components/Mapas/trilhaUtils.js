// Contas da trilha de mapas e as recomendações do assistente "Helpy".
// Tudo aqui sai dos dados que o backend manda em GET /mapas: { liberado, concluido, progresso }.
// (Fora dos .jsx porque arquivo de componente só deve exportar componentes.)

// Precisa bater com NOTA_MINIMA do backend (services/progresso.js)
export const NOTA_MINIMA = 0.6;

// Quantas questões o aluno precisa acertar pra concluir o mapa (60% arredondado pra cima)
export function acertosNecessarios(total) {
    return Math.ceil(total * NOTA_MINIMA);
}

// Quanto do mapa o aluno já fez, de 0 a 100: metade são os conteúdos, metade é chegar na meta das questões.
// Se o mapa não tem conteúdos (ou questões), a outra parte vale o mapa inteiro.
export function porcentagemDoMapa(mapa) {
    if (mapa.concluido) return 100;
    const p = mapa.progresso;
    if (!p) return 0;

    const parteConteudos = p.conteudosTotal > 0 ? p.conteudosFeitos / p.conteudosTotal : null;
    const parteQuestoes = p.questoesTotal > 0
        ? Math.min(p.questoesAcertos / acertosNecessarios(p.questoesTotal), 1)
        : null;

    const partes = [parteConteudos, parteQuestoes].filter((parte) => parte !== null);
    if (partes.length === 0) return 0;

    return Math.round((partes.reduce((soma, parte) => soma + parte, 0) / partes.length) * 100);
}

// O mapa "da vez" de um nível: o primeiro liberado que ainda não foi concluído (ou null se acabou o nível)
export function mapaAtual(mapasDoNivel) {
    return mapasDoNivel.find((m) => m.liberado && !m.concluido) ?? null;
}

// "Bom dia", "Boa tarde" ou "Boa noite", pelo horário do computador do aluno
export function saudacao(agora = new Date()) {
    const hora = agora.getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
}

// Frases do assistente: lista de pedaços, os com "destaque" aparecem em negrito (nomes de mapas e números)
const frase = (...pedacos) => pedacos.map((p) => (typeof p === "string" ? { texto: p } : p));
const destaque = (texto) => ({ texto, destaque: true });

// O que o assistente recomenda agora. Analisa o nível em foco (o filtro da página, ou o primeiro nível
// que ainda tem mapa pra fazer) e devolve { mensagem, acao, revisoes, estatisticas }.
// acao = { rotulo, para } é o botão principal; revisoes são mapas concluídos com questões erradas (RF010 do TCC).
export function recomendacao(mapas, niveis, nivelFoco) {
    const estatisticas = {
        mapasConcluidos: mapas.filter((m) => m.concluido).length,
        mapasTotal: mapas.length,
        acertos: mapas.reduce((soma, m) => soma + (m.progresso?.questoesAcertos ?? 0), 0),
        respondidas: mapas.reduce((soma, m) => soma + (m.progresso?.questoesRespondidas ?? 0), 0),
    };

    // Mapas já concluídos, mas com questões erradas: bons candidatos pra revisão
    const revisoes = mapas
        .filter((m) => m.concluido && m.progresso && m.progresso.questoesAcertos < m.progresso.questoesTotal)
        .slice(0, 2)
        .map((m) => ({
            mapa: m,
            erradas: m.progresso.questoesTotal - m.progresso.questoesAcertos,
        }));

    if (mapas.length === 0) {
        return {
            mensagem: frase("Ainda não há mapas cadastrados. Assim que aparecerem, eu monto sua trilha de estudos por aqui."),
            acao: null,
            revisoes,
            estatisticas,
        };
    }

    const doNivel = (chave) => mapas.filter((m) => m.nivel === chave);
    const nomeDoNivel = (chave) => niveis.find((n) => n.chave === chave)?.nome ?? chave;

    // Nível em foco: o escolhido no filtro, ou o primeiro (na ordem dos níveis) que ainda tem mapa pra fazer
    const focoChave = nivelFoco
        ?? niveis.find((n) => mapaAtual(doNivel(n.chave)))?.chave
        ?? null;

    if (!focoChave) {
        return {
            mensagem: frase("Você concluiu ", destaque("todos os mapas"), " da plataforma. Parabéns! Que tal revisar os que tiveram questões erradas?"),
            acao: null,
            revisoes,
            estatisticas,
        };
    }

    const atual = mapaAtual(doNivel(focoChave));

    // Nível em foco terminado: sugere o próximo nível que ainda tem mapa
    if (!atual) {
        const proximoNivel = niveis.find((n) => n.chave !== focoChave && mapaAtual(doNivel(n.chave)));
        return {
            mensagem: doNivel(focoChave).length === 0
                ? frase("O nível ", destaque(nomeDoNivel(focoChave)), " ainda não tem mapas.",
                    proximoNivel ? " Enquanto isso, que tal seguir em outro nível?" : "")
                : frase("Você concluiu o nível ", destaque(nomeDoNivel(focoChave)), " inteiro! Mandou bem.",
                    proximoNivel ? ` Pronto para o ${proximoNivel.nome}?` : ""),
            acao: proximoNivel
                ? { rotulo: `Ir para ${proximoNivel.nome}`, para: `/mapas?nivel=${proximoNivel.chave}` }
                : null,
            revisoes,
            estatisticas,
        };
    }

    const p = atual.progresso ?? { conteudosFeitos: 0, conteudosTotal: 0, questoesRespondidas: 0, questoesAcertos: 0, questoesTotal: 0 };
    const faltamConteudos = p.conteudosTotal - p.conteudosFeitos;
    const proximoDoNivel = doNivel(focoChave)[doNivel(focoChave).indexOf(atual) + 1];
    const liberaTexto = proximoDoNivel ? ` e liberar ${proximoDoNivel.nome}` : "";
    const irAoMapa = (rotulo) => ({ rotulo, para: `/mapas/${atual.mapaId}` });
    const irAsQuestoes = { rotulo: "Fazer as questões", para: `/mapas/${atual.mapaId}/questoes` };

    let mensagem;
    let acao;

    if (faltamConteudos > 0 && p.conteudosFeitos === 0 && p.questoesRespondidas === 0) {
        // Ainda não começou o mapa da vez
        mensagem = frase(
            "Seu próximo passo é ", destaque(atual.nome), ". ",
            p.conteudosTotal === 1 ? "É 1 conteúdo" : `São ${p.conteudosTotal} conteúdos`,
            p.questoesTotal > 0 ? ` e ${p.questoesTotal} ${p.questoesTotal === 1 ? "questão" : "questões"}` : "",
            ": dá pra fazer em poucos minutos."
        );
        acao = irAoMapa(`Começar ${atual.nome}`);
    } else if (faltamConteudos > 0) {
        // Parou no meio dos conteúdos
        mensagem = frase(
            "Você parou no meio de ", destaque(atual.nome), ": ",
            destaque(faltamConteudos === 1 ? "falta 1 conteúdo" : `faltam ${faltamConteudos} conteúdos`),
            ". Bora terminar?"
        );
        acao = irAoMapa(`Continuar ${atual.nome}`);
    } else if (p.questoesRespondidas === 0) {
        // Viu tudo, falta começar as questões
        mensagem = frase(
            "Você já estudou todo o conteúdo de ", destaque(atual.nome), ". Agora é hora das questões: acerte ",
            destaque(`${Math.round(NOTA_MINIMA * 100)}%`), ` para concluir o mapa${liberaTexto}.`
        );
        acao = irAsQuestoes;
    } else {
        // Já respondeu, mas ainda não bateu a meta
        const faltamAcertos = Math.max(acertosNecessarios(p.questoesTotal) - p.questoesAcertos, 0);
        mensagem = frase(
            "Em ", destaque(atual.nome), " você acertou ", destaque(`${p.questoesAcertos} de ${p.questoesTotal}`), ". ",
            faltamAcertos > 0
                ? `${faltamAcertos === 1 ? "Falta 1 acerto" : `Faltam ${faltamAcertos} acertos`} para concluir o mapa${liberaTexto}. Refaça as que você errou.`
                : "Responda as que faltam para concluir o mapa."
        );
        acao = { ...irAsQuestoes, rotulo: "Voltar às questões" };
    }

    return { mensagem, acao, revisoes, estatisticas };
}
