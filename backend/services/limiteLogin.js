// Limite de tentativas de login: depois de MAX_ERROS senhas erradas para o mesmo e-mail, vindas do
// mesmo endereço (IP), o login fica travado por JANELA_MS. Acertar a senha zera a contagem.
// Fica na memória do servidor (zera se ele reiniciar), o que basta pra barrar quem fica chutando senha.
export const MAX_ERROS = 5;
export const JANELA_MS = 15 * 60 * 1000;

const tentativas = new Map(); // chave -> { erros, desde }

const chaveDe = (ip, email) => `${ip}|${String(email ?? "").trim().toLowerCase()}`;

function registroValido(chave, agora) {
    const registro = tentativas.get(chave);
    if (registro && agora - registro.desde >= JANELA_MS) {
        tentativas.delete(chave);
        return null;
    }
    return registro ?? null;
}

// Minutos que faltam para poder tentar de novo (0 = pode tentar agora)
export function minutosBloqueado(ip, email, agora = Date.now()) {
    const registro = registroValido(chaveDe(ip, email), agora);
    if (!registro || registro.erros < MAX_ERROS) return 0;
    return Math.ceil((registro.desde + JANELA_MS - agora) / 60000);
}

export function registrarErro(ip, email, agora = Date.now()) {
    const chave = chaveDe(ip, email);
    const registro = registroValido(chave, agora) ?? { erros: 0, desde: agora };
    registro.erros += 1;
    tentativas.set(chave, registro);

    // Faxina de vez em quando, pra memória não crescer sem fim
    if (tentativas.size > 5000) {
        for (const k of tentativas.keys()) registroValido(k, agora);
    }
}

export function limparErros(ip, email) {
    tentativas.delete(chaveDe(ip, email));
}
