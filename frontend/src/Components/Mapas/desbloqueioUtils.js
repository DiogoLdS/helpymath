import { decodificarToken } from "../../utils/auth.js";

// Lembra (no navegador) quais mapas o aluno já viu liberados, pra animar o cadeado só nos desbloqueios novos.
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
        // Sem localStorage (aba anônima bloqueada etc.): só não anima
    }
}

// Mapas liberados que o aluno ainda não tinha visto liberados.
// Na primeira visita só guarda a lista (senão abriria o cadeado de tudo o que já estava aberto).
// Mapa que abre sem precisar de outro antes (primeiro do nível) não conta como desbloqueio,
// a não ser que o nível dele tenha acabado de abrir (o aluno concluiu o nível de baixo inteiro).
export function desbloqueiosNovos(mapas) {
    const liberados = mapas.filter((m) => m.liberado).map((m) => m.mapaId);
    const vistos = lerVistos();
    salvarVistos(new Set([...(vistos ?? []), ...liberados]));
    if (!vistos) return [];
    return mapas.filter((m) => m.liberado && (m.anterior || m.liberadoPorConclusao) && !vistos.has(m.mapaId));
}
