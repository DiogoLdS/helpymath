import { useEffect, useRef, useState } from "react";

// Caixa de diálogo (janela por cima da página) que funciona bem no teclado e no leitor de tela:
// - ao abrir, o foco entra na janela (ou fica no campo com autoFocus, se houver);
// - Esc fecha;
// - o Tab fica circulando dentro da janela, sem escapar para a página de trás;
// - ao fechar, o foco volta para o botão que abriu.
// O fundo escurecido continua sendo de cada página (cada uma tem o seu visual).

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Janela = ({ onFechar, className, children, ...resto }) => {
    const caixa = useRef(null);
    const fechar = useRef(onFechar);
    // Guardado já na primeira renderização: antes de um autoFocus da janela roubar o foco
    const [quemAbriu] = useState(() => document.activeElement);

    useEffect(() => {
        fechar.current = onFechar;
    });

    useEffect(() => {
        if (caixa.current && !caixa.current.contains(document.activeElement)) {
            caixa.current.focus();
        }

        const teclado = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                fechar.current?.();
                return;
            }
            if (e.key !== "Tab" || !caixa.current) return;

            const focaveis = [...caixa.current.querySelectorAll(FOCAVEIS)];
            if (focaveis.length === 0) {
                e.preventDefault();
                return;
            }
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            const atual = document.activeElement;

            if (e.shiftKey && (atual === primeiro || atual === caixa.current)) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && (atual === ultimo || !caixa.current.contains(atual))) {
                e.preventDefault();
                primeiro.focus();
            }
        };

        document.addEventListener("keydown", teclado);
        return () => {
            document.removeEventListener("keydown", teclado);
            if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus();
        };
    }, [quemAbriu]);

    return (
        <div ref={caixa} className={className} role="dialog" aria-modal="true" tabIndex={-1} {...resto}>
            {children}
        </div>
    );
};

export default Janela;
