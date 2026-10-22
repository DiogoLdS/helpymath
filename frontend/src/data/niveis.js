// Dificuldades dos mapas conceituais. "chave" é o que fica salvo no banco (mapaconceitual.nivel)
// e tem que bater com a lista NIVEIS do backend (mapaConceitualController.js).
const niveis = [
    { chave: "basico", titulo: "BÁSICO", nome: "Básico", descricao: "Fundamentos e equações simples" },
    { chave: "intermediario", titulo: "INTERMEDIÁRIO", nome: "Intermediário", descricao: "Álgebra e funções" },
    { chave: "avancado", titulo: "AVANÇADO", nome: "Avançado", descricao: "Análise e aplicações complexas" },
    { chave: "treino", titulo: "TREINO", nome: "Treino", descricao: "SIMULADOS E QUESTÕES" },
];

export default niveis;
