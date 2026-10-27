import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import "./Mapas.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";

const Mapas = () => {
    useTituloPagina("Mapas conceituais");

    const [mapas, setMapas] = useState([]);
    const navigate = useNavigate();

    // A dificuldade escolhida fica na URL (/mapas?nivel=basico): os cards da página inicial já abrem filtrados
    const [searchParams, setSearchParams] = useSearchParams();
    const nivelEscolhido = niveis.some((n) => n.chave === searchParams.get('nivel'))
        ? searchParams.get('nivel')
        : null;

    useEffect(() => {
        const buscarMapas = async () => {
            const storedToken = localStorage.getItem('token');

            if (!storedToken) {
                navigate('/login');
                return;
            }

            try {
                const resposta = await api.get('/mapas', {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                setMapas(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                }
                console.log(error.message);
            }
        };

        buscarMapas();
    }, []);

    const escolherNivel = (chave) => {
        setSearchParams(chave ? { nivel: chave } : {});
    };

    // Sem filtro mostra todas as dificuldades, cada uma na sua seção
    const niveisMostrados = nivelEscolhido ? niveis.filter((n) => n.chave === nivelEscolhido) : niveis;

    return (
        <main className='mainMapas'>
            <Marca comLink />
            <h1>Mapas conceituais</h1>

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

            {mapas.length === 0 && <p>Nenhum mapa conceitual disponível.</p>}

            {mapas.length > 0 && niveisMostrados.map((n) => {
                // Mapas antigos, sem nível salvo, entram como básico (mesmo padrão do banco)
                const mapasDoNivel = mapas.filter((mapa) => (mapa.nivel ?? 'basico') === n.chave);

                return (
                    <section className='mapas-secao' key={n.chave}>
                        <h2 className={`mapas-secao-titulo nivel-${n.chave}`}>
                            {n.nome} <span>{n.descricao.toLowerCase()}</span>
                        </h2>

                        {mapasDoNivel.length === 0 ? (
                            <p className='mapas-vazio'>Nenhum mapa nesta dificuldade ainda.</p>
                        ) : (
                            <div className='mapas-grid'>
                                {mapasDoNivel.map((mapa) => (
                                    // Mapa trancado (precisa concluir o anterior do nível): cartão sem link
                                    mapa.liberado === false ? (
                                        <div key={mapa.mapaId} className='mapa-card mapa-card-trancado' aria-disabled='true'>
                                            <h2>{mapa.nome}</h2>
                                            <span className='mapa-card-status'>
                                                Conclua {mapa.anterior ? `"${mapa.anterior.nome}"` : 'o mapa anterior'} para liberar
                                            </span>
                                        </div>
                                    ) : (
                                        <Link to={`/mapas/${mapa.mapaId}`} key={mapa.mapaId} className={mapa.concluido ? 'mapa-card mapa-card-concluido' : 'mapa-card'}>
                                            <h2>{mapa.nome}</h2>
                                            {mapa.concluido && <span className='mapa-card-status'>✓ Concluído</span>}
                                        </Link>
                                    )
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}
        </main>
    );
};

export default Mapas;
