import { useState } from "react";
import { OBJETIVOS } from "./perfilUtils.js";

// Editar nome e objetivo de estudo, e trocar a senha
const EditarConta = ({ usuario, onSalvar, onTrocarSenha, onFechar }) => {
    const [nome, setNome] = useState(usuario.nome);
    const [objetivo, setObjetivo] = useState(usuario.objetivo ?? "");
    const [mensagemDados, setMensagemDados] = useState("");

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [mensagemSenha, setMensagemSenha] = useState("");

    const salvarDados = async (e) => {
        e.preventDefault();
        if (nome.trim().length < 2) {
            setMensagemDados("O nome precisa ter pelo menos 2 letras.");
            return;
        }
        const certo = await onSalvar({ nome: nome.trim(), objetivo: objetivo || null });
        setMensagemDados(certo ? "Dados salvos!" : "Não foi possível salvar. Tente de novo.");
    };

    const salvarSenha = async (e) => {
        e.preventDefault();
        if (novaSenha.length < 6) {
            setMensagemSenha("A nova senha precisa ter pelo menos 6 caracteres.");
            return;
        }
        if (novaSenha !== confirmacao) {
            setMensagemSenha("A confirmação não é igual à nova senha.");
            return;
        }
        const erro = await onTrocarSenha(senhaAtual, novaSenha);
        setMensagemSenha(erro || "Senha alterada!");
        if (!erro) {
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmacao("");
        }
    };

    return (
        <div className="editarConta">
            <form onSubmit={salvarDados} className="editarContaBloco">
                <h3>Seus dados</h3>
                <label htmlFor="perfilNome">Nome</label>
                <input id="perfilNome" type="text" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />

                <label htmlFor="perfilObjetivo">Por que você está estudando?</label>
                <select id="perfilObjetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                    <option value="">Prefiro não dizer</option>
                    {OBJETIVOS.map((o) => <option key={o.chave} value={o.chave}>{o.nome}</option>)}
                </select>

                <p className="perfilDica">E-mail: {usuario.email} (não pode ser alterado)</p>
                {mensagemDados && <p className="perfilMensagem">{mensagemDados}</p>}
                <button type="submit" className="perfilBotao">Salvar dados</button>
            </form>

            <form onSubmit={salvarSenha} className="editarContaBloco">
                <h3>Trocar senha</h3>
                <label htmlFor="senhaAtual">Senha atual</label>
                <input id="senhaAtual" type="password" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />

                <label htmlFor="novaSenha">Nova senha</label>
                <input id="novaSenha" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />

                <label htmlFor="confirmacaoSenha">Repita a nova senha</label>
                <input id="confirmacaoSenha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />

                {mensagemSenha && <p className="perfilMensagem">{mensagemSenha}</p>}
                <button type="submit" className="perfilBotao" disabled={!senhaAtual || !novaSenha}>Trocar senha</button>
            </form>

            <button type="button" className="perfilBotao perfilBotaoContorno editarContaFechar" onClick={onFechar}>
                Fechar edição
            </button>
        </div>
    );
};

export default EditarConta;
