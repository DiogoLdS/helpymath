import { useState } from "react";
import { Link } from "react-router";
import useTituloPagina from "../../utils/useTituloPagina.js";
import niveis from "../../data/niveis.js";
import Marca from "../Marca/Marca.jsx";
import { Formula } from "../Formulas/Formula.jsx";
import { TextoComMidia } from "../Midia/Midia.jsx";
// Fotos (Unsplash): quadro com fórmulas de Artturi Jalli e sala de aula de Vitaly Gariev.
// Versões reduzidas (1600px) das fotos originais, pra página carregar rápido.
import fotoQuadro from "../../Assets/Images/quadro-formulas.jpg";
import fotoSala from "../../Assets/Images/sala-de-aula.jpg";
import "./Introducao.css";

// Página pública de apresentação do HelpyMath (não precisa de login).
// Os textos seguem o TCC; o mapa e a questão de exemplo funcionam de verdade, só não usam o banco.

const destaques = [
    { valor: "100%", rotulo: "gratuito, sem anúncios" },
    { valor: "4", rotulo: "níveis de estudo" },
    { valor: "3", rotulo: "tipos de conteúdo nos mapas" },
    { valor: "ENEM", rotulo: "questões no estilo das provas" },
];

// Problemas levantados no TCC (seção 2.4, numerados de I a V como no texto) e como a plataforma responde a cada um
const problemas = [
    {
        icone: "I",
        problema: "Plataformas pagas",
        solucao: "O HelpyMath é gratuito: estudar não depende de quanto você pode pagar.",
    },
    {
        icone: "II",
        problema: "Sites confusos e textos enormes",
        solucao: "Os conteúdos ficam organizados em mapas visuais, em pedaços curtos e ligados entre si.",
    },
    {
        icone: "III",
        problema: "Anúncios e distrações",
        solucao: "Nada de propaganda no meio da explicação. Só você e o conteúdo.",
    },
    {
        icone: "IV",
        problema: "Falta de prática e interatividade",
        solucao: "Botões que se abrem, links para simulações e questões com resposta na hora.",
    },
    {
        icone: "V",
        problema: "Pouca aplicação de questões",
        solucao: "Cada mapa tem suas próprias questões, para fixar o que acabou de estudar.",
    },
];

const passos = [
    { titulo: "Crie sua conta", texto: "Só nome, e-mail e senha. Leva menos de um minuto." },
    { titulo: "Escolha seu nível", texto: "Básico, intermediário, avançado ou treino, e o seu objetivo de estudo." },
    { titulo: "Estude pelos mapas", texto: "Clique nos conteúdos do mapa e veja explicações, fórmulas, imagens e vídeos." },
    { titulo: "Pratique", texto: "Responda as questões do mapa e descubra na hora se acertou." },
];

const objetivos = [
    { titulo: "Escola regular", texto: "Reforço para as provas e os conteúdos do ensino fundamental e médio." },
    { titulo: "ENEM", texto: "Os assuntos que mais caem, com questões no estilo da prova." },
    { titulo: "Concursos públicos", texto: "Revisão objetiva da matemática cobrada em concursos." },
];

const recursos = [
    {
        icone: "∑",
        titulo: "Fórmulas de verdade",
        texto: "As fórmulas aparecem bem escritas, como no livro, e não como texto improvisado.",
        exemplo: <Formula latex="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" bloco />,
    },
    {
        icone: "▶",
        titulo: "Imagens e vídeos",
        texto: "Gráficos, figuras e vídeos do YouTube direto dentro da explicação do conteúdo.",
    },
    {
        icone: "⇩",
        titulo: "Imprima ou salve em PDF",
        texto: "Leve o mapa para o papel: o PDF traz o mapa e todos os conteúdos abertos.",
    },
    {
        icone: "√",
        titulo: "Níveis e objetivos",
        texto: "Os mapas ficam separados por dificuldade, para você começar do ponto certo.",
    },
    {
        icone: "↗",
        titulo: "Acompanhe sua evolução",
        texto: "Sequência de dias estudando, pontos e metas diárias na sua página inicial.",
    },
    {
        icone: "Aa",
        titulo: "Feito para todos",
        texto: "Contraste, navegação por teclado e descrição nas imagens, para quem usa leitor de tela.",
    },
];

const recompensas = [
    { icone: "+10", texto: "Ganhe pontos ao completar exercícios" },
    { icone: "▲", texto: "Desbloqueie novos níveis" },
    { icone: "#1", texto: "Suba no ranking" },
    { icone: "×7", texto: "Mantenha sua sequência de estudos" },
];

const perguntas = [
    {
        pergunta: "O HelpyMath é pago?",
        resposta: "Não. A plataforma é totalmente gratuita, e esse é um dos principais objetivos do projeto.",
    },
    {
        pergunta: "Preciso instalar alguma coisa?",
        resposta: "Não. Tudo funciona no navegador, no computador ou no celular.",
    },
    {
        pergunta: "O que é um mapa conceitual?",
        resposta:
            "É um desenho que organiza um assunto em ideias ligadas entre si. Foi criado por Joseph Novak nos anos 70, a partir da teoria da aprendizagem significativa, para ligar o que você já sabe ao que está aprendendo.",
    },
    {
        pergunta: "Por onde eu começo se não sei meu nível?",
        resposta:
            "Comece pelo básico ou faça o teste diagnóstico da página inicial. Você pode trocar de nível quando quiser.",
    },
    {
        pergunta: "Posso estudar sem internet?",
        resposta:
            "Você pode imprimir ou salvar qualquer mapa em PDF, com todos os conteúdos abertos, e estudar offline.",
    },
    {
        pergunta: "Quem criou o HelpyMath?",
        resposta: "Cecília Sales e Diogo Lima, como Trabalho de Conclusão de Curso, em 2026.",
    },
];

// Mapa de exemplo: mostra os três tipos de conteúdo (seção 3.7 do TCC)
const conteudosExemplo = [
    {
        id: "evento",
        tipo: 1,
        titulo: "Evento",
        posicao: "noCimaEsquerda",
        explicacao:
            "Evento é qualquer resultado (ou conjunto de resultados) que pode acontecer num experimento.\n\nExemplo: no lançamento de um dado, \"sair um número par\" é o evento $\\{2, 4, 6\\}$.",
    },
    {
        id: "formula",
        tipo: 2,
        titulo: "Fórmula",
        posicao: "noCimaDireita",
        explicacao: "$P(A) = \\frac{n(A)}{n(\\Omega)}$",
    },
    {
        id: "espaco",
        tipo: 1,
        titulo: "Espaço amostral",
        posicao: "noBaixoEsquerda",
        explicacao:
            "É o conjunto de todos os resultados possíveis, representado por $\\Omega$.\n\nNo lançamento de um dado: $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$, então $n(\\Omega) = 6$.",
    },
    {
        id: "simulacao",
        tipo: 3,
        titulo: "Simular no GeoGebra",
        posicao: "noBaixoDireita",
        link: "https://www.geogebra.org/calculator",
    },
];

const questaoExemplo = {
    enunciado: "Ao lançar um dado comum, qual é a probabilidade de sair um número par?",
    alternativas: ["1/6", "1/3", "1/2", "2/3"],
    correta: 2,
    explicacao: "Os pares são 2, 4 e 6: são 3 resultados favoráveis em 6 possíveis, ou seja, 3/6 = 1/2.",
};

const Introducao = () => {
    useTituloPagina("Conheça");

    const [conteudoAberto, setConteudoAberto] = useState(null);
    const [respostaEscolhida, setRespostaEscolhida] = useState(null);

    // Quem já entrou vê a mesma apresentação, mas com o caminho de volta pro painel no lugar de "Entrar"
    const logado = Boolean(localStorage.getItem("token"));

    const itemAberto = conteudosExemplo.find((c) => c.id === conteudoAberto);
    const respondeu = respostaEscolhida !== null;

    return (
        <div className="intro">
            {/* ---------- Topo ---------- */}
            <header className="introTopo">
                <Marca comLink para="/" />

                <nav className="introMenu" aria-label="Seções da página">
                    <a href="#como-funciona">Como funciona</a>
                    <a href="#mapas">Mapas conceituais</a>
                    <a href="#niveis">Níveis</a>
                    <a href="#questoes">Questões</a>
                    <a href="#perguntas">Dúvidas</a>
                </nav>

                <div className="introTopoAcoes">
                    {logado ? (
                        <Link to="/inicio" className="introBotao">Ir para o meu painel</Link>
                    ) : (
                        <>
                            <Link to="/login" className="introBotao introBotaoContorno">Entrar</Link>
                            <Link to="/register" className="introBotao">Criar conta</Link>
                        </>
                    )}
                </div>
            </header>

            <main>
                {/* ---------- Abertura ---------- */}
                <section className="introHero">
                    <div className="introHeroTexto">
                        <span className="introEtiqueta">Plataforma gratuita de matemática</span>
                        <h1>
                            Matemática que <span>faz sentido</span>.
                        </h1>
                        <p>
                            O HelpyMath ajuda você a estudar matemática com mapas conceituais, simulações
                            práticas, conteúdos organizados por nível e questões para treinar. Tudo de um
                            jeito visual, interativo e fácil de usar.
                        </p>
                        <div className="introHeroAcoes">
                            <Link to={logado ? "/inicio" : "/register"} className="introBotao introBotaoGrande">
                                {logado ? "Continuar estudando" : "Começar agora, é grátis"}
                            </Link>
                            <a href="#mapas" className="introBotao introBotaoGrande introBotaoContorno">Ver um exemplo</a>
                        </div>
                    </div>

                    {/* Foto do quadro com uma "ficha" do mapa conceitual por cima */}
                    <figure className="introHeroFoto">
                        <img src={fotoQuadro} alt="Quadro-negro verde cheio de fórmulas escritas a giz" />
                        <figcaption className="introFicha" aria-hidden="true">
                            <span className="introFichaTitulo">Funções</span>
                            <span>Domínio</span>
                            <span>Gráfico</span>
                            <span><Formula latex="f(x) = ax + b" /></span>
                        </figcaption>
                        <span className="introSelo" aria-hidden="true">π</span>
                    </figure>
                </section>

                {/* ---------- Números ---------- */}
                <section className="introDestaques" aria-label="Destaques">
                    {destaques.map((d) => (
                        <div key={d.rotulo} className="introDestaque">
                            <strong>{d.valor}</strong>
                            <span>{d.rotulo}</span>
                        </div>
                    ))}
                </section>

                {/* ---------- Por que existe ---------- */}
                <section className="introSecao">
                    <div className="introPorque">
                        <div>
                            <span className="introSobretitulo"><b aria-hidden="true">π</b> O problema</span>
                            <h2>Por que o HelpyMath existe?</h2>
                            <p className="introSubtitulo">
                                A matemática é uma das matérias em que os alunos mais têm dificuldade, e muitos
                                procuram ajuda na internet. Ao analisar as plataformas que já existem, encontramos
                                alguns problemas. O HelpyMath foi pensado para resolver cada um deles.
                            </p>
                        </div>
                        <img
                            src={fotoSala}
                            alt="Alunos em sala de aula prestando atenção no professor"
                            className="introFoto"
                            loading="lazy"
                        />
                    </div>

                    <div className="introProblemas">
                        {problemas.map((p) => (
                            <article key={p.problema} className="introProblema">
                                <span className="introIcone" aria-hidden="true">{p.icone}</span>
                                <h3>{p.problema}</h3>
                                <p>{p.solucao}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---------- Como funciona ---------- */}
                <section className="introSecao introFaixa" id="como-funciona">
                    <span className="introSobretitulo"><b aria-hidden="true">Σ</b> Passo a passo</span>
                    <h2>Como funciona</h2>
                    <p className="introSubtitulo">Do cadastro à primeira questão em poucos minutos.</p>

                    <ol className="introPassos">
                        {passos.map((p, i) => (
                            <li key={p.titulo} className="introPasso">
                                <span className="introPassoNumero">{i + 1}</span>
                                <h3>{p.titulo}</h3>
                                <p>{p.texto}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ---------- Mapa de exemplo ---------- */}
                <section className="introSecao" id="mapas">
                    <span className="introSobretitulo"><b aria-hidden="true">≈</b> Na prática</span>
                    <h2>Experimente um mapa conceitual</h2>
                    <p className="introSubtitulo">
                        Os mapas conceituais organizam um assunto em ideias ligadas entre si, ligando o
                        que você já sabe ao que está aprendendo. Clique nos conteúdos deste exemplo:
                    </p>

                    <div className="introMapaArea">
                        <div className="introMapa">
                            <svg className="introMapaLinhas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                                <line x1="50" y1="50" x2="20" y2="20" />
                                <line x1="50" y1="50" x2="80" y2="20" />
                                <line x1="50" y1="50" x2="20" y2="80" />
                                <line x1="50" y1="50" x2="80" y2="80" />
                            </svg>

                            <div className="introMapaTitulo">Probabilidade</div>

                            {conteudosExemplo.map((c) => {
                                if (c.tipo === 2) {
                                    return (
                                        <div key={c.id} className={`introNo introNoIndicador ${c.posicao}`}>
                                            <strong>{c.titulo}</strong>
                                            <TextoComMidia texto={c.explicacao} />
                                        </div>
                                    );
                                }

                                if (c.tipo === 3) {
                                    return (
                                        <a
                                            key={c.id}
                                            href={c.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`introNo ${c.posicao}`}
                                        >
                                            {c.titulo}
                                        </a>
                                    );
                                }

                                return (
                                    <button
                                        type="button"
                                        key={c.id}
                                        className={`introNo ${c.posicao}`}
                                        onClick={() => setConteudoAberto(c.id)}
                                    >
                                        {c.titulo}
                                    </button>
                                );
                            })}
                        </div>

                        <ul className="introTipos">
                            <li>
                                <span className="introTipoAmostra" aria-hidden="true">Evento</span>
                                <div>
                                    <strong>Botão explicativo</strong>
                                    <p>Abre uma janela com a explicação completa, com fórmulas, imagens e vídeos.</p>
                                </div>
                            </li>
                            <li>
                                <span className="introTipoAmostra" aria-hidden="true">Fórmula</span>
                                <div>
                                    <strong>Indicador explicativo</strong>
                                    <p>Um texto curto que fica sempre à vista, ótimo para fórmulas.</p>
                                </div>
                            </li>
                            <li>
                                <span className="introTipoAmostra" aria-hidden="true">Simular</span>
                                <div>
                                    <strong>Botão direcional</strong>
                                    <p>Leva para outra página, como uma simulação prática ou um site explicativo.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* ---------- Níveis ---------- */}
                <section className="introSecao introFaixa" id="niveis">
                    <span className="introSobretitulo"><b aria-hidden="true">√</b> Do seu jeito</span>
                    <h2>Um nível para cada momento</h2>
                    <p className="introSubtitulo">
                        Os mapas ficam separados por dificuldade. Comece onde se sentir confortável e
                        avance no seu ritmo.
                    </p>

                    <div className="introNiveis">
                        {niveis.map((n) => (
                            <div key={n.chave} className={`introNivel nivel-${n.chave}`}>
                                <strong>{n.nome}</strong>
                                <span>{n.descricao.charAt(0) + n.descricao.slice(1).toLowerCase()}</span>
                            </div>
                        ))}
                    </div>

                    <h3 className="introObjetivosTitulo">E para o seu objetivo:</h3>
                    <div className="introObjetivos">
                        {objetivos.map((o) => (
                            <div key={o.titulo} className="introObjetivo">
                                <strong>{o.titulo}</strong>
                                <p>{o.texto}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------- Questão de exemplo ---------- */}
                <section className="introSecao" id="questoes">
                    <span className="introSobretitulo"><b aria-hidden="true">∴</b> Treino</span>
                    <h2>Pratique com questões</h2>
                    <p className="introSubtitulo">
                        Cada mapa tem questões de múltipla escolha. Você responde e descobre na hora se
                        acertou. Tente esta:
                    </p>

                    <div className="introQuestao">
                        <p className="introEnunciado">{questaoExemplo.enunciado}</p>

                        <div className="introAlternativas">
                            {questaoExemplo.alternativas.map((texto, i) => {
                                let classe = "introAlternativa";
                                if (respondeu && i === questaoExemplo.correta) classe += " certa";
                                else if (respondeu && i === respostaEscolhida) classe += " errada";

                                return (
                                    <button
                                        type="button"
                                        key={texto}
                                        className={classe}
                                        onClick={() => setRespostaEscolhida(i)}
                                        disabled={respondeu}
                                    >
                                        <span>{"ABCD"[i]}</span> {texto}
                                    </button>
                                );
                            })}
                        </div>

                        {respondeu && (
                            <div className="introResultado" aria-live="polite">
                                <strong>
                                    {respostaEscolhida === questaoExemplo.correta ? "Acertou! 🎉" : "Quase! A resposta certa é a C."}
                                </strong>
                                <p>{questaoExemplo.explicacao}</p>
                                <button type="button" className="introBotao introBotaoContorno" onClick={() => setRespostaEscolhida(null)}>
                                    Tentar de novo
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ---------- Recursos ---------- */}
                <section className="introSecao introFaixa">
                    <span className="introSobretitulo"><b aria-hidden="true">∫</b> Recursos</span>
                    <h2>Tudo o que você encontra aqui</h2>

                    <div className="introRecursos">
                        {recursos.map((r) => (
                            <article key={r.titulo} className="introRecurso">
                                <span className="introIcone" aria-hidden="true">{r.icone}</span>
                                <h3>{r.titulo}</h3>
                                <p>{r.texto}</p>
                                {r.exemplo && <div className="introRecursoExemplo">{r.exemplo}</div>}
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---------- Recompensas ---------- */}
                <section className="introSecao">
                    <span className="introSobretitulo"><b aria-hidden="true">+</b> Motivação</span>
                    <h2>Estudar também pode ser divertido</h2>
                    <p className="introSubtitulo">Cada exercício conta. Veja o que você ganha estudando:</p>

                    <ul className="introRecompensas">
                        {recompensas.map((r) => (
                            <li key={r.texto}>
                                <span aria-hidden="true">{r.icone}</span>
                                {r.texto}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* ---------- Para professores ---------- */}
                <section className="introSecao introProfessor">
                    <div>
                        <span className="introSobretitulo"><b aria-hidden="true">Δ</b> Para educadores</span>
                        <h2>Para quem cria os conteúdos</h2>
                        <p>
                            Os administradores montam os mapas direto pelo site: escrevem as explicações,
                            inserem fórmulas com um editor de botões, adicionam imagens e vídeos, escolhem a
                            dificuldade e cadastram as questões. Tudo isso numa tela só.
                        </p>
                    </div>
                    <ul>
                        <li>Editor de fórmulas com pré-visualização</li>
                        <li>Imagens e vídeos por link</li>
                        <li>Três tipos de conteúdo por mapa</li>
                        <li>Questões com alternativa correta</li>
                    </ul>
                </section>

                {/* ---------- Dúvidas ---------- */}
                <section className="introSecao introFaixa" id="perguntas">
                    <span className="introSobretitulo"><b aria-hidden="true">?</b> Perguntas</span>
                    <h2>Dúvidas frequentes</h2>

                    <div className="introPerguntas">
                        {perguntas.map((p) => (
                            <details key={p.pergunta} className="introPergunta">
                                <summary>{p.pergunta}</summary>
                                <p>{p.resposta}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* ---------- Citação + chamada final ---------- */}
                <section className="introFinal">
                    <blockquote>
                        “A matemática pura é, à sua maneira, a poesia das ideias lógicas.”
                        <cite>Albert Einstein</cite>
                    </blockquote>

                    <h2>Pronto para começar?</h2>
                    <p>Crie sua conta grátis e estude matemática de um jeito que faz sentido.</p>
                    <div className="introHeroAcoes">
                        {logado ? (
                            <Link to="/inicio" className="introBotao introBotaoGrande introBotaoClaro">Ir para o meu painel</Link>
                        ) : (
                            <>
                                <Link to="/register" className="introBotao introBotaoGrande introBotaoClaro">Criar minha conta</Link>
                                <Link to="/login" className="introBotao introBotaoGrande introBotaoContornoClaro">Já tenho conta</Link>
                            </>
                        )}
                    </div>
                </section>
            </main>

            <footer className="introRodape">
                <Marca />
                <p>Trabalho de Conclusão de Curso · Cecília Sales e Diogo Lima · 2026</p>
                <p className="introCreditos">Fotos: Artturi Jalli e Vitaly Gariev (Unsplash)</p>
            </footer>

            {/* Janela do botão explicativo do mapa de exemplo */}
            {itemAberto && (
                <>
                    <div className="introFundo" onClick={() => setConteudoAberto(null)} />
                    <div className="introJanela" role="dialog" aria-modal="true" aria-label={itemAberto.titulo}>
                        <h3>{itemAberto.titulo}</h3>
                        <div className="introJanelaTexto">
                            <TextoComMidia texto={itemAberto.explicacao} />
                        </div>
                        <button type="button" className="introBotao" onClick={() => setConteudoAberto(null)} autoFocus>
                            Fechar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Introducao;
