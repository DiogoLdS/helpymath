import { Link } from "react-router";
import { mapaAtual, porcentagemDoMapa } from "./trilhaUtils.js";

// Deslocamento horizontal de cada mapa no caminho, formando um zigue-zague que se repete.
// As posições são calculadas numa largura de referência e viram porcentagem, então o caminho
// encolhe junto com a tela no celular sem nada vazar pro lado.
const ZIGUEZAGUE = [0, 60, 90, 60, 0, -60, -90, -60];
const LARGURA = 320;  // largura de referência (e máxima) do caminho
const ALTURA_PASSO = 170; // distância vertical entre um mapa e o próximo (com folga pro balão "COMEÇAR")
const TOPO = 64;      // espaço em cima do primeiro mapa (pro balão "COMEÇAR")

// Um nível da trilha: faixa colorida no topo ("unidade") e os mapas do nível num caminho.
// numero = posição do nível (1 = Básico...), nivel = item de data/niveis.js, mapas = mapas desse nível em ordem
// abrindo = ids dos mapas desbloqueados desde a última visita (o cadeado deles abre na tela, uma vez)
const Trilha = ({ numero, nivel, mapas, abrindo = [] }) => {
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
                <div className="trilhaCaminho" style={{ maxWidth: LARGURA, height: TOPO + (mapas.length - 1) * ALTURA_PASSO + 110 }}>
                    {/* Linha "de giz" ligando os mapas na ordem */}
                    <svg
                        className="trilhaLinha"
                        viewBox={`0 0 ${LARGURA} ${TOPO + (mapas.length - 1) * ALTURA_PASSO + 40}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <polyline points={pontos.map((p) => `${p.x},${p.y}`).join(" ")} />
                    </svg>

                    {mapas.map((mapa, i) => {
                        const ehAtual = atual?.mapaId === mapa.mapaId;
                        const porcentagem = porcentagemDoMapa(mapa);
                        const estado = mapa.concluido ? "concluido" : ehAtual ? "atual" : mapa.liberado ? "livre" : "trancado";
                        const estilo = { left: `${(pontos[i].x / LARGURA) * 100}%`, top: pontos[i].y };
                        const abrindoAgora = abrindo.includes(mapa.mapaId);
                        // Liberado por ter concluído o anterior e ainda nem aberto: ganha o bilhete "novo!"
                        const novo = mapa.liberado && mapa.anterior && !mapa.concluido && porcentagem === 0;
                        // Mapa do lado direito do zigue-zague: bilhete vai pra esquerda (senão sai da tela)
                        const ladoDoBilhete = ZIGUEZAGUE[i % ZIGUEZAGUE.length] > 0 ? "esquerda" : "direita";
                        let classe = `trilhaMapa ${estado}`;
                        if (abrindoAgora) classe += " abrindo";

                        const ficha = (
                            <>
                                {ehAtual && (
                                    <span className="trilhaBalao">{porcentagem > 0 ? "Continuar" : "Começar"}</span>
                                )}
                                {novo && (
                                    <span className={`trilhaBilhete ${ladoDoBilhete}`} aria-hidden="true">novo!</span>
                                )}
                                {/* Anel de progresso em volta do mapa da vez */}
                                <span
                                    className="trilhaAnel"
                                    style={ehAtual ? { "--progresso": `${porcentagem * 3.6}deg` } : undefined}
                                >
                                    <span className="trilhaFicha">{mapa.concluido ? "✓" : i + 1}</span>
                                    {abrindoAgora && (
                                        // Cadeado em cima da ficha: a alça sobe, o cadeado cai e some
                                        <svg className="trilhaCadeado" viewBox="0 0 24 30" aria-hidden="true">
                                            <path className="trilhaCadeadoAlca" d="M6 14V9a6 6 0 0 1 12 0v5" />
                                            <rect className="trilhaCadeadoCorpo" x="3" y="13" width="18" height="14" rx="2" />
                                            <circle className="trilhaCadeadoFuro" cx="12" cy="20" r="1.8" />
                                        </svg>
                                    )}
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
                                className={classe}
                                style={estilo}
                                aria-label={`${mapa.nome}${mapa.concluido ? " (concluído)" : ehAtual ? ` (mapa atual, ${porcentagem}% feito)` : ""}${novo ? " (novo)" : ""}`}
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
