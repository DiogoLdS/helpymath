// "Lembrar de mim" do login.
// O token continua no localStorage (é de lá que todas as páginas leem). Quem NÃO marcou "Lembrar de mim"
// ganha uma marca no sessionStorage, que o navegador apaga quando é fechado: na próxima vez que o site
// abrir sem essa marca, o token é descartado e a pessoa precisa entrar de novo.
// (Uma aba nova também começa sem a marca, então quem não marcou precisa entrar de novo nela.)

export function iniciarSessao(token, lembrar) {
    localStorage.setItem("token", token);
    localStorage.setItem("lembrar", lembrar ? "1" : "0");
    sessionStorage.setItem("sessaoAtiva", "1");
}

// Chamada uma vez quando o site abre (main.jsx)
export function conferirSessao() {
    if (localStorage.getItem("lembrar") === "0" && !sessionStorage.getItem("sessaoAtiva")) {
        localStorage.removeItem("token");
        localStorage.removeItem("lembrar");
    }

    // Login vencido: apaga e abre direto a página de login, com o aviso (antes do React desenhar a tela)
    const token = localStorage.getItem("token");
    if (token && tokenVencido(token)) {
        encerrarSessaoVencida();
        if (window.location.pathname !== "/login") window.history.replaceState(null, "", "/login");
    }
}

// ---------- Sessão vencida ----------
// O login vale 7 dias (o backend assina o token com expiresIn: "7d"). Antes, o token vencido ficava
// guardado: o site achava que a pessoa estava logada e ela caía no login sem entender por quê.
// Agora o token vencido é apagado, a página de login mostra "Sua sessão expirou" e,
// se isso acontecer quando o site abre, a pessoa já vai direto pra lá.

const AVISO_EXPIROU = "sessaoExpirou";

// "exp" do token (em segundos) já passou?
export function tokenVencido(token, agora = Date.now()) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(base64));
        return typeof exp === "number" && exp * 1000 <= agora;
    } catch {
        return false; // token estranho: quem decide é o backend
    }
}

export function encerrarSessaoVencida() {
    localStorage.removeItem("token");
    localStorage.removeItem("lembrar");
    sessionStorage.setItem(AVISO_EXPIROU, "1");
}

// A página de login lê o aviso ao abrir e apaga logo depois, pra ele aparecer uma vez só
export const temAvisoDeSessaoVencida = () => sessionStorage.getItem(AVISO_EXPIROU) === "1";
export const apagarAvisoDeSessaoVencida = () => sessionStorage.removeItem(AVISO_EXPIROU);
