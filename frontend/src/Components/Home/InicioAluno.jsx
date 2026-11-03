import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import pessoa from "../../Assets/Images/pessoa.svg";
import Carregando from "../Carregando/Carregando.jsx";
import { OBJETIVOS, atividades, estatisticas, pontos, resumoDaSemana } from "../Perfil/perfilUtils.js";
import { mapaAtual, recomendacao } from "../Mapas/trilhaUtils.js";

const recompensas = [
    'Ganhe pontos ao completar exercícios;',
    'Desbloqueie níveis;',
    'Suba no ranking.',
];

const beneficios = [
    'Compreenda mais rapidamente',
    'Foco no que importa de verdade',
    'Não esqueça facilmente',
];

// Página inicial de quem é ALUNO: escolher por onde estudar, com o progresso real dele.
// Os dados vêm do GET /perfil (o mesmo da página de perfil).
const InicioAluno = ({ sair }) => {
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [salvandoObjetivo, setSalvandoObjetivo] = useState(null);

    useEffect(() => {
        const buscar = async () => {
            try {
                const resposta = await api.get('/perfil', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
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

    // Salva o objetivo no perfil (antes a escolha se perdia ao sair da página)
    const escolherObjetivo = async (chave) => {
        setSalvandoObjetivo(chave);
        try {
            const resposta = await api.patch('/perfil', { objetivo: chave }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPerfil((atual) => ({ ...atual, usuario: resposta.data.usuario }));
        } catch (error) {
            console.log(error.message);
        } finally {
            setSalvandoObjetivo(null);
        }
    };

    if (!perfil) {
        return <Carregando pagina texto="Carregando seu início" />;
    }

    const temDados = !perfil.erro;
    const lista = temDados ? atividades(perfil) : [];
    const stats = temDados ? estatisticas(perfil, lista) : null;
    const semana = temDados ? resumoDaSemana(lista) : null;
    const primeiroNome = temDados ? perfil.usuario.nome.trim().split(/\s+/)[0] : '';
    const jaComecou = temDados && lista.length > 0;
    const proximoPasso = temDados ? recomendacao(perfil.mapas, niveis, null) : null;

    // Nível em que o aluno está: o primeiro que ainda tem mapa pra fazer
    const doNivel = (chave) => (temDados ? perfil.mapas.filter((m) => m.nivel === chave) : []);
    const nivelAtual = niveis.find((n) => mapaAtual(doNivel(n.chave)))?.chave;

    return (
        <>
            <div className='homeCentro'>
                <header className='homeCabecalho'>
                    <h1>
                        {primeiroNome ? `${jaComecou ? 'Bem-vindo(a) de volta' : 'Bem-vindo(a)'}, ${primeiroNome}!` : <>Bem-vindo(a) ao Helpy<span className='homeMath'>Math</span>!</>}
                    </h1>
                    <p>{jaComecou ? 'Continue de onde parou ou escolha outro nível.' : 'Vamos encontrar seu nível ideal!'}</p>

                    <Link to='/perfil' className='homeConfig' aria-label='Meu perfil e configurações' title='Meu perfil e configurações'>
                        <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                            <circle cx='12' cy='12' r='3' />
                            <path d='M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
                        </svg>
                    </Link>
                </header>

                {/* Quem já começou ganha um atalho direto pro próximo passo (o mesmo que o Helpy sugere) */}
                {jaComecou && proximoPasso?.acao && (
                    <section className='homeContinuar'>
                        <p>
                            {proximoPasso.mensagem.map((pedaco, i) => (pedaco.destaque ? <strong key={i}>{pedaco.texto}</strong> : <span key={i}>{pedaco.texto}</span>))}
                        </p>
                        <Link to={proximoPasso.acao.para} className='homeContinuarBotao'>{proximoPasso.acao.rotulo} →</Link>
                    </section>
                )}

                <section className='homeSecao'>
                    <h2>{jaComecou ? 'Seus níveis' : 'Por onde quer começar sua jornada?'}</h2>

                    <div className='homeNiveis'>
                        {niveis.map((nivel) => {
                            const mapas = doNivel(nivel.chave);
                            const concluidos = mapas.filter((m) => m.concluido).length;

                            return (
                                <Link to={`/mapas?nivel=${nivel.chave}`} key={nivel.chave} className={`homeNivel nivel-${nivel.chave}`}>
                                    {nivel.chave === nivelAtual && jaComecou && <span className='homeNivelAqui'>Você está aqui</span>}
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

                    <small className='homeDica'>Você pode mudar isso depois!</small>
                </section>

                <section className='homeSecao'>
                    <h2>Por que você quer aprender?</h2>

                    <div className='homeObjetivos'>
                        {OBJETIVOS.map((item) => {
                            const ativo = perfil.usuario?.objetivo === item.chave;
                            return (
                                <button
                                    type='button'
                                    key={item.chave}
                                    className={ativo ? 'homeObjetivo ativo' : 'homeObjetivo'}
                                    aria-pressed={ativo}
                                    onClick={() => escolherObjetivo(ativo ? null : item.chave)}
                                    disabled={!temDados || salvandoObjetivo !== null}
                                >
                                    {salvandoObjetivo === item.chave ? <Carregando texto="Salvando" /> : item.nome}
                                </button>
                            );
                        })}
                    </div>
                    {perfil.usuario?.objetivo && <small className='homeDica'>Objetivo salvo no seu perfil. Clique de novo para desmarcar.</small>}
                </section>

                <section className='homeSecao'>
                    <h2>Já possui conhecimento prévio? Faça um teste diagnóstico!</h2>

                    {/* Ainda não existe: fica marcado como "em breve" em vez de um botão que não faz nada */}
                    <button type='button' className='homeDiagnostico' disabled title='Em breve'>Teste Diagnóstico · em breve</button>
                </section>

                <section className='homeBlocos'>
                    <div>
                        <h3>Recompensas:</h3>
                        <ul>
                            {recompensas.map((texto) => <li key={texto}>{texto}</li>)}
                        </ul>
                    </div>

                    <div>
                        <h3>Benefícios na prática:</h3>
                        <ul>
                            {beneficios.map((texto) => <li key={texto}>{texto}</li>)}
                        </ul>
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

                {/* Agora com os números de verdade (antes eram fixos em zero) */}
                <ul className='homePontuacao'>
                    <li><span aria-hidden='true'>🔥</span> Sequência: {stats ? stats.sequencia : 0} {stats?.sequencia === 1 ? 'dia' : 'dias'}</li>
                    <li><span aria-hidden='true'>⭐</span> Pontos: {stats ? pontos(stats) : 0}</li>
                    <li>
                        <span aria-hidden='true'>🎯</span> Meta: {semana ? semana.conteudosNaSemana : 0}/{perfil.usuario?.metaSemanal ?? 5} conteúdos na semana
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
