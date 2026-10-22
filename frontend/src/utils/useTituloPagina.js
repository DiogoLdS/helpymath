import { useEffect } from "react";

// Muda o título da aba do navegador pra "Página | HelpyMath" (ou só "HelpyMath" sem título)
export default function useTituloPagina(titulo) {
    useEffect(() => {
        document.title = titulo ? `${titulo} | HelpyMath` : "HelpyMath";
    }, [titulo]);
}
