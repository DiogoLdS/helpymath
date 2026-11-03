import { Link } from "react-router";
import { mapaAtual, porcentagemDoMapa } from "./trilhaUtils.js";

// Deslocamento horizontal (em px) de cada mapa no caminho, formando um zigue-zague que se repete
const ZIGUEZAGUE = [0, 70, 100, 70, 0, -70, -100, -70];
const LARGURA = 320;  // largura do caminho (cabe no celular)
const ALTURA_PASSO = 170; // distância vertical entre um mapa e o próximo (com folga pro balão "COMEÇAR")
const TOPO = 64;      // espaço em cima do primeiro mapa (pro balão "COMEÇAR")

// Um nível da trilha: faixa colorida no topo ("unidade") e os mapas do nível num caminho.
// numero = posição do nível (1 = Básico...), nivel = item de data/niveis.js, mapas = mapas desse nível em ordem
const Trilha = ({ numero, nivel, mapas }) => {
    const atual = mapaAtual(mapas);
    const concluidos = mapas.filter((m) => m.concluido).length;

    const pontos = mapas.map((_, i) => ({
        x: LARGURA / 2 + ZIGUEZAGUE[i % ZIGUEZAGUE.length],
        y: TOPO + i * ALTURA_PASSO,
    }));

    return (
        // "trilha-basico" e não "nivel-basico": essa já existe no Home.css e pintaria a trilha inteira
        <section className={`trilha trilha-${nivel.chave}`}>
            <header className="trilhaUnidade">
                <div>
                    <span className="trilhaNumero">Nível {numero}</span>
                    <h2>{nivel.nome}</h2>
                    <p>{nivel.descricao.charAt(0) + nivel.descricao.slice(1).toLowerCase()}</p>
                </div>
                {mapas.length > 0 && (
                    <div className="trilhaResumo">
                        <strong>{concluidos} de {mapas.length}</strong>
                        <span>mapas</span>
                        <div className="trilhaResumoBarra">
                            <div style={{ width: `${(concluidos / mapas.length) * 100}%` }} />
                        </div>
                    </div>
                )}
            </header>

            {mapas.length === 0 ? (
                <p className="trilhaVazia">Nenhum mapa neste nível ainda.</p>
            ) : (
                <div className="trilhaCaminho" style={{ width: LARGURA, height: TOPO + (mapas.length - 1) * ALTURA_PASSO + 110 }}>
                    {/* Linha "de giz" ligando os mapas na ordem */}
                    <svg className="trilhaLinha" width={LARGURA} height={TOPO + (mapas.length - 1) * ALTURA_PASSO + 40} aria-hidden="true">
                        <polyline points={pontos.map((p) => `${p.x},${p.y}`).join(" ")} />
                    </svg>

                    {mapas.map((mapa, i) => {
                        const ehAtual = atual?.mapaId === mapa.mapaId;
                        const porcentagem = porcentagemDoMapa(mapa);
                        const estado = mapa.concluido ? "concluido" : ehAtual ? "atual" : mapa.liberado ? "livre" : "trancado";
                        const estilo = { left: pontos[i].x, top: pontos[i].y };

                        const ficha = (
                            <>
                                {ehAtual && (
                                    <span className="trilhaBalao">{porcentagem > 0 ? "Continuar" : "Começar"}</span>
                                )}
                                {/* Anel de progresso em volta do mapa da vez */}
                                <span
                                    className="trilhaAnel"
                                    style={ehAtual ? { "--progresso": `${porcentagem * 3.6}deg` } : undefined}
                                >
                                    <span className="trilhaFicha">{mapa.concluido ? "✓" : i + 1}</span>
                                </span>
                                <span className="trilhaNome">{mapa.nome}</span>
                                {ehAtual && porcentagem > 0 && <span className="trilhaPorcento">{porcentagem}%</span>}
                            </>
                        );

                        // Mapa trancado não é link: precisa concluir o anterior do nível
                        if (!mapa.liberado) {
                            return (
                                <div
                                    key={mapa.mapaId}
                                    className={`trilhaMapa ${estado}`}
                                    style={estilo}
                                    title={mapa.anterior ? `Conclua "${mapa.anterior.nome}" para liberar` : "Bloqueado"}
                                    aria-disabled="true"
                                >
                                    {ficha}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={mapa.mapaId}
                                to={`/mapas/${mapa.mapaId}`}
                                className={`trilhaMapa ${estado}`}
                                style={estilo}
                                aria-label={`${mapa.nome}${mapa.concluido ? " (concluído)" : ehAtual ? ` (mapa atual, ${porcentagem}% feito)` : ""}`}
                            >
                                {ficha}
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default Trilha;
