import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../../../services/api.js";
import { usuarioEhAdmin } from "../../utils/auth.js";
import layouts, { gerarLayoutPadrao } from "../../data/layouts.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import { TextoComMidia } from "../Midia/Midia.jsx";
import { linkExterno, linkInterno } from "../../utils/linkDestino.js";
import "./MapaConceitual.css";
import useTituloPagina from "../../utils/useTituloPagina.js";

// Nome de cada tipo de conteúdo na versão impressa (mesmos tipos do MapaForm)
const ROTULOS_TIPO = {
    1: "Botão explicativo",
    2: "Indicador explicativo",
    3: "Botão direcional",
};

// Página do mapa conceitual: busca o mapa (nome + conteúdos + explicações) direto da API,
// e usa layouts.js só pra decidir onde cada botão fica no grid.
const MapaConceitual = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mapa, setMapa] = useState(null);
    const [designIndex, setDesignIndex] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [abertoId, setAbertoId] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [preparandoImpressao, setPreparandoImpressao] = useState(false);

    // Progresso do aluno: ids dos conteúdos que ele já marcou como concluídos.
    // null = não deu pra buscar (ex: backend antigo); aí nada fica bloqueado.
    const [concluidos, setConcluidos] = useState(null);
    const [salvandoConclusao, setSalvandoConclusao] = useState(false);

    // Na aba aparece o nome do mapa (ex: "Probabilidade | HelpyMath")
    useTituloPagina(mapa?.nome ?? "Mapa conceitual");

    useEffect(() => {
        const buscarMapa = async () => {
            const storedToken = localStorage.getItem("token");

            if (!storedToken) {
                navigate("/login");
                return;
            }

            setCarregando(true);
            setErro("");
            setAbertoId(null);

            try {
                const resposta = await api.get(`/mapas/${id}`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                const dados = resposta.data;

                // Progresso do usuário nesse mapa (se falhar, o mapa abre normalmente, sem bloqueios)
                try {
                    const respostaProgresso = await api.get(`/mapas/${id}/progresso`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setConcluidos(respostaProgresso.data.concluidos);
                } catch (errorProgresso) {
                    setConcluidos(null);
                    console.log(errorProgresso.message);
                }

                // Sorteia a variante de design uma vez por carregamento, conforme a quantidade de conteúdos
                const variantes = layouts[dados.conteudos.length] || [];
                setDesignIndex(Math.floor(Math.random() * variantes.length));
                setMapa(dados);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }

                setErro(
                    error.response?.status === 404
                        ? "Mapa conceitual não encontrado."
                        : "Não foi possível carregar este mapa conceitual."
                );
                console.log(error.message);
            } finally {
                setCarregando(false);
            }
        };

        buscarMapa();
    }, [id]);

    if (carregando) {
        return <p className="mapaMensagem">Carregando...</p>;
    }

    if (erro || !mapa) {
        return <p className="mapaMensagem">{erro || "Não foi possível carregar este mapa conceitual."}</p>;
    }

    // Só admin vê o botão; quem bloqueia de verdade é o backend (authAdmin)
    const excluirMapa = async () => {
        const confirmou = window.confirm(
            `Excluir o mapa "${mapa.nome}"?\n\nAs questões dele também serão apagadas. Essa ação não pode ser desfeita.`
        );
        if (!confirmou) return;

        setExcluindo(true);

        try {
            await api.delete(`/mapas/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            navigate("/mapas");
        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
            window.alert(
                error.response?.status === 403
                    ? "Acesso restrito a administradores."
                    : "Não foi possível excluir o mapa. Tente novamente em instantes."
            );
            console.log(error.message);
            setExcluindo(false);
        }
    };

    // Antes de abrir a impressão, espera as imagens da parte "Conteúdos do mapa" carregarem
    // (senão elas saem em branco no PDF). Se alguma demorar demais, imprime assim mesmo.
    const imprimirMapa = async () => {
        setPreparandoImpressao(true);

        const limite = Date.now() + 8000;
        while (document.querySelector(".mapaImpressao [data-carregando]") && Date.now() < limite) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        setPreparandoImpressao(false);
        window.print();
    };

    // Marca (ou desmarca) o conteúdo aberto como concluído pro usuário logado
    const marcarConclusao = async (conteudoId, concluido) => {
        setSalvandoConclusao(true);

        try {
            await api.put(
                `/conteudo/${conteudoId}/conclusao`,
                { concluido },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            setConcluidos((atual) => {
                const lista = (atual ?? []).filter((idConcluido) => idConcluido !== conteudoId);
                return concluido ? [...lista, conteudoId] : lista;
            });
        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }
            window.alert("Não foi possível salvar seu progresso. Tente novamente em instantes.");
            console.log(error.message);
        } finally {
            setSalvandoConclusao(false);
        }
    };

    const itens = mapa.conteudos;

    // Só os botões explicativos (tipo 1) precisam ser concluídos; indicadores e links não contam
    const interativos = itens.filter((item) => item.tipo === 1);
    const estaConcluido = (conteudoId) => (concluidos ?? []).includes(conteudoId);
    const quantidadeConcluida = interativos.filter((item) => estaConcluido(item.conteudoId)).length;
    const faltam = interativos.length - quantidadeConcluida;

    // Admin sempre pode abrir as questões (pra conferir o que cadastrou); quem bloqueia de verdade é o backend
    const questoesLiberadas = usuarioEhAdmin() || concluidos === null || faltam === 0;

    // Ficam dentro do .mapaGrid, posicionados em relação à caixa do mapa:
    // imprimir/editar/excluir no canto de cima à direita, "Fazer questões" no meio da lateral direita.
    // Imprimir abre a janela de impressão do navegador, que também tem a opção "Salvar como PDF".
    const acoes = (
        <>
            <div className="mapaAcoesTopo">
                <button type="button" className="mapaImprimir" onClick={imprimirMapa} disabled={preparandoImpressao}>
                    {preparandoImpressao ? "Preparando..." : "Imprimir / PDF"}
                </button>
                {usuarioEhAdmin() && (
                    <>
                        <Link to={`/admin/mapas/${id}/editar`} className="mapaEditar">Editar mapa</Link>
                        <button type="button" className="mapaExcluir" onClick={excluirMapa} disabled={excluindo}>
                            {excluindo ? "Excluindo..." : "Excluir mapa"}
                        </button>
                    </>
                )}
            </div>
            {/* Barra de progresso dos conteúdos, no canto de cima à esquerda */}
            {concluidos !== null && interativos.length > 0 && (
                <div className="mapaProgresso" aria-live="polite">
                    <span>
                        <strong>{quantidadeConcluida}</strong> de {interativos.length} conteúdos concluídos
                    </span>
                    <div className="mapaProgressoBarra">
                        <div style={{ width: `${(quantidadeConcluida / interativos.length) * 100}%` }} />
                    </div>
                </div>
            )}

            {questoesLiberadas ? (
                <Link to={`/mapas/${id}/questoes`} className="mapaQuestoes">Fazer questões</Link>
            ) : (
                <button
                    type="button"
                    className="mapaQuestoes mapaQuestoesBloqueado"
                    disabled
                    title="Marque todos os conteúdos como concluídos para liberar as questões"
                >
                    Fazer questões
                    <small>{faltam === 1 ? "Falta 1 conteúdo" : `Faltam ${faltam} conteúdos`}</small>
                </button>
            )}
        </>
    );

    if (itens.length === 0) {
        return (
            <div className="mapaConceitualPage">
                <Sidebar />
                <div className="mapaGrid">
                    <p className="mapaMensagem">Este mapa ainda não tem conteúdos cadastrados.</p>
                    {acoes}
                </div>
            </div>
        );
    }

    // Variante cadastrada em layouts.js; se não existir pra essa quantidade, usa o layout de reserva
    const variantes = layouts[itens.length] || [];
    const layout = variantes[designIndex] || gerarLayoutPadrao(itens.length);

    if (!layout) {
        return <p className="mapaMensagem">Este mapa tem conteúdos demais para o layout atual ({itens.length}).</p>;
    }

    const itemAberto = itens.find((item) => item.conteudoId === abertoId);

    return (
        <div className="mapaConceitualPage">
            <Sidebar />
            <div
                className="mapaGrid"
                style={{
                    gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                }}
            >

                {/* Linhas "de giz" ligando o título (centro) a cada conteúdo, como no quadro da introdução */}
                <svg className="mapaLinhas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {layout.posicoes.slice(0, itens.length).map((p, i) => (
                        <line
                            key={i}
                            x1="50"
                            y1="50"
                            x2={((p.col - 0.5) / layout.cols) * 100}
                            y2={((p.row - 0.5) / layout.rows) * 100}
                        />
                    ))}
                </svg>

                <div className="mapaTitulo">{mapa.nome}</div>

                {itens.map((item, index) => {
                    const posicao = layout.posicoes[index];
                    const estiloPosicao = { gridRow: posicao.row, gridColumn: posicao.col };
                    const destino = (item.explicacao ?? "").trim();

                    // Tipo 2 - Indicador explicativo: texto curto sempre visível, sem clique
                    if (item.tipo === 2) {
                        return (
                            <div key={item.conteudoId} className="mapaNo mapaIndicador" style={estiloPosicao}>
                                <strong>{item.titulo}</strong>
                                {item.explicacao?.trim() && <div><TextoComMidia texto={item.explicacao} /></div>}
                            </div>
                        );
                    }

                    // Tipo 3 - Botão direcional: leva pra um site externo (nova aba) ou pra uma página da plataforma
                    if (item.tipo === 3) {
                        if (linkExterno(destino)) {
                            return (
                                <a
                                    key={item.conteudoId}
                                    href={destino}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mapaNo mapaDirecional"
                                    style={estiloPosicao}
                                >
                                    {item.titulo}
                                </a>
                            );
                        }

                        if (linkInterno(destino)) {
                            return (
                                <Link
                                    key={item.conteudoId}
                                    to={destino}
                                    className="mapaNo mapaDirecional"
                                    style={estiloPosicao}
                                >
                                    {item.titulo}
                                </Link>
                            );
                        }

                        // Sem link válido cadastrado: mostra o botão desativado em vez de quebrar
                        return (
                            <button
                                type="button"
                                key={item.conteudoId}
                                className="mapaNo mapaDirecional"
                                style={estiloPosicao}
                                disabled
                                title="Link de destino não cadastrado"
                            >
                                {item.titulo}
                            </button>
                        );
                    }

                    // Tipo 1 - Botão ampliado: abre a janela com a explicação detalhada.
                    // O selo no canto mostra se o aluno já concluiu (com ✓) ou não (vazio).
                    const concluido = estaConcluido(item.conteudoId);

                    return (
                        <button
                            type="button"
                            key={item.conteudoId}
                            className={concluido ? "mapaNo mapaNoConcluido" : "mapaNo"}
                            style={estiloPosicao}
                            onClick={() => setAbertoId(item.conteudoId)}
                        >
                            {item.titulo}
                            {concluidos !== null && (
                                <span className="mapaStatus" aria-label={concluido ? "concluído" : "não concluído"}>
                                    {concluido ? "✓" : ""}
                                </span>
                            )}
                        </button>
                    );
                })}

                {acoes}
            </div>

            {/* Só aparece na impressão/PDF: cada conteúdo "aberto", depois da página do mapa */}
            <section className="mapaImpressao">
                <h2>{mapa.nome}: conteúdos</h2>

                {itens.map((item) => {
                    const destino = (item.explicacao ?? "").trim();

                    return (
                        <article key={item.conteudoId} className="mapaImpressaoItem">
                            <h3>{item.titulo}</h3>
                            <span className="mapaImpressaoTipo">{ROTULOS_TIPO[item.tipo]}</span>

                            {item.tipo === 3 ? (
                                <p>{destino ? `Link: ${destino}` : "Link de destino não cadastrado."}</p>
                            ) : destino ? (
                                <div><TextoComMidia texto={item.explicacao} impressao /></div>
                            ) : (
                                <p>Sem explicação cadastrada.</p>
                            )}
                        </article>
                    );
                })}
            </section>

            {itemAberto && (
                <>
                    <div className="backdrop" onClick={() => setAbertoId(null)} />
                    <div className="mapaExplicacao" role="dialog" aria-modal="true" aria-label={itemAberto.titulo}>
                        <h3>{itemAberto.titulo}</h3>
                        <div className="mapaExplicacaoTexto">
                            {itemAberto.explicacao
                                ? <TextoComMidia texto={itemAberto.explicacao} />
                                : "Sem explicação cadastrada ainda."}
                        </div>

                        <div className="mapaExplicacaoAcoes">
                            {concluidos !== null && (
                                estaConcluido(itemAberto.conteudoId) ? (
                                    <button
                                        type="button"
                                        className="mapaConcluir mapaConcluirFeito"
                                        onClick={() => marcarConclusao(itemAberto.conteudoId, false)}
                                        disabled={salvandoConclusao}
                                        title="Clique para desmarcar"
                                    >
                                        ✓ Concluído
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="mapaConcluir"
                                        onClick={() => marcarConclusao(itemAberto.conteudoId, true)}
                                        disabled={salvandoConclusao}
                                    >
                                        {salvandoConclusao ? "Salvando..." : "Marcar como concluído"}
                                    </button>
                                )
                            )}
                            <button type="button" className="mapaFechar" onClick={() => setAbertoId(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MapaConceitual;