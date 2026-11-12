import { decodificarToken } from "../../utils/auth.js";

// Lembra (no navegador) quais mapas o aluno já viu liberados, pra comemorar só os desbloqueios novos.
// Fica por usuário: duas contas no mesmo computador não se misturam.
const chave = () => {
    const usuario = decodificarToken(localStorage.getItem("token") ?? "");
    return usuario ? `helpymath:mapasLiberados:${usuario.usuarioId}` : null;
};

function lerVistos() {
    try {
        const salvo = chave() && localStorage.getItem(chave());
        return salvo ? new Set(JSON.parse(salvo)) : null;
    } catch {
        return null;
    }
}

function salvarVistos(ids) {
    try {
        if (chave()) localStorage.setItem(chave(), JSON.stringify([...ids]));
    } catch {
        // Sem localStorage (aba anônima bloqueada etc.): só não comemora
    }
}

// Marca mapas como já vistos (ex: a página de questões já comemorou o próximo mapa)
export function marcarComoVistos(mapaIds) {
    const vistos = lerVistos() ?? new Set();
    mapaIds.forEach((id) => vistos.add(id));
    salvarVistos(vistos);
}

// Mapas liberados que o aluno ainda não tinha visto liberados.
// Na primeira visita só guarda a lista (senão comemoraria tudo o que já estava aberto).
// Mapa que abre sem precisar de outro antes (primeiro do nível) não conta como desbloqueio.
export function desbloqueiosNovos(mapas) {
    const liberados = mapas.filter((m) => m.liberado).map((m) => m.mapaId);
    const vistos = lerVistos();
    salvarVistos(new Set([...(vistos ?? []), ...liberados]));
    if (!vistos) return [];
    return mapas.filter((m) => m.liberado && m.anterior && !vistos.has(m.mapaId));
}
