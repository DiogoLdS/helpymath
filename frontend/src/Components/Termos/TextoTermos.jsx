// Texto dos Termos de Uso e da Política de Privacidade.
// Usado em dois lugares: na janela do cadastro e na página /termos (que dá pra abrir sem conta).
// nivel: nível dos títulos (2 na página /termos, que já tem o h1; 3 na janela do cadastro)
const TextoTermos = ({ nivel = 3 }) => {
    const Titulo = `h${nivel}`;
    return (
        <>
            <Titulo>1. Sobre o HelpyMath</Titulo>
            <p>
                O HelpyMath é uma plataforma educacional gratuita de apoio ao estudo da matemática, desenvolvida
                como Trabalho de Conclusão de Curso. Ela oferece mapas conceituais, questões e acompanhamento do
                progresso de estudos.
            </p>

            <Titulo>2. Sua conta</Titulo>
            <p>
                Para usar a plataforma você cria uma conta com nome, e-mail e senha. Você é responsável por manter
                sua senha em segredo e por tudo o que for feito com a sua conta. Use dados verdadeiros e não crie
                contas em nome de outras pessoas.
            </p>

            <Titulo>3. Dados que guardamos</Titulo>
            <p>
                Guardamos apenas o necessário para o funcionamento do site: seu nome, seu e-mail, sua senha
                (de forma criptografada, que nem a equipe consegue ler), os conteúdos que você concluiu, suas respostas
                às questões e o que você escrever no seu perfil (objetivo, metas, cronograma e anotações).
            </p>
            <p>
                No seu navegador ficam só o seu login (para você não precisar entrar toda hora) e alguns lembretes do
                site, como quais mapas você já viu liberados. Não usamos cookies de propaganda nem ferramentas de
                rastreamento.
            </p>

            <Titulo>4. Como usamos seus dados</Titulo>
            <p>
                Seus dados são usados somente para mostrar seu progresso, recomendar conteúdos e montar seu perfil
                de estudos. No ranking, outros alunos veem apenas o seu primeiro nome e a inicial do sobrenome, junto
                com seus pontos. Os dados não são vendidos nem compartilhados com terceiros para propaganda. O
                tratamento segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>

            <Titulo>5. Seus direitos</Titulo>
            <p>
                Você pode consultar e corrigir seus dados no seu perfil a qualquer momento. Também pode excluir sua
                conta sozinho, em <strong>Perfil → Editar perfil → Excluir conta</strong>: a conta e todos os dados
                ligados a ela (progresso, respostas, anotações e cronograma) são apagados na hora e não podem ser
                recuperados.
            </p>

            <Titulo>6. Uso adequado</Titulo>
            <p>
                Não é permitido tentar acessar contas de outras pessoas, atrapalhar o funcionamento do site ou usar a
                plataforma para fins ilegais. Contas que descumprirem estas regras podem ser removidas. Para proteger as
                contas, o login fica travado por alguns minutos depois de várias senhas erradas seguidas.
            </p>

            <Titulo>7. Conteúdo</Titulo>
            <p>
                Os mapas, explicações e questões são feitos para apoiar o estudo e podem conter imprecisões. Links para
                sites externos (como simulações) levam a páginas que não são controladas pelo HelpyMath.
            </p>

            <Titulo>8. Mudanças nos termos</Titulo>
            <p>
                Estes termos podem ser atualizados. Mudanças importantes serão avisadas na própria plataforma.
            </p>
        </>
    );
};

export default TextoTermos;
