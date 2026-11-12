import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import Carregando from "../Carregando/Carregando.jsx";
import {
    DIAS, atividades, chaveDoDia, conquistas, estatisticas, formatarData, iniciais,
    objetivoDe, pontos, recomendacoes, resumoDaSemana,
} from "../Perfil/perfilUtils.js";
import { mapaAtual, recomendacao, saudacao } from "../Mapas/trilhaUtils.js";
import { TextoComFormulas } from "../Formulas/Formula.jsx";
import { formulasNaLinha } from "../Formulas/formulaUtils.js";
import { MEDALHAS } from "../Ranking/rankingUtils.js";
import "./InicioAluno.css";

// Uma curiosidade por dia (muda à meia-noite), pra página ter algo novo toda vez que o aluno volta
const CURIOSIDADES = [
    "O símbolo de igual (=) foi criado pelo matemático galês Robert Recorde, em 1557.",
    "Em um grupo de 23 pessoas, a chance de duas fazerem aniversário no mesmo dia já passa de 50%.",
    "Existem infinitos números primos: Euclides provou isso há mais de 2 mil anos.",
    "1 + 2 + 3 + ... + 100 = 5050. O truque: somar as pontas (1 + 100, 2 + 99...) dá 50 pares de 101.",
    "O π é irracional: suas casas decimais nunca terminam e nunca se repetem.",
    "Um googol é o número 1 seguido de 100 zeros, ou seja, 10 elevado a 100.",
    "Todo número par maior que 2 parece ser a soma de dois primos (Conjectura de Goldbach), mas ninguém conseguiu provar ainda.",
    "A soma dos ângulos internos de qualquer triângulo no plano é sempre 180°.",
    "Qualquer número multiplicado por 9 tem a soma dos algarismos divisível por 9: 9 × 47 = 423, e 4 + 2 + 3 = 9.",
    "O zero como número, com regras para fazer contas com ele, foi descrito pelo matemático indiano Brahmagupta no século VII.",
];

const UM_DIA = 24 * 60 * 60 * 1000;

// A curiosidade de hoje (a mesma o dia todo, outra amanhã)
function curiosidadeDoDia(agora = new Date()) {
    const dia = Math.floor(new Date(agora).setHours(0, 0, 0, 0) / UM_DIA);
    return CURIOSIDADES[dia % CURIOSIDADES.length];
}

// "hoje", "ontem", "há 3 dias" ou a data
function quando(data, agora = new Date()) {
    const dias = Math.floor((new Date(agora).setHours(0, 0, 0, 0) - new Date(data).setHours(0, 0, 0, 0)) / UM_DIA);
    if (dias <= 0) return "hoje";
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    return formatarData(data);
}

// Página inicial de quem é ALUNO: o painel de estudos.
// O objetivo, o nível e a meta são respondidos uma vez nas boas-vindas (/boas-vindas), logo depois do cadastro.
// Aqui fica tudo o que importa pra continuar: o Helpy com o próximo passo, os números, o que falta,
// o plano por nível, a semana, o cronograma de hoje, as próximas conquistas e o que o aluno fez por último.
// Os dados vêm do GET /perfil (o mesmo da página de perfil).
const InicioAluno = ({ sair }) => {
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);

    useEffect(() => {
        const buscar = async () => {
            try {
                const resposta = await api.get('/perfil', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                // Quem ainda não respondeu as perguntas de boas-vindas vai pra lá primeiro
                if (!resposta.data.usuario?.boasVindasEm) {
                    navigate('/boas-vindas', { replace: true });
                    return;
                }
                setPerfil(resposta.data);
            } catch (error) {
                //  Se o token é inválido, voltar para o login
                if (error.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                console.log(error.message);
                setPerfil({ erro: true });
            }
        };
        buscar();
    }, [navigate]);

    // Ranking da semana (cartão do lado). Se der erro, o cartão só não aparece.
    const [ranking, setRanking] = useState(null);
    useEffect(() => {
        api.get('/ranking', { params: { periodo: 'semana' }, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            .then((resposta) => { if (Array.isArray(resposta.data?.top)) setRanking(resposta.data); })
            .catch((error) => console.log(error.message));
    }, []);

    if (!perfil) {
        return <Carregando pagina texto="Carregando seu início" />;
    }

    if (perfil.erro) {
        return (
            <div className='homeCentro'>
                <p className='iaErro'>Não foi possível carregar seu início agora. Tente recarregar a página em instantes.</p>
                <Link to='/mapas' className='iaBotao'>Ir para os mapas →</Link>
            </div>
        );
    }

    // ---------- Contas (tudo sai do GET /perfil) ----------
    const usuario = perfil.usuario;
    const lista = atividades(perfil);
    const stats = estatisticas(perfil, lista);
    const semana = resumoDaSemana(lista);
    const primeiroNome = usuario.nome.trim().split(/\s+/)[0];
    const jaComecou = lista.length > 0;

    const objetivo = objetivoDe(usuario.objetivo);
    const meuNivel = usuario.nivel;
    const indiceMeuNivel = niveis.findIndex((n) => n.chave === meuNivel);
    const meta = usuario.metaSemanal ?? 5;
    const metaBatida = semana.conteudosNaSemana >= meta;

    // O próximo passo (o mesmo que o Helpy sugere na trilha), a partir do nível do aluno
    const proximoPasso = recomendacao(perfil.mapas, niveis, null, meuNivel);
    const doNivel = (chave) => perfil.mapas.filter((m) => m.nivel === chave);
    const paraRevisar = recomendacoes(perfil.mapas).filter((r) => r.tipo === 'revisar').slice(0, 3);
    const treino = doNivel('treino');
    const treinoAtual = mapaAtual(treino);
    const pendentes = perfil.conteudosPendentes.slice(0, 4);

    // Semana: barrinhas de segunda a domingo
    const hoje = chaveDoDia(new Date());
    const maiorDia = Math.max(1, ...Object.values(semana.porDia));
    const planoDeHoje = usuario.cronograma?.[hoje]?.trim();

    // Conquistas: quantas já tem e as 3 mais perto de conseguir
    const medalhas = conquistas(perfil, stats, metaBatida);
    const conquistadas = medalhas.filter((c) => c.conquistada).length;
    const proximas = medalhas
        .filter((c) => !c.conquistada)
        .sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)
        .slice(0, 3);

    const curiosidade = curiosidadeDoDia();

    // Etiqueta de cada nível no plano
    const etiqueta = (nivel, i) => {
        if (nivel.chave === meuNivel) return 'Seu nível';
        if (nivel.chave === 'treino') return objetivo?.treino ? 'Recomendado' : 'Simulados';
        if (indiceMeuNivel >= 0 && i < indiceMeuNivel) return 'Revisão';
        if (indiceMeuNivel >= 0 && i > indiceMeuNivel) return 'Depois';
        return null;
    };

    return (
        <>
            <div className='homeCentro iaCentro'>
                {/* ---------- Helpy: saudação e próximo passo ---------- */}
                <section className='iaHelpy' aria-label='Helpy, seu assistente de estudos'>
                    <div className='iaHelpyTopo'>
                        <span className='iaHelpyAvatar' aria-hidden='true'>π</span>
                        <div>
                            <h1>{saudacao()}, {primeiroNome}!</h1>
                            <span className='iaHelpyCargo'>Helpy, seu assistente de estudos</span>
                        </div>
                        <Link to='/perfil' className='homeConfig iaConfig' aria-label='Meu perfil e configurações' title='Meu perfil e configurações'>
                            <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                <circle cx='12' cy='12' r='3' />
                                <path d='M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
                            </svg>
                        </Link>
                    </div>

                    <p className='iaHelpyFala'>
                        {proximoPasso.mensagem.map((pedaco, i) => (pedaco.destaque ? <strong key={i}>{pedaco.texto}</strong> : <span key={i}>{pedaco.texto}</span>))}
                    </p>
                    {proximoPasso.acao && (
                        <Link to={proximoPasso.acao.para} className='iaBotao iaBotaoGrande'>{proximoPasso.acao.rotulo} →</Link>
                    )}

                    {/* Resumo das respostas das boas-vindas, com atalho pra mudar */}
                    <div className='iaPlano'>
                        <span><small>Objetivo</small>{objetivo?.nome ?? 'Não definido'}</span>
                        <span><small>Nível</small>{niveis.find((n) => n.chave === meuNivel)?.nome ?? 'Não definido'}</span>
                        <span><small>Meta</small>{meta} por semana</span>
                        <Link to='/boas-vindas'>Mudar respostas</Link>
                    </div>
                </section>

                {/* ---------- Números ---------- */}
                <ul className='iaNumeros'>
                    <li className='iaNumeroFogo'>
                        <span aria-hidden='true'>🔥</span>
                        <strong>{stats.sequencia}</strong>
                        <small>{stats.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</small>
                    </li>
                    <li className='iaNumeroPontos'>
                        <span aria-hidden='true'>⭐</span>
                        <strong>{pontos(stats)}</strong>
                        <small>pontos</small>
                    </li>
                    <li className='iaNumeroMapas'>
                        <span aria-hidden='true'>🗺️</span>
                        <strong>{stats.mapasConcluidos}/{stats.mapasTotal}</strong>
                        <small>mapas concluídos</small>
                    </li>
                    <li className='iaNumeroAcerto'>
                        <span aria-hidden='true'>🎯</span>
                        <strong>{stats.taxaAcerto === null ? '–' : `${stats.taxaAcerto}%`}</strong>
                        <small>de acerto nas questões</small>
                    </li>
                </ul>

                {/* ---------- Continue estudando: conteúdos que faltam nos mapas liberados ---------- */}
                <section className='iaBloco'>
                    <div className='iaBlocoTitulo'>
                        <h2>Continue estudando</h2>
                        <Link to='/mapas'>Ver a trilha →</Link>
                    </div>
                    {pendentes.length === 0 ? (
                        <p className='iaVazio'>
                            {perfil.mapas.length === 0
                                ? 'Ainda não há mapas cadastrados. Assim que aparecerem, eles ficam aqui.'
                                : 'Nenhum conteúdo pendente nos mapas liberados. Faça as questões para concluir os mapas e liberar os próximos!'}
                        </p>
                    ) : (
                        <ul className='iaPendentes'>
                            {pendentes.map((c) => (
                                <li key={`${c.mapa.mapaId}-${c.conteudoId}`}>
                                    <Link to={`/mapas/${c.mapa.mapaId}`}>
                                        <span className='iaPendenteIcone' aria-hidden='true'>▶</span>
                                        <span>
                                            <strong>{c.titulo}</strong>
                                            <small>{c.mapa.nome}</small>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* ---------- ENEM e concursos: o Treino entra no plano toda semana ---------- */}
                {objetivo?.treino && treino.length > 0 && (
                    <section className='iaTreino'>
                        <p>
                            <strong>Treino da semana:</strong>{' '}
                            {treinoAtual
                                ? <>faça o simulado <strong>{treinoAtual.nome}</strong>, no estilo {objetivo.chave === 'enem' ? 'do ENEM' : 'das provas de concurso'}.</>
                                : 'você já fez todos os simulados. Refaça os que errou!'}
                        </p>
                        <Link to={treinoAtual ? `/mapas/${treinoAtual.mapaId}` : '/mapas?nivel=treino'} className='iaBotao'>
                            {treinoAtual ? 'Ir para o Treino' : 'Ver o Treino'} →
                        </Link>
                    </section>
                )}

                {paraRevisar.length > 0 && (
                    <section className='iaBloco'>
                        <div className='iaBlocoTitulo'>
                            <h2>Para revisar</h2>
                            <Link to='/revisar'>Refazer as questões erradas →</Link>
                        </div>
                        <ul className='iaRevisar'>
                            {paraRevisar.map((r) => (
                                <li key={r.mapa.mapaId}>
                                    <span><strong>{r.mapa.nome}</strong> · {r.motivo}</span>
                                    <Link to={r.para}>{r.acao}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ---------- Plano por nível ---------- */}
                <section className='iaBloco'>
                    <div className='iaBlocoTitulo'><h2>Seu plano de estudos</h2></div>
                    {objetivo && <p className='iaDica'><strong>Dica para {objetivo.nome}:</strong> {objetivo.dica}</p>}

                    <div className='homeNiveis'>
                        {niveis.map((nivel, i) => {
                            const mapas = doNivel(nivel.chave);
                            const concluidos = mapas.filter((m) => m.concluido).length;
                            const tag = etiqueta(nivel, i);
                            const meu = nivel.chave === meuNivel;

                            return (
                                <Link to={`/mapas?nivel=${nivel.chave}`} key={nivel.chave} className={meu ? `homeNivel nivel-${nivel.chave} homeNivelMeu` : `homeNivel nivel-${nivel.chave}`}>
                                    {tag && <span className={meu ? 'homeNivelAqui' : 'homeNivelAqui homeNivelTag'}>{tag}</span>}
                                    <strong>{nivel.titulo}</strong>
                                    <span>{nivel.descricao}</span>
                                    {mapas.length === 0
                                        ? <span className='homeNivelProgresso'>Em breve</span>
                                        : (
                                            <span className='homeNivelProgresso'>
                                                {concluidos} de {mapas.length} {mapas.length === 1 ? 'mapa' : 'mapas'}
                                                <span className='homeNivelBarra'><span style={{ width: `${(concluidos / mapas.length) * 100}%` }} /></span>
                                            </span>
                                        )}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* ---------- O que o aluno fez por último ---------- */}
                <section className='iaBloco'>
                    <div className='iaBlocoTitulo'>
                        <h2>Atividade recente</h2>
                        {jaComecou && <Link to='/perfil'>Histórico completo →</Link>}
                    </div>
                    {!jaComecou ? (
                        <p className='iaVazio'>Suas atividades aparecem aqui: cada conteúdo concluído e cada questão respondida.</p>
                    ) : (
                        <ul className='iaAtividades'>
                            {lista.slice(0, 5).map((a, i) => (
                                <li key={i} className={a.tipo === 'questao' ? (a.correta ? 'certa' : 'errada') : 'conteudo'}>
                                    <span className='iaAtividadeIcone' aria-hidden='true'>
                                        {a.tipo === 'conteudo' ? '✓' : a.correta ? '★' : '✗'}
                                    </span>
                                    <span className='iaAtividadeTexto'>
                                        <strong>{a.tipo === 'conteudo' ? 'Concluiu' : a.correta ? 'Acertou' : 'Errou'}</strong>{' '}
                                        <TextoComFormulas texto={formulasNaLinha(a.titulo ?? '')} />
                                        {a.mapa && <small> · {a.mapa.nome}</small>}
                                    </span>
                                    <span className='iaAtividadeQuando'>{quando(a.data)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* ---------- Curiosidade do dia ---------- */}
                <aside className='iaCuriosidade'>
                    <span>Você sabia?</span>
                    <p>{curiosidade}</p>
                </aside>
            </div>

            {/* ---------- Coluna da direita: você, sua semana e conquistas ---------- */}
            <aside className='homeLateral iaLateral'>
                <div className='iaEu'>
                    <Link to='/perfil' className='iaAvatar' title='Meu perfil'>{iniciais(usuario.nome)}</Link>
                    <div>
                        <strong>{usuario.nome}</strong>
                        <Link to='/perfil'>Ver meu perfil →</Link>
                    </div>
                    <button type='button' className='homeSair' onClick={sair}>Sair</button>
                </div>

                <section className='iaCartao'>
                    <h2>Meta da semana</h2>
                    <div className='iaMeta'>
                        <div
                            className={metaBatida ? 'iaAnel batida' : 'iaAnel'}
                            style={{ '--progresso': `${Math.min(semana.conteudosNaSemana / meta, 1) * 360}deg` }}
                        >
                            <span><strong>{semana.conteudosNaSemana}</strong>/{meta}</span>
                        </div>
                        <p>
                            {metaBatida
                                ? 'Meta batida! Tudo que vier agora é bônus.'
                                : `Faltam ${meta - semana.conteudosNaSemana} ${meta - semana.conteudosNaSemana === 1 ? 'conteúdo' : 'conteúdos'} para bater a meta desta semana.`}
                        </p>
                    </div>

                    {/* Atividades por dia (conteúdos + questões), de segunda a domingo */}
                    <div className='iaDias' aria-label='Atividades por dia nesta semana'>
                        {DIAS.map((d) => (
                            <div key={d.chave} className={d.chave === hoje ? 'iaDia hoje' : 'iaDia'} title={`${d.nome}: ${semana.porDia[d.chave]} atividades`}>
                                <span className='iaDiaBarra'><span style={{ height: `${(semana.porDia[d.chave] / maiorDia) * 100}%` }} /></span>
                                <small>{d.curto[0]}</small>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ranking da semana: os 3 primeiros e a sua posição */}
                {ranking && (
                    <section className='iaCartao'>
                        <h2>Ranking da semana</h2>
                        {ranking.top.length === 0 ? (
                            <p className='iaHoje vazio'>Ninguém pontuou nesta semana ainda. Seja o primeiro!</p>
                        ) : (
                            <ol className='iaRanking'>
                                {ranking.top.slice(0, 3).map((a, i) => (
                                    <li key={i} className={a.voce ? 'voce' : undefined}>
                                        <span aria-label={`${a.posicao}º lugar`}>{MEDALHAS[a.posicao] ?? `${a.posicao}º`}</span>
                                        <strong>{a.voce ? 'Você' : a.nome}</strong>
                                        <em>{a.pontos} pts</em>
                                    </li>
                                ))}
                            </ol>
                        )}
                        <p className='iaRankingEu'>
                            {ranking.eu
                                ? `Você está em ${ranking.eu.posicao}º lugar, com ${ranking.eu.pontos} pontos nesta semana.`
                                : 'Conclua um conteúdo ou acerte uma questão para entrar no ranking.'}
                        </p>
                        <Link to='/ranking' className='iaLinkClaro'>Ver o ranking completo →</Link>
                    </section>
                )}

                <section className='iaCartao'>
                    <h2>Hoje no cronograma</h2>
                    {planoDeHoje
                        ? <p className='iaHoje'>{planoDeHoje}</p>
                        : <p className='iaHoje vazio'>Nada planejado para hoje.</p>}
                    <Link to='/perfil' className='iaLinkClaro'>{planoDeHoje ? 'Ver a semana' : 'Planejar minha semana'} →</Link>
                </section>

                <section className='iaCartao'>
                    <h2>Conquistas <small>{conquistadas}/{medalhas.length}</small></h2>
                    {proximas.length === 0 ? (
                        <p className='iaHoje'>Você conseguiu todas as conquistas!</p>
                    ) : (
                        <ul className='iaConquistas'>
                            {proximas.map((c) => (
                                <li key={c.id}>
                                    <span className='iaMedalha' aria-hidden='true'>{c.simbolo}</span>
                                    <div>
                                        <strong>{c.titulo}</strong>
                                        <small>{c.descricao}</small>
                                        <span className='iaMiniBarra'><span style={{ width: `${(c.atual / c.alvo) * 100}%` }} /></span>
                                    </div>
                                    <em>{c.atual}/{c.alvo}</em>
                                </li>
                            ))}
                        </ul>
                    )}
                    <small className='iaPontosDica'>10 pontos por conteúdo concluído e 5 por questão certa.</small>
                </section>
            </aside>
        </>
    );
};

export default InicioAluno;
