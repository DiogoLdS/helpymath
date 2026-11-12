// Quando uma questão volta a poder ser refeita, em texto de gente: "hoje às 14:30", "amanhã às 09:05"
// (quem viu a resolução depois de errar espera 24 horas; a regra fica no backend, services/resolucao.js)
export function quandoLibera(data, agora = new Date()) {
    const dia = new Date(data);
    const hora = dia.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const mesmoDia = (a, b) => a.toDateString() === b.toDateString();

    if (mesmoDia(dia, agora)) return `hoje às ${hora}`;

    const amanha = new Date(agora);
    amanha.setDate(agora.getDate() + 1);
    if (mesmoDia(dia, amanha)) return `amanhã às ${hora}`;

    return `em ${dia.toLocaleDateString("pt-BR")} às ${hora}`;
}
