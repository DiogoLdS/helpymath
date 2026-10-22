// Funções de apoio da mídia (ficam fora do Midia.jsx porque arquivo de componente só deve exportar componentes)

// Só aceita links http/https (evita coisas como "javascript:" no src)
export const linkValido = (url) => /^https?:\/\/\S+$/i.test(url.trim());

// Pega o id do vídeo nos formatos comuns de link do YouTube
export function idVideoYoutube(url) {
    const resultado = url.trim().match(
        /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
    );
    return resultado ? resultado[1] : null;
}

// Monta o trecho que vai pro texto da explicação
export function montarMarcacaoMidia(tipo, url, descricao = "") {
    if (tipo === "imagem") {
        // "|" e "]" quebrariam a marcação, então saem da descrição
        const descricaoLimpa = descricao.replace(/[|\]\n]/g, " ").trim();
        return `\n[[imagem:${url.trim()}|${descricaoLimpa}]]\n`;
    }
    return `\n[[video:${url.trim()}]]\n`;
}
