import { Link } from "react-router";
import { mapaAtual, porcentagemDoMapa } from "./trilhaUtils.js";

// Deslocamento horizontal de cada mapa no caminho, formando um zigue-zague que se repete.
// As posições são calculadas numa largura de referência e viram porcentagem, então o caminho
// encolhe junto com a tela no celular sem nada vazar pro lado.
const ZIGUEZAGUE = [0, 75, 120, 75, 0, -75, -120, -75];
const LARGURA = 420;  // largura de referência (e máxima) do caminho
const ALTURA_PASSO = 170; // distância vertical entre um mapa e o próximo (com folga pro balão "COMEÇAR")
const TOPO = 64;      // espaço em cima do primeiro mapa (pro balão "COMEÇAR")

// Símbolo de cada nível, grandão e clarinho no canto da folha (como os símbolos da página inicial)
const SIMBOLOS = { basico: "÷", intermediario: "f(x)", avancado: "∫", treino: "Σ" };

// Um nível da trilha: faixa colorida no topo ("unidade") e os mapas do nível num caminho.
// numero = posição do nível (1 = Básico...), nivel = item de data/niveis.js, mapas = mapas desse nível em ordem
// abrindo = ids dos mapas desbloqueados desde a última visita (o cadeado deles abre na tela, uma vez)
// admin = mostra o atalho "Criar simulado" no Treino
const Trilha = ({ numero, nivel, mapas, abrindo = [], admin = false }) => {
    const atual = mapaAtual(mapas);
    const concluidos = mapas.filter((m) => m.concluido).length;
    // Nível trancado: o aluno ainda precisa concluir todos os mapas do nível de baixo
    const nivelPendente = mapas.find((m) => m.nivelPendente)?.nivelPendente ?? null;

    const pontos = mapas.map((_, i) => ({
        x: LARGURA / 2 + ZIGUEZAGUE[i % ZIGUEZAGUE.length],
        y: TOPO + i * ALTURA_PASSO,
    }));

    return (
        // "trilha-basico" e não "nivel-basico": essa já existe no Home.css e pintaria a trilha inteira
        <section className={`trilha trilha-${nivel.chave}${nivelPendente ? " trancada" : ""}`}>
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

            {/* A "folha" do nível: papel quadriculado na cor do nível, com o símbolo dele bem clarinho */}
            <div className={mapas.length === 0 ? "trilhaFolha vazia" : "trilhaFolha"}>
            <span className="trilhaSimbolo" aria-hidden="true">{SIMBOLOS[nivel.chave] ?? "π"}</span>

            {nivelPendente && (
                <p className="trilhaAvisoNivel">
                    <svg viewBox="0 0 24 30" aria-hidden="true">
                        <path d="M6 14V9a6 6 0 0 1 12 0v5" />
                        <rect x="3" y="13" width="18" height="14" rx="2" />
                    </svg>
                    <span>Este nível abre quando você concluir <strong>todos os mapas do {nivelPendente.nome}</strong>.</span>
                </p>
            )}

            {/* Atalho do admin: abre o "Criar" já na opção Simulado */}
            {admin && nivel.chave === "treino" && (
                <Link to="/admin/mapas/criar?tipo=simulado" className="trilhaCriarSimulado">+ Criar simulado</Link>
            )}

            {mapas.length === 0 ? (
                <p className="trilhaVazia">Em breve: ainda não tem mapas neste nível.</p>
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
                        let classe = `trilhaMapa ${estado}`;
                        if (abrindoAgora) classe += " abrindo";

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
                                {mapa.simulado && (
                                    <span className="trilhaTipo">
                                        {mapa.concluido && mapa.progresso
                                            ? `Simulado · ${mapa.progresso.questoesAcertos}/${mapa.progresso.questoesTotal}`
                                            : "Simulado"}
                                    </span>
                                )}
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
                                    title={mapa.nivelPendente
                                        ? `Conclua todos os mapas do ${mapa.nivelPendente.nome} para liberar`
                                        : mapa.anterior ? `Conclua "${mapa.anterior.nome}" para liberar` : "Bloqueado"}
                                    aria-disabled="true"
                                >
                                    {ficha}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={mapa.mapaId}
                                to={mapa.simulado ? `/mapas/${mapa.mapaId}/simulado` : `/mapas/${mapa.mapaId}`}
                                className={classe}
                                style={estilo}
                                aria-label={`${mapa.simulado ? "Simulado " : ""}${mapa.nome}${mapa.concluido ? " (concluído)" : ehAtual ? ` (mapa atual, ${porcentagem}% feito)` : ""}`}
                            >
                                {ficha}
                            </Link>
                        );
                    })}
                </div>
            )}
            </div>
        </section>
    );
};

export default Trilha;
