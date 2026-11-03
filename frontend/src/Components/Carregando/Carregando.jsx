import "./Carregando.css";

// Spinner com texto, pra pessoa não achar que o site travou enquanto algo é enviado ou carregado.
// - pagina: versão grande, centralizada, pra quando a página inteira ainda está carregando
// - sem "pagina": versão pequena, pra usar dentro de botões e ao lado de campos
// role="status" faz o leitor de tela avisar "Carregando..." (acessibilidade, RNF007 do TCC)
const Carregando = ({ texto = "Carregando", pagina = false }) => (
    <span className={pagina ? "carregando carregandoPagina" : "carregando"} role="status" aria-live="polite">
        <span className="carregandoRoda" aria-hidden="true" />
        <span>{texto}...</span>
    </span>
);

export default Carregando;
