// Busca de mapas: procura no nome do mapa e nos títulos dos conteúdos dele.
// Ignora maiúsculas e acentos ("funcao" acha "Função"). Todas as palavras precisam aparecer.
export const normalizar = (texto = "") =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function buscarMapas(mapas, termo) {
    const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
    if (palavras.length === 0) return [];

    const contem = (texto) => palavras.every((p) => normalizar(texto).includes(p));

    return mapas
        .map((mapa) => {
            const titulos = mapa.conteudos ?? [];
            const noNome = contem(mapa.nome);
            // Conteúdos que batem com a busca (mostrados no resultado, pra explicar por que o mapa apareceu)
            const conteudos = titulos.filter(contem);
            // Também vale se as palavras estão espalhadas entre o nome e os conteúdos
            const noConjunto = contem([mapa.nome, ...titulos].join(" "));
            if (!noNome && conteudos.length === 0 && !noConjunto) return null;
            return { mapa, noNome, conteudos };
        })
        .filter(Boolean)
        // Quem bate no nome vem primeiro
        .sort((a, b) => Number(b.noNome) - Number(a.noNome));
}
