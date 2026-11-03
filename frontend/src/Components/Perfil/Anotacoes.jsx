import { useState } from "react";

const LIMITE = 5000; // mesmo limite do backend

// Bloco de anotações pessoais do aluno (Figura 4.3.2 do TCC)
const Anotacoes = ({ texto, onSalvar }) => {
    const [rascunho, setRascunho] = useState(texto ?? "");
    const [estado, setEstado] = useState("");

    const mudou = rascunho !== (texto ?? "");

    const salvar = async () => {
        setEstado("Salvando...");
        const certo = await onSalvar({ anotacoes: rascunho });
        setEstado(certo
            ? `Salvo às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Não foi possível salvar. Tente de novo.");
    };

    return (
        <div className="anotacoes">
            <label className="perfilRotuloOculto" htmlFor="anotacoes">Suas anotações</label>
            <textarea
                id="anotacoes"
                value={rascunho}
                maxLength={LIMITE}
                rows={7}
                placeholder="Fórmulas para lembrar, dúvidas para perguntar, o que revisar antes da prova..."
                onChange={(e) => setRascunho(e.target.value)}
            />
            <div className="anotacoesRodape">
                <span className="perfilDica">{estado || `${rascunho.length}/${LIMITE} caracteres`}</span>
                <button type="button" className="perfilBotao" onClick={salvar} disabled={!mudou}>
                    Salvar anotações
                </button>
            </div>
        </div>
    );
};

export default Anotacoes;
