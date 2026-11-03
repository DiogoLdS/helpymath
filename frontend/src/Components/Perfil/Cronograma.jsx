import { useRef, useState } from "react";
import { DIAS, chaveDoDia } from "./perfilUtils.js";
import Carregando from "../Carregando/Carregando.jsx";

// Cronograma da semana em carrossel (Figura 4.3.2 do TCC): um cartão por dia, com o que o aluno
// planejou estudar e quantas atividades ele fez naquele dia. O plano é salvo ao sair do campo.
const Cronograma = ({ cronograma, porDia, inicioSemana, onSalvar }) => {
    const [planos, setPlanos] = useState(() => Object.fromEntries(DIAS.map((d) => [d.chave, cronograma?.[d.chave] ?? ""])));
    const [salvando, setSalvando] = useState(false);
    const trilho = useRef(null);
    const hoje = chaveDoDia(new Date());

    const salvar = async () => {
        // Só manda pro servidor se algo mudou
        const mudou = DIAS.some((d) => (cronograma?.[d.chave] ?? "") !== planos[d.chave].trim());
        if (!mudou) return;

        setSalvando(true);
        await onSalvar({ cronograma: planos });
        setSalvando(false);
    };

    const rolar = (direcao) => {
        trilho.current?.scrollBy({ left: direcao * 220, behavior: "smooth" });
    };

    return (
        <div className="cronograma">
            <div className="cronogramaTopo">
                <span className="perfilDica">{salvando ? <Carregando texto="Salvando o cronograma" /> : "Escreva o que pretende estudar em cada dia."}</span>
                <div className="cronogramaSetas">
                    <button type="button" onClick={() => rolar(-1)} aria-label="Dias anteriores">‹</button>
                    <button type="button" onClick={() => rolar(1)} aria-label="Próximos dias">›</button>
                </div>
            </div>

            <div className="cronogramaTrilho" ref={trilho}>
                {DIAS.map((dia, i) => {
                    const data = new Date(inicioSemana.getTime());
                    data.setDate(data.getDate() + i);
                    const ehHoje = dia.chave === hoje;

                    return (
                        <div key={dia.chave} className={ehHoje ? "cronogramaDia hoje" : "cronogramaDia"}>
                            <div className="cronogramaDiaTopo">
                                <strong>{dia.nome}</strong>
                                <span>{data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                            </div>
                            {ehHoje && <span className="cronogramaHoje">Hoje</span>}

                            <label className="perfilRotuloOculto" htmlFor={`plano-${dia.chave}`}>Plano de {dia.nome}</label>
                            <input
                                id={`plano-${dia.chave}`}
                                type="text"
                                value={planos[dia.chave]}
                                maxLength={80}
                                placeholder="Ex: Frações"
                                onChange={(e) => setPlanos((atual) => ({ ...atual, [dia.chave]: e.target.value }))}
                                onBlur={salvar}
                            />

                            {/* Bolinhas: quantas atividades (conteúdos + questões) o aluno fez nesse dia */}
                            <div className="cronogramaAtividade" title={`${porDia[dia.chave]} atividade(s)`}>
                                {porDia[dia.chave] > 0
                                    ? <><span className="cronogramaPonto" />{porDia[dia.chave]} {porDia[dia.chave] === 1 ? "atividade" : "atividades"}</>
                                    : <span className="cronogramaSem">sem atividade</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Cronograma;
