// conteudoId: precisa bater com o conteudoId da tabela conteudo no banco.
// tipo: 1 = botão expansível (abre modal de explicação), 2 = indicador informativo (sem interação), 3 = botão direcional (link externo/simulação).
// row/col NÃO ficam aqui: mudam a cada sorteio de "design" (ver layouts.js), então são calculados na hora, não guardados fixos por conteúdo.
const conteudos = [
    {
        conteudoId: 1,
        titulo: "Fundamentos",
        explicacao: "Probabilidade é basicamente medir a chance de algo acontecer.",
        tipo: 1,
    },
    {
        conteudoId: 2,
        titulo: "Regras e Relações",
        explicacao: "Fórmula Básica: P = F/p\nSoma: P(a∪b) = P(a) + P(b) - P(a∩b)\nProduto: P(a∩b) = P(a) · P(b)",
        tipo: 1,
    },
    {
        conteudoId: 3,
        titulo: "Contagem",
        explicacao: "",
        tipo: 1,
    },
    {
        conteudoId: 4,
        titulo: "Aplicações",
        explicacao: "",
        tipo: 1,
    },
    {
        conteudoId: 5,
        titulo: "Simulação",
        explicacao: "",
        tipo: 1,
    },
];

export default conteudos;
