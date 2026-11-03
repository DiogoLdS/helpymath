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
}
