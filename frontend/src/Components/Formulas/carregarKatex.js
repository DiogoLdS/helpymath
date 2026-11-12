import { useSyncExternalStore } from "react";

// O KaTeX (que desenha as fórmulas) é a maior biblioteca do site. Em vez de vir no arquivo principal
// e atrasar a primeira tela, ele é baixado à parte, logo que a primeira fórmula aparece.
// Enquanto não chega, a fórmula ocupa o lugar dela invisível; quando chega, todas aparecem juntas.
let katex = null;
let pedido = null;
const avisar = new Set();

function carregar() {
    if (!pedido) {
        pedido = import("katex")
            .then((modulo) => {
                katex = modulo.default;
                avisar.forEach((f) => f());
            })
            .catch((error) => {
                pedido = null; // deixa tentar de novo na próxima fórmula
                console.log(error.message);
            });
    }
}

function assinar(aoMudar) {
    avisar.add(aoMudar);
    carregar();
    return () => avisar.delete(aoMudar);
}

// Devolve o KaTeX, ou null enquanto ainda está chegando
export function useKatex() {
    return useSyncExternalStore(assinar, () => katex, () => null);
}
