// Lê o conteúdo (payload) do JWT guardado no navegador. Só serve pra decidir o que mostrar na tela:
// a segurança de verdade continua no backend (middlewares authUser e authAdmin).
export function decodificarToken(token) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function usuarioEhAdmin() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    return Boolean(decodificarToken(token)?.admin);
}
// Modo visitante: quem não entrou na conta pode ver os mapas e fazer as questões,
// mas sem perfil, sem assistente e sem salvar progresso.
export function ehVisitante() {
    return !localStorage.getItem("token");
}

// Cabeçalho de login pras chamadas à API: vazio pro visitante (o backend trata como visitante)
export function cabecalhoAuth() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
