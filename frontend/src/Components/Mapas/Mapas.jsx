import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import { decodificarToken, ehVisitante } from "../../utils/auth.js";
import AvisoVisitante from "../Visitante/AvisoVisitante.jsx";
import "./Mapas.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import Assistente from "./Assistente.jsx";
import Trilha from "./Trilha.jsx";
import { recomendacao } from "./trilhaUtils.js";
import { buscarMapas } from "./buscaUtils.js";
import { desbloqueiosNovos } from "./desbloqueioUtils.js";
import Carregando from "../Carregando/Carregando.jsx";

// Página da trilha de estudos: o assistente "Helpy" no topo e, embaixo, cada nível como um caminho de mapas
const Mapas = () => {
    // Visitante (sem conta): vê todos os mapas liberados, sem o Helpy e sem progresso
    const visitante = ehVisitante();
    useTituloPagina(visitante ? "Mapas" : "Sua trilha");

    // Cada mapa vem com { liberado, concluido, progresso } do usuário logado, na ordem da sequência
    const [mapas, setMapas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    // Nível do aluno (respondido nas boas-vindas): o Helpy começa a recomendar por ele
    const [nivelPreferido, setNivelPreferido] = useState(null);
    // Mapas desbloqueados desde a última visita: o cadeado deles abre na trilha (uma vez só)
    const [abrindo, setAbrindo] = useState([]);
    const navigate = useNavigate();

    // A dificuldade escolhida fica na URL (/mapas?nivel=basico): os cards da página inicial já abrem filtrados
    const [searchParams, setSearchParams] = useSearchParams();
    const nivelEscolhido = niveis.some((n) => n.chave === searchParams.get('nivel'))
        ? searchParams.get('nivel')
        : null;

    // Nome do aluno pro assistente cumprimentar (vem do token de login)
    const nome = decodificarToken(localStorage.getItem('token') ?? '')?.nome ?? '';

    useEffect(() => {
        const buscarMapas = async () => {
            const storedToken = localStorage.getItem('token');

            try {
                // Sem token vai sem cabeçalho: o backend responde como visitante
                const resposta = await api.get('/mapas', {
                    headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {}
                });

                const lista = Array.isArray(resposta.data) ? resposta.data : [];
                setMapas(lista);

                // Mapa desbloqueado desde a última visita: anima o cadeado abrindo (admin vê tudo liberado, não conta)
                // (só troca se veio algo: uma 2ª busca já veria tudo como visto e apagaria a animação)
                if (storedToken && !decodificarToken(storedToken)?.admin) {
                    const novos = desbloqueiosNovos(lista).map((m) => m.mapaId);
                    if (novos.length > 0) setAbrindo(novos);
                }

                // Se falhar, a trilha funciona igual (só recomenda a partir do Básico)
                if (storedToken) api.get('/me', { headers: { Authorization: `Bearer ${storedToken}` } })
                    .then((r) => setNivelPreferido(r.data?.nivel ?? null))
                    .catch(() => {});
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                console.log(error.message);
            } finally {
                setCarregando(false);
            }
        };

        buscarMapas();
    }, []);

    // Leva a tela até o cadeado que vai abrir (se estiver lá embaixo, o aluno nem veria)
    useEffect(() => {
        if (carregando || abrindo.length === 0) return;
        const suave = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        document.querySelector('.trilhaMapa.abrindo')?.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' });
    }, [carregando, abrindo]);

    const escolherNivel = (chave) => {
        setSearchParams(chave ? { nivel: chave } : {});
    };

    // Busca de mapas (nome e conteúdos). Respeita o filtro de nível escolhido.
    const [busca, setBusca] = useState('');
    const resultados = buscarMapas(
        nivelEscolhido ? mapas.filter((m) => (m.nivel ?? 'basico') === nivelEscolhido) : mapas,
        busca
    );

    // Sem filtro mostra todos os níveis, cada um na sua trilha
    const niveisMostrados = nivelEscolhido ? niveis.filter((n) => n.chave === nivelEscolhido) : niveis;

    return (
        // Mesmo modelo do painel do aluno e do admin: barra lateral à esquerda e o painel ao lado
        <main className='mainMapas'>
            <Sidebar />

            <section className='mapasPainel'>
                <div className='mapasConteudo'>
                    <h1>{visitante ? 'Explore os mapas' : 'Sua trilha de estudos'}</h1>

                    {visitante && <AvisoVisitante />}

                    {!carregando && !visitante && (
                        <Assistente nome={nome} recomendacao={recomendacao(mapas, niveis, nivelEscolhido, nivelPreferido)} />
                    )}

                    {/* Busca: procura no nome do mapa e nos conteúdos dele */}
                    <div className='mapas-busca'>
                        <label htmlFor='busca-mapas' className='sr-only'>Buscar mapas</label>
                        <span aria-hidden='true'>🔍</span>
                        <input
                            id='busca-mapas'
                            type='search'
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder='Buscar mapa ou assunto (ex: fração, porcentagem)'
                            autoComplete='off'
                        />
                        {busca && (
                            <button type='button' onClick={() => setBusca('')} aria-label='Limpar busca'>×</button>
                        )}
                    </div>

                    {busca.trim() && !carregando && (
                        <section className='mapas-resultados' aria-live='polite'>
                            <h2>
                                {resultados.length === 0
                                    ? `Nenhum mapa encontrado para "${busca.trim()}"`
                                    : `${resultados.length} ${resultados.length === 1 ? 'mapa encontrado' : 'mapas encontrados'}`}
                            </h2>
                            {resultados.length === 0 && <p>Tente outra palavra, ou veja a trilha completa limpando a busca.</p>}
                            <ul>
                                {resultados.map(({ mapa, conteudos }) => {
                                    const estado = !mapa.liberado ? 'trancado' : mapa.concluido ? 'concluido' : 'livre';
                                    const rotulo = { trancado: '🔒 Bloqueado', concluido: '✓ Concluído', livre: '▶ Liberado' }[estado];
                                    const nivel = niveis.find((n) => n.chave === (mapa.nivel ?? 'basico'));
                                    const corpo = (
                                        <>
                                            <strong>{mapa.nome}</strong>
                                            <span className='mapas-resultado-info'>{nivel?.nome} · {visitante ? 'Liberado' : rotulo}</span>
                                            {conteudos.length > 0 && (
                                                <span className='mapas-resultado-conteudos'>Fala de: {conteudos.slice(0, 3).join(', ')}</span>
                                            )}
                                            {!mapa.liberado && mapa.anterior && (
                                                <span className='mapas-resultado-conteudos'>Conclua "{mapa.anterior.nome}" para liberar.</span>
                                            )}
                                        </>
                                    );
                                    return (
                                        <li key={mapa.mapaId} className={`mapas-resultado ${estado}`}>
                                            {mapa.liberado ? <Link to={`/mapas/${mapa.mapaId}`}>{corpo}</Link> : <div>{corpo}</div>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    <div className='mapas-filtros' role='group' aria-label='Filtrar por dificuldade'>
                        <button
                            type='button'
                            className={!nivelEscolhido ? 'mapas-filtro ativo' : 'mapas-filtro'}
                            aria-pressed={!nivelEscolhido}
                            onClick={() => escolherNivel(null)}
                        >
                            Todos
                        </button>
                        {niveis.map((n) => (
                            <button
                                type='button'
                                key={n.chave}
                                className={nivelEscolhido === n.chave ? `mapas-filtro ativo nivel-${n.chave}` : `mapas-filtro nivel-${n.chave}`}
                                aria-pressed={nivelEscolhido === n.chave}
                                onClick={() => escolherNivel(n.chave)}
                            >
                                {n.nome}
                            </button>
                        ))}
                    </div>

                    {carregando && <Carregando pagina texto='Carregando sua trilha' />}

                    {!carregando && !busca.trim() && niveisMostrados.map((n) => (
                        <Trilha
                            key={n.chave}
                            numero={niveis.indexOf(n) + 1}
                            nivel={n}
                            // Mapas antigos, sem nível salvo, entram como básico (mesmo padrão do banco)
                            mapas={mapas.filter((mapa) => (mapa.nivel ?? 'basico') === n.chave)}
                            abrindo={abrindo}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
};

export default Mapas;
