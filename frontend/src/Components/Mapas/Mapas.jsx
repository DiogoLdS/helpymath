import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import { decodificarToken } from "../../utils/auth.js";
import "./Mapas.css";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Sidebar from "../Sidebar/SidebarChapeu";
import Assistente from "./Assistente.jsx";
import Trilha from "./Trilha.jsx";
import { recomendacao } from "./trilhaUtils.js";
import Carregando from "../Carregando/Carregando.jsx";

// Página da trilha de estudos: o assistente "Helpy" no topo e, embaixo, cada nível como um caminho de mapas
const Mapas = () => {
    useTituloPagina("Sua trilha");

    // Cada mapa vem com { liberado, concluido, progresso } do usuário logado, na ordem da sequência
    const [mapas, setMapas] = useState([]);
    const [carregando, setCarregando] = useState(true);
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
            } finally {
                setCarregando(false);
            }
        };

        buscarMapas();
    }, []);

    const escolherNivel = (chave) => {
        setSearchParams(chave ? { nivel: chave } : {});
    };

    // Sem filtro mostra todos os níveis, cada um na sua trilha
    const niveisMostrados = nivelEscolhido ? niveis.filter((n) => n.chave === nivelEscolhido) : niveis;

    return (
        // Mesmo modelo do painel do aluno e do admin: barra lateral à esquerda e o painel ao lado
        <main className='mainMapas'>
            <Sidebar />

            <section className='mapasPainel'>
                <div className='mapasConteudo'>
                    <h1>Sua trilha de estudos</h1>

                    {!carregando && (
                        <Assistente nome={nome} recomendacao={recomendacao(mapas, niveis, nivelEscolhido)} />
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

                    {!carregando && niveisMostrados.map((n) => (
                        <Trilha
                            key={n.chave}
                            numero={niveis.indexOf(n) + 1}
                            nivel={n}
                            // Mapas antigos, sem nível salvo, entram como básico (mesmo padrão do banco)
                            mapas={mapas.filter((mapa) => (mapa.nivel ?? 'basico') === n.chave)}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
};

export default Mapas;
