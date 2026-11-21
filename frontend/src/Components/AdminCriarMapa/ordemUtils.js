// Contas do formulário de mapa sobre a trilha: em que posição o mapa entra no nível
// e quais mapas ele pode citar num botão direcional.
// "mapas" = lista do GET /mapas (já vem na ordem da trilha), "niveis" = data/niveis.js (na ordem dos níveis).

// Mapas do nível, na ordem da trilha, sem o próprio mapa (quando está editando)
export function mapasDoNivel(mapas, nivel, mapaId = null) {
    return mapas.filter((m) => (m.nivel ?? "basico") === nivel && m.mapaId !== mapaId);
}

// Mapas que vêm ANTES deste na trilha: os dos níveis de baixo e os que estão antes dele no mesmo nível.
// Só esses podem ser citados: o aluno já passou por eles (citar um mapa de depois mandaria o aluno
// pra algo que ele ainda não viu). posicao = lugar do mapa no nível (0 = primeiro).
export function mapasCitaveis(mapas, niveis, nivel, posicao, mapaId = null) {
    const degrau = (chave) => niveis.findIndex((n) => n.chave === (chave ?? "basico"));
    const meuDegrau = degrau(nivel);
    const antesNoNivel = mapasDoNivel(mapas, nivel, mapaId).slice(0, posicao);

    return mapas.filter((m) => m.mapaId !== mapaId && (degrau(m.nivel) < meuDegrau || antesNoNivel.includes(m)));
}

// Link do botão direcional que leva a um mapa, e o caminho inverso (null se não for link de mapa)
export const linkDoMapa = (mapaId) => `/mapas/${mapaId}`;

export function mapaDoLink(link) {
    const resultado = String(link ?? "").trim().match(/^\/mapas\/(\d+)\/?$/);
    return resultado ? Number(resultado[1]) : null;
}
