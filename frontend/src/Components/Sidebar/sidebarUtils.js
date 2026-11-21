// Qual ícone da barra corresponde à página aberta (é ele que ganha o fundo azul-claro)
export function itemDaPagina(caminho) {
    if (caminho.startsWith("/admin/mapas/criar")) return "criar";
    if (caminho.startsWith("/mapas") || caminho.startsWith("/admin/mapas")) return "mapas";
    if (caminho.startsWith("/simulacoes")) return "simulacoes";
    if (caminho.startsWith("/ranking")) return "ranking";
    if (caminho.startsWith("/perfil") || caminho.startsWith("/login") || caminho.startsWith("/register")) return "perfil";
    if (caminho.startsWith("/inicio") || caminho.startsWith("/revisar") || caminho.startsWith("/boas-vindas")) return "inicio";
    return null;
}
