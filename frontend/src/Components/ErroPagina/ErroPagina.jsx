import { Component } from "react";

// Se uma página quebrar (ou o arquivo dela não chegar, ex: internet caiu), mostra um aviso com botão
// de recarregar no lugar de deixar a tela em branco. Tem que ser classe: é o único jeito de o React
// avisar que um componente filho deu erro.
class ErroPagina extends Component {
    state = { erro: false };

    static getDerivedStateFromError() {
        return { erro: true };
    }

    componentDidCatch(error) {
        console.log(error.message);
    }

    render() {
        if (!this.state.erro) return this.props.children;

        return (
            <main className="erroPagina" role="alert">
                <h1>Não foi possível abrir esta página</h1>
                <p>Pode ser a internet ou o site acabou de ser atualizado. Recarregar costuma resolver.</p>
                <button type="button" onClick={() => window.location.reload()}>Recarregar a página</button>
            </main>
        );
    }
}

export default ErroPagina;
