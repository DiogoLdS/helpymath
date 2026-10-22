// Botão direcional (tipo 3): o destino fica guardado no campo "explicacao" do conteúdo.
// Pode ser um site externo (https://...) ou uma página da própria plataforma (/simulacoes/...).
export function linkExterno(destino) {
    return /^https?:\/\/\S+$/i.test(destino.trim());
}

export function linkInterno(destino) {
    // "//site.com" levaria pra fora do site, então precisa ser "/" seguido de outra coisa
    return /^\/(?!\/)\S*$/.test(destino.trim());
}

export function linkDestinoValido(destino) {
    return linkExterno(destino) || linkInterno(destino);
}
