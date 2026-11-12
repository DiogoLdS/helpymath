// Períodos do ranking (o backend aceita ?periodo=semana ou ?periodo=geral)
export const PERIODOS = [
    { chave: "semana", nome: "Esta semana", descricao: "Pontos dos últimos 7 dias" },
    { chave: "geral", nome: "Geral", descricao: "Todos os pontos desde o início" },
];

// Os três primeiros ganham medalha no lugar do número
export const MEDALHAS = { 1: "🥇", 2: "🥈", 3: "🥉" };
