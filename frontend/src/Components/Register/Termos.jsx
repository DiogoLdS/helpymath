import { useState } from "react";

// Janela com os Termos e Condições. O botão "Li e concordo" só libera depois que a pessoa
// rola o texto até o fim: a conta só é criada por quem leu os termos.
const Termos = ({ onAceitar, onFechar }) => {
    const [chegouAoFim, setChegouAoFim] = useState(false);

    const conferirRolagem = (e) => {
        const caixa = e.currentTarget;
        // Uma folguinha de 8px, porque o navegador às vezes para um pouco antes do fim exato
        if (caixa.scrollTop + caixa.clientHeight >= caixa.scrollHeight - 8) {
            setChegouAoFim(true);
        }
    };

    return (
        <>
            <div className="termosFundo" onClick={onFechar} />
            <div className="termosJanela" role="dialog" aria-modal="true" aria-labelledby="termosTitulo">
                <h2 id="termosTitulo">Termos e Condições de Uso</h2>
                <p className="termosDica">Leia até o fim para poder aceitar.</p>

                <div className="termosTexto" onScroll={conferirRolagem} tabIndex={0}>
                    <h3>1. Sobre o HelpyMath</h3>
                    <p>
                        O HelpyMath é uma plataforma educacional gratuita de apoio ao estudo da matemática, desenvolvida
                        como Trabalho de Conclusão de Curso. Ela oferece mapas conceituais, questões e acompanhamento do
                        progresso de estudos.
                    </p>

                    <h3>2. Sua conta</h3>
                    <p>
                        Para usar a plataforma você cria uma conta com nome, e-mail e senha. Você é responsável por manter
                        sua senha em segredo e por tudo o que for feito com a sua conta. Use dados verdadeiros e não crie
                        contas em nome de outras pessoas.
                    </p>

                    <h3>3. Dados que guardamos</h3>
                    <p>
                        Guardamos apenas o necessário para o funcionamento do site: seu nome, seu e-mail, sua senha
                        (de forma criptografada, que nem a equipe consegue ler), os conteúdos que você concluiu, suas respostas
                        às questões e o que você escrever no seu perfil (objetivo, metas, cronograma e anotações).
                    </p>

                    <h3>4. Como usamos seus dados</h3>
                    <p>
                        Seus dados são usados somente para mostrar seu progresso, recomendar conteúdos e montar seu perfil
                        de estudos. Eles não são vendidos nem compartilhados com terceiros para propaganda. O tratamento
                        segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                    </p>

                    <h3>5. Seus direitos</h3>
                    <p>
                        Você pode consultar e corrigir seus dados no seu perfil a qualquer momento. Se quiser que sua conta
                        e seus dados sejam apagados, peça a um administrador da plataforma.
                    </p>

                    <h3>6. Uso adequado</h3>
                    <p>
                        Não é permitido tentar acessar contas de outras pessoas, atrapalhar o funcionamento do site ou usar a
                        plataforma para fins ilegais. Contas que descumprirem estas regras podem ser removidas.
                    </p>

                    <h3>7. Conteúdo</h3>
                    <p>
                        Os mapas, explicações e questões são feitos para apoiar o estudo e podem conter imprecisões. Links para
                        sites externos (como simulações) levam a páginas que não são controladas pelo HelpyMath.
                    </p>

                    <h3>8. Mudanças nos termos</h3>
                    <p>
                        Estes termos podem ser atualizados. Mudanças importantes serão avisadas na própria plataforma.
                    </p>

                    <p className="termosFim">Fim dos termos.</p>
                </div>

                <div className="termosAcoes">
                    <button type="button" className="termosBotao" onClick={onAceitar} disabled={!chegouAoFim}>
                        {chegouAoFim ? "Li e concordo" : "Role até o fim para aceitar"}
                    </button>
                    <button type="button" className="termosBotao termosBotaoContorno" onClick={onFechar}>
                        Fechar
                    </button>
                </div>
            </div>
        </>
    );
};

export default Termos;
