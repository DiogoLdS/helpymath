import { normalizar } from "../Components/Mapas/buscaUtils.js";

// Simulações interativas do próprio HelpyMath (RF011 / CU05 do TCC).
// O admin pode usar o "caminho" como destino de um botão direcional (tipo 3) no mapa conceitual.
// "palavras": se o nome de um mapa tiver uma delas, a simulação é sugerida junto com esse mapa
// nas recomendações do perfil (CU08). Escritas sem acento e em minúsculas.
const simulacoes = [
    {
        caminho: "/simulacoes/funcao-afim",
        nome: "Função afim",
        assunto: "Funções",
        descricao: "Mexa nos coeficientes a e b e veja a reta mudar na hora: inclinação, onde corta o eixo y e a raiz.",
        palavras: ["afim", "funcao do 1", "funcao de 1", "primeiro grau", "1o grau", "reta"],
    },
    {
        caminho: "/simulacoes/dados",
        nome: "Probabilidade com dados",
        assunto: "Probabilidade",
        descricao: "Lance um ou dois dados muitas vezes e compare o que aconteceu com a probabilidade calculada.",
        palavras: ["probabilidade", "chance", "dados", "estatistica"],
    },
];

// A simulação que combina com o nome do mapa (ou null)
export function simulacaoDoMapa(nomeDoMapa, lista = simulacoes) {
    const nome = normalizar(nomeDoMapa);
    return lista.find((sim) => sim.palavras.some((p) => nome.includes(p))) ?? null;
}

export default simulacoes;
