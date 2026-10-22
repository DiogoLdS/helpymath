import { useRef, useState } from "react";
import { Link } from "react-router";
import { MAX_CONTEUDOS } from "../../data/layouts.js";
import FormulaEditor from "../Formulas/FormulaEditor.jsx";
import MidiaEditor from "../Midia/MidiaEditor.jsx";
import { TextoComMidia } from "../Midia/Midia.jsx";
import { linkDestinoValido } from "../../utils/linkDestino.js";
import "./AdminCriarMapa.css";

// Tipos de elemento de conteúdo, conforme seção 3.7 do TCC:
// 1 - Botão ampliado a uma explicação (expande em janela detalhada)
// 2 - Indicador explicativo (texto curto sem interação, ex: fórmulas)
// 3 - Botão direcional (redireciona a outra página/simulação)
const TIPOS_CONTEUDO = [
    { valor: 1, rotulo: "Botão explicativo (expande detalhes)" },
    { valor: 2, rotulo: "Indicador explicativo (texto curto)" },
    { valor: 3, rotulo: "Botão direcional (redireciona)" },
];

let proximoIdTemporario = 1;

// Formulário usado pra criar e pra editar mapa. Ele cuida só dos campos e da validação:
// quem salva no banco (e mostra erro/etapa) é a página que usa o formulário.
//
// valoresIniciais: { nome, conteudos } - conteúdos já salvos trazem "conteudoId"
// onSubmit(nome, conteudos): chamado só depois de passar na validação
const MapaForm = ({
    valoresIniciais,
    onSubmit,
    enviando,
    etapaAtual,
    erro,
    rotuloBotao,
    permitirMover = true,
    linkCancelar,
}) => {
    const [nome, setNome] = useState(valoresIniciais.nome);
    const [conteudos, setConteudos] = useState(valoresIniciais.conteudos);
    const [erroValidacao, setErroValidacao] = useState("");

    // Guarda o <textarea> da explicação de cada conteúdo, pra inserir fórmulas na posição do cursor
    const camposExplicacao = useRef({});

    const adicionarConteudo = () => {
        setConteudos((atual) => [
            ...atual,
            { idTemp: proximoIdTemporario++, titulo: "", explicacao: "", formulaAtiva: false, tipo: TIPOS_CONTEUDO[0].valor },
        ]);
    };

    const atualizarConteudo = (idTemp, campo, valor) => {
        setConteudos((atual) =>
            atual.map((c) => (c.idTemp === idTemp ? { ...c, [campo]: valor } : c))
        );
    };

    // Joga um trecho (ex: "$$x^2$$") dentro da explicação, no lugar onde está o cursor
    const inserirNaExplicacao = (idTemp, trecho) => {
        const conteudo = conteudos.find((c) => c.idTemp === idTemp);
        const campo = camposExplicacao.current[idTemp];
        if (!conteudo) return;

        const inicio = campo ? campo.selectionStart : conteudo.explicacao.length;
        const fim = campo ? campo.selectionEnd : conteudo.explicacao.length;
        const novoTexto = conteudo.explicacao.slice(0, inicio) + trecho + conteudo.explicacao.slice(fim);

        atualizarConteudo(idTemp, "explicacao", novoTexto);

        // Depois do re-render, deixa o cursor logo depois do que foi inserido
        requestAnimationFrame(() => {
            const campoAtual = camposExplicacao.current[idTemp];
            if (!campoAtual) return;
            const posicao = inicio + trecho.length;
            campoAtual.focus();
            campoAtual.setSelectionRange(posicao, posicao);
        });
    };

    const removerConteudo = (idTemp) => {
        setConteudos((atual) => atual.filter((c) => c.idTemp !== idTemp));
    };

    const moverConteudo = (index, direcao) => {
        setConteudos((atual) => {
            const novaLista = [...atual];
            const novoIndex = index + direcao;

            if (novoIndex < 0 || novoIndex >= novaLista.length) return atual;

            [novaLista[index], novaLista[novoIndex]] = [novaLista[novoIndex], novaLista[index]];
            return novaLista;
        });
    };

    const validar = () => {
        if (!nome.trim()) {
            return "Informe um nome para o mapa conceitual.";
        }

        if (conteudos.length > MAX_CONTEUDOS) {
            return `Um mapa comporta no máximo ${MAX_CONTEUDOS} conteúdos.`;
        }

        for (const c of conteudos) {
            if (!c.titulo.trim()) {
                return "Todos os conteúdos precisam de um título.";
            }

            if (Number(c.tipo) === 3 && !linkDestinoValido(c.explicacao)) {
                return `O botão direcional "${c.titulo.trim()}" precisa de um link de destino (https://... ou /pagina-do-site).`;
            }
        }

        return "";
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const mensagemValidacao = validar();
        setErroValidacao(mensagemValidacao);
        if (mensagemValidacao) return;

        onSubmit(nome.trim(), conteudos);
    };

    const mensagemErro = erroValidacao || erro;

    return (
        <form onSubmit={handleSubmit} className="formCriarMapa">
            <label htmlFor="nomeMapa">Nome do mapa</label>
            <input
                id="nomeMapa"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Probabilidades"
                disabled={enviando}
            />

            <div className="secaoConteudos">
                <div className="cabecalhoConteudos">
                    <h2>Conteúdos do mapa</h2>
                    <button
                        type="button"
                        className="botaoSecundario"
                        onClick={adicionarConteudo}
                        disabled={enviando || conteudos.length >= MAX_CONTEUDOS}
                    >
                        + Adicionar conteúdo
                    </button>
                </div>

                {conteudos.length === 0 && (
                    <p className="vazio">
                        Nenhum conteúdo adicionado ainda. Você também pode salvar o mapa
                        vazio e cadastrar conteúdos depois.
                    </p>
                )}

                {conteudos.map((conteudo, index) => {
                    const tipo = Number(conteudo.tipo);

                    return (
                        <div className="cardConteudo" key={conteudo.idTemp}>
                            <div className="linhaConteudo">
                                <input
                                    type="text"
                                    value={conteudo.titulo}
                                    onChange={(e) =>
                                        atualizarConteudo(conteudo.idTemp, "titulo", e.target.value)
                                    }
                                    placeholder="Título do conteúdo"
                                    disabled={enviando}
                                />

                                <select
                                    value={conteudo.tipo}
                                    onChange={(e) =>
                                        atualizarConteudo(conteudo.idTemp, "tipo", e.target.value)
                                    }
                                    disabled={enviando}
                                >
                                    {TIPOS_CONTEUDO.map((t) => (
                                        <option key={t.valor} value={t.valor}>
                                            {t.rotulo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {tipo === 3 ? (
                                <>
                                    <input
                                        type="text"
                                        value={conteudo.explicacao}
                                        onChange={(e) =>
                                            atualizarConteudo(conteudo.idTemp, "explicacao", e.target.value)
                                        }
                                        placeholder="Link de destino. Ex: https://www.geogebra.org ou /simulacoes/dados"
                                        aria-label="Link de destino"
                                        disabled={enviando}
                                    />
                                    <p className="dicaTipo">
                                        Quando o aluno clicar, ele vai para esse link. Links de outros sites abrem em
                                        uma nova aba; caminhos começando com "/" abrem uma página da própria plataforma.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <textarea
                                        ref={(el) => { camposExplicacao.current[conteudo.idTemp] = el; }}
                                        value={conteudo.explicacao}
                                        onChange={(e) =>
                                            atualizarConteudo(conteudo.idTemp, "explicacao", e.target.value)
                                        }
                                        placeholder={tipo === 2
                                            ? "Texto curto que fica sempre visível no mapa (ex: uma fórmula). Pode ficar vazio se o título já explicar."
                                            : "Explicação que aparece quando o aluno clica no conteúdo"}
                                        rows={tipo === 2 ? 2 : 5}
                                        disabled={enviando}
                                    />

                                    <label className="opcaoFormula">
                                        <input
                                            type="checkbox"
                                            checked={conteudo.formulaAtiva}
                                            onChange={(e) =>
                                                atualizarConteudo(conteudo.idTemp, "formulaAtiva", e.target.checked)
                                            }
                                            disabled={enviando}
                                        />
                                        Escrever fórmulas matemáticas nesta explicação
                                    </label>

                                    {conteudo.formulaAtiva && (
                                        <FormulaEditor
                                            onInserir={(trecho) => inserirNaExplicacao(conteudo.idTemp, trecho)}
                                            disabled={enviando}
                                        />
                                    )}

                                    {tipo === 1 && (
                                        <button
                                            type="button"
                                            className="botaoSecundario botaoInserirMidia"
                                            onClick={() =>
                                                atualizarConteudo(conteudo.idTemp, "midiaAberta", !conteudo.midiaAberta)
                                            }
                                            aria-expanded={Boolean(conteudo.midiaAberta)}
                                            disabled={enviando}
                                        >
                                            {conteudo.midiaAberta ? "Fechar mídia" : "+ Inserir mídia"}
                                        </button>
                                    )}

                                    {tipo === 1 && conteudo.midiaAberta && (
                                        <MidiaEditor
                                            onInserir={(trecho) => inserirNaExplicacao(conteudo.idTemp, trecho)}
                                            disabled={enviando}
                                        />
                                    )}

                                    {((conteudo.formulaAtiva && conteudo.explicacao.includes("$")) ||
                                        conteudo.explicacao.includes("[[")) && (
                                        <div className="previaExplicacao">
                                            <span>Pré-visualização da explicação</span>
                                            <div><TextoComMidia texto={conteudo.explicacao} /></div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="acoesConteudo">
                                {permitirMover && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => moverConteudo(index, -1)}
                                            disabled={enviando || index === 0}
                                            aria-label="Mover para cima"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moverConteudo(index, 1)}
                                            disabled={enviando || index === conteudos.length - 1}
                                            aria-label="Mover para baixo"
                                        >
                                            ↓
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="botaoRemover"
                                    onClick={() => removerConteudo(conteudo.idTemp)}
                                    disabled={enviando}
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {mensagemErro && <p className="mensagemErro">{mensagemErro}</p>}
            {enviando && etapaAtual && <p className="mensagemEtapa">{etapaAtual}</p>}

            <div className="acoesForm">
                <button type="submit" className="botaoPrimario" disabled={enviando}>
                    {enviando ? "Salvando..." : rotuloBotao}
                </button>

                {linkCancelar && (
                    <Link to={linkCancelar} className="botaoCancelar">Cancelar</Link>
                )}
            </div>
        </form>
    );
};

export default MapaForm;