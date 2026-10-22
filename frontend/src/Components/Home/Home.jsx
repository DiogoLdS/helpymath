import { useEffect, useState } from "react";
import api from "../../../services/api.js";
import { Link, useNavigate } from "react-router";
import "./Home.css"
import Sidebar from "../Sidebar/SidebarChapeu";
import pessoa from "../../Assets/Images/pessoa.svg";
// Cards de nível (primeira seção da tela): cada um abre a lista de mapas daquela dificuldade
import niveis from "../../data/niveis.js";
import useTituloPagina from "../../utils/useTituloPagina.js";

const objetivos = ['Escola Regular', 'ENEM', 'Concursos Públicos'];

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

const Home = () => {
    useTituloPagina("Início");

    const navigate = useNavigate();

    // Objetivo de estudo escolhido na seção "Por que você quer aprender?"
    const [objetivo, setObjetivo] = useState(null);

    // Valores fixos por enquanto: o banco ainda não guarda sequência, pontos nem meta
    const pontuacao = { sequencia: 0, pontos: 0, meta: 0 };

    const authToken = async () => {
        // Pegando token salvo no localstorage
        const storedToken = localStorage.getItem('token');

        // Se não existir, a pessoa ainda não entrou: mostra a página de apresentação do site
        if (!storedToken) {
            navigate('/introducao');
            return;
        }

        //  Se auth funcionar, pode entrar na página principal
        try {
            const auth = await api.get('/auth',{
                headers: {
                    Authorization: `Bearer ${storedToken}`
                }
            })

            console.log(auth);
        }catch(error) {
            //  Se o token é inválido, voltar para o login
            navigate('/login');
            console.log(error.message);
        }
    }

    const sair = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

    useEffect(() => {
        //  Fazer requisição com api para ver se o token é valido
        authToken();
    },[])

    return (
        <main className='mainHome'>
            <Sidebar />

            <section className='home'>
                <div className='homeCentro'>
                    <header className='homeCabecalho'>
                        <h1>Bem-vindo(a) ao Helpy<span className='homeMath'>Math</span>!</h1>
                        <p>Vamos encontrar seu nível ideal!</p>

                        <button type='button' className='homeConfig' aria-label='Configurações'>
                            <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                                <circle cx='12' cy='12' r='3' />
                                <path d='M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
                            </svg>
                        </button>
                    </header>

                    <section className='homeSecao'>
                        <h2>Por onde quer começar sua jornada?</h2>

                        <div className='homeNiveis'>
                            {niveis.map((nivel) => (
                                <Link to={`/mapas?nivel=${nivel.chave}`} key={nivel.chave} className={`homeNivel nivel-${nivel.chave}`}>
                                    <strong>{nivel.titulo}</strong>
                                    <span>{nivel.descricao}</span>
                                </Link>
                            ))}
                        </div>

                        <small className='homeDica'>Você pode mudar isso depois!</small>
                    </section>

                    <section className='homeSecao'>
                        <h2>Por que você quer aprender?</h2>

                        <div className='homeObjetivos'>
                            {objetivos.map((item) => (
                                <button
                                    type='button'
                                    key={item}
                                    className={objetivo === item ? 'homeObjetivo ativo' : 'homeObjetivo'}
                                    aria-pressed={objetivo === item}
                                    onClick={() => setObjetivo(item)}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className='homeSecao'>
                        <h2>Já possui conhecimento prévio? Faça um teste diagnóstico!</h2>

                        <button type='button' className='homeDiagnostico'>Teste Diagnóstico</button>
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
                        <img src={pessoa} alt='Ícone de usuário' />
                        <button type='button' className='homeSair' onClick={sair}>Sair</button>
                    </div>

                    <h2>Pontuação:</h2>

                    <ul className='homePontuacao'>
                        <li><span aria-hidden='true'>🔥</span> Sequência: {pontuacao.sequencia} dias</li>
                        <li><span aria-hidden='true'>⭐</span> Pontos: {pontuacao.pontos}</li>
                        <li><span aria-hidden='true'>🎯</span> Meta: {pontuacao.meta} exercícios por dia</li>
                    </ul>

                    <hr />
                </aside>
            </section>
        </main>
    )
}

export default Home;