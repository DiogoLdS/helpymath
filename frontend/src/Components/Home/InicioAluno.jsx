import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import pessoa from "../../Assets/Images/pessoa.svg";
import Carregando from "../Carregando/Carregando.jsx";
import { atividades, estatisticas, objetivoDe, pontos, recomendacoes, resumoDaSemana } from "../Perfil/perfilUtils.js";
import { mapaAtual, recomendacao } from "../Mapas/trilhaUtils.js";

// Página inicial de quem é ALUNO: tudo o que ele precisa pra continuar estudando.
// O objetivo, o nível e a meta são respondidos uma vez nas boas-vindas (/boas-vindas), logo depois do cadastro;
// aqui aparece o plano montado a partir dessas respostas. Os dados vêm do GET /perfil (o mesmo da página de perfil).
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
                // Sem os dados, a página ainda funciona como antes (só sem o progresso)
                setPerfil({ erro: true });
            }
        };
        buscar();
    }, [navigate]);

    if (!perfil) {
        return <Carregando pagina texto="Carregando seu início" />;
    }

    const temDados = !perfil.erro;
    const lista = temDados ? atividades(perfil) : [];
    const stats = temDados ? estatisticas(perfil, lista) : null;
    const semana = temDados ? resumoDaSemana(lista) : null;
    const primeiroNome = temDados ? perfil.usuario.nome.trim().split(/\s+/)[0] : '';
    const jaComecou = temDados && lista.length > 0;

    // Respostas das boas-vindas
    const objetivo = temDados ? objetivoDe(perfil.usuario.objetivo) : null;
    const meuNivel = temDados ? perfil.usuario.nivel : null;
    const indiceMeuNivel = niveis.findIndex((n) => n.chave === meuNivel);
    const meta = perfil.usuario?.metaSemanal ?? 5;

    // O próximo passo (o mesmo que o Helpy sugere na trilha), a partir do nível do aluno
    const proximoPasso = temDados ? recomendacao(perfil.mapas, niveis, null, meuNivel) : null;
    const doNivel = (chave) => (temDados ? perfil.mapas.filter((m) => m.nivel === chave) : []);
    const paraRevisar = temDados ? recomendacoes(perfil.mapas).filter((r) => r.tipo === 'revisar').slice(0, 3) : [];
    const treino = doNivel('treino');
    const treinoAtual = mapaAtual(treino);

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
            <div className='homeCentro'>
                <header className='homeCabecalho'>
                    <h1>
                        {primeiroNome ? `${jaComecou ? 'Bem-vindo(a) de volta' : 'Bem-vindo(a)'}, ${primeiroNome}!` : <>Bem-vindo(a) ao Helpy<span className='homeMath'>Math</span>!</>}
                    </h1>
                    <p>{jaComecou ? 'Continue de onde parou.' : 'Seu plano está pronto. Bora dar o primeiro passo?'}</p>

                    <Link to='/perfil' className='homeConfig' aria-label='Meu perfil e configurações' title='Meu perfil e configurações'>
                        <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                            <circle cx='12' cy='12' r='3' />
                            <path d='M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
                        </svg>
                    </Link>
                </header>

                {/* Resumo das respostas das boas-vindas, com atalho pra mudar */}
                {temDados && (
                    <div className='homePlano'>
                        <span><small>Objetivo</small>{objetivo?.nome ?? 'Não definido'}</span>
                        <span><small>Nível</small>{niveis.find((n) => n.chave === meuNivel)?.nome ?? 'Não definido'}</span>
                        <span><small>Meta</small>{semana.conteudosNaSemana}/{meta} na semana</span>
                        <Link to='/boas-vindas'>Mudar respostas</Link>
                    </div>
                )}

                {/* O próximo passo, sempre em destaque */}
                {proximoPasso?.acao && (
                    <section className='homeContinuar'>
                        <p>
                            {proximoPasso.mensagem.map((pedaco, i) => (pedaco.destaque ? <strong key={i}>{pedaco.texto}</strong> : <span key={i}>{pedaco.texto}</span>))}
                        </p>
                        <Link to={proximoPasso.acao.para} className='homeContinuarBotao'>{proximoPasso.acao.rotulo} →</Link>
                    </section>
                )}

                {/* ENEM e concursos: o Treino (simulados) entra no plano toda semana */}
                {objetivo?.treino && treino.length > 0 && (
                    <section className='homeContinuar homeTreino'>
                        <p>
                            <strong>Treino da semana:</strong>{' '}
                            {treinoAtual
                                ? <>faça o simulado <strong>{treinoAtual.nome}</strong>, no estilo {objetivo.chave === 'enem' ? 'do ENEM' : 'das provas de concurso'}.</>
                                : 'você já fez todos os simulados. Refaça os que errou!'}
                        </p>
                        <Link to={treinoAtual ? `/mapas/${treinoAtual.mapaId}` : '/mapas?nivel=treino'} className='homeContinuarBotao'>
                            {treinoAtual ? 'Ir para o Treino' : 'Ver o Treino'} →
                        </Link>
                    </section>
                )}

                {objetivo && <p className='homeDicaObjetivo'><strong>Dica para {objetivo.nome}:</strong> {objetivo.dica}</p>}

                {paraRevisar.length > 0 && (
                    <section className='homeSecao'>
                        <h2>Para revisar</h2>
                        <ul className='homeRevisar'>
                            {paraRevisar.map((r) => (
                                <li key={r.mapa.mapaId}>
                                    <span><strong>{r.mapa.nome}</strong> · {r.motivo}</span>
                                    <Link to={r.para}>{r.acao}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className='homeSecao'>
                    <h2>Seu plano de estudos</h2>

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
                                    {temDados && (
                                        mapas.length === 0
                                            ? <span className='homeNivelProgresso'>Em breve</span>
                                            : (
                                                <span className='homeNivelProgresso'>
                                                    {concluidos} de {mapas.length} {mapas.length === 1 ? 'mapa' : 'mapas'}
                                                    <span className='homeNivelBarra'><span style={{ width: `${(concluidos / mapas.length) * 100}%` }} /></span>
                                                </span>
                                            )
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <blockquote className='homeCitacao'>
                    “A matemática pura é, à sua maneira, a poesia das ideias lógicas.”
                    <cite>Albert Einstein</cite>
                </blockquote>
            </div>

            <aside className='homeLateral'>
                <div className='homeUsuario'>
                    <Link to='/perfil' title='Meu perfil'><img src={pessoa} alt='Meu perfil' /></Link>
                    <button type='button' className='homeSair' onClick={sair}>Sair</button>
                </div>

                <h2>Pontuação:</h2>

                <ul className='homePontuacao'>
                    <li><span aria-hidden='true'>🔥</span> Sequência: {stats ? stats.sequencia : 0} {stats?.sequencia === 1 ? 'dia' : 'dias'}</li>
                    <li><span aria-hidden='true'>⭐</span> Pontos: {stats ? pontos(stats) : 0}</li>
                    <li>
                        <span aria-hidden='true'>🎯</span> Meta: {semana ? semana.conteudosNaSemana : 0}/{meta} conteúdos na semana
                    </li>
                </ul>
                <small className='homePontosDica'>10 pontos por conteúdo concluído e 5 por questão certa.</small>

                <Link to='/perfil' className='homeLateralLink'>Ver meu perfil completo →</Link>

                <hr />
            </aside>
        </>
    );
};

export default InicioAluno;
