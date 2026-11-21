import { useState } from "react";
import { OBJETIVOS, explicacaoDoNivel } from "./perfilUtils.js";
import niveis from "../../data/niveis.js";
import Carregando from "../Carregando/Carregando.jsx";

// Níveis que o aluno pode escolher como ponto de partida (o Treino é livre pra todos)
const NIVEIS_PARTIDA = niveis.filter((n) => n.chave !== "treino");

// Editar nome e objetivo de estudo, trocar o nível, trocar a senha e excluir a conta
const EditarConta = ({ usuario, onSalvar, onTrocarSenha, onExcluirConta, onFechar }) => {
    const [nome, setNome] = useState(usuario.nome);
    const [objetivo, setObjetivo] = useState(usuario.objetivo ?? "");
    const [mensagemDados, setMensagemDados] = useState("");
    const [salvandoDados, setSalvandoDados] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    // Nível de partida: decide quais níveis da trilha ficam abertos (sem nível = Básico)
    const nivelSalvo = NIVEIS_PARTIDA.some((n) => n.chave === usuario.nivel) ? usuario.nivel : "basico";
    const [nivel, setNivel] = useState(nivelSalvo);
    const [mensagemNivel, setMensagemNivel] = useState("");
    const [salvandoNivel, setSalvandoNivel] = useState(false);

    const salvarNivel = async (e) => {
        e.preventDefault();
        setSalvandoNivel(true);
        const certo = await onSalvar({ nivel });
        setSalvandoNivel(false);
        setMensagemNivel(certo ? "Nível trocado! Sua trilha já foi atualizada." : "Não foi possível trocar. Tente de novo.");
    };

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
        setSalvandoDados(true);
        const certo = await onSalvar({ nome: nome.trim(), objetivo: objetivo || null });
        setSalvandoDados(false);
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
        setSalvandoSenha(true);
        const erro = await onTrocarSenha(senhaAtual, novaSenha);
        setSalvandoSenha(false);
        setMensagemSenha(erro || "Senha alterada!");
        if (!erro) {
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmacao("");
        }
    };

    // Excluir conta: primeiro clique só abre a confirmação; precisa digitar a senha
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const [senhaExclusao, setSenhaExclusao] = useState("");
    const [mensagemExclusao, setMensagemExclusao] = useState("");
    const [excluindo, setExcluindo] = useState(false);

    const excluir = async (e) => {
        e.preventDefault();
        setExcluindo(true);
        const erro = await onExcluirConta(senhaExclusao);
        // Deu certo: o Perfil já saiu da página
        if (erro) {
            setExcluindo(false);
            setMensagemExclusao(erro);
        }
    };

    const cancelarExclusao = () => {
        setConfirmandoExclusao(false);
        setSenhaExclusao("");
        setMensagemExclusao("");
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
                <button type="submit" className="perfilBotao" disabled={salvandoDados}>
                    {salvandoDados ? <Carregando texto="Salvando" /> : "Salvar dados"}
                </button>
            </form>

            {/* Admin já vê a trilha toda liberada: não tem nível pra trocar */}
            {!usuario.admin && (
                <form onSubmit={salvarNivel} className="editarContaBloco">
                    <h3>Seu nível</h3>
                    <label htmlFor="perfilNivel">Por onde você quer começar?</label>
                    <select
                        id="perfilNivel"
                        value={nivel}
                        onChange={(e) => { setNivel(e.target.value); setMensagemNivel(""); }}
                    >
                        {NIVEIS_PARTIDA.map((n) => <option key={n.chave} value={n.chave}>{n.nome}</option>)}
                    </select>

                    <p className="perfilDica">{explicacaoDoNivel(nivel, NIVEIS_PARTIDA)}</p>
                    {nivel !== nivelSalvo && (
                        <p className="perfilDica">Seu progresso não se perde: os mapas que você já fez continuam concluídos.</p>
                    )}
                    {mensagemNivel && <p className="perfilMensagem">{mensagemNivel}</p>}
                    <button type="submit" className="perfilBotao" disabled={nivel === nivelSalvo || salvandoNivel}>
                        {salvandoNivel ? <Carregando texto="Trocando" /> : "Trocar nível"}
                    </button>
                </form>
            )}

            <form onSubmit={salvarSenha} className="editarContaBloco">
                <h3>Trocar senha</h3>
                <label htmlFor="senhaAtual">Senha atual</label>
                <input id="senhaAtual" type="password" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />

                <label htmlFor="novaSenha">Nova senha</label>
                <input id="novaSenha" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />

                <label htmlFor="confirmacaoSenha">Repita a nova senha</label>
                <input id="confirmacaoSenha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />

                {mensagemSenha && <p className="perfilMensagem">{mensagemSenha}</p>}
                <button type="submit" className="perfilBotao" disabled={!senhaAtual || !novaSenha || salvandoSenha}>
                    {salvandoSenha ? <Carregando texto="Trocando" /> : "Trocar senha"}
                </button>
            </form>

            {/* LGPD: o aluno pode apagar a conta e os dados dele sem precisar pedir pra ninguém */}
            <form onSubmit={excluir} className="editarContaBloco editarContaPerigo">
                <h3>Excluir conta</h3>
                {!confirmandoExclusao ? (
                    <>
                        <p className="perfilDica">
                            Apaga sua conta e todos os seus dados: progresso, respostas, anotações e cronograma.
                            Não dá para desfazer.
                        </p>
                        <button type="button" className="perfilBotao perfilBotaoPerigo" onClick={() => setConfirmandoExclusao(true)}>
                            Quero excluir minha conta
                        </button>
                    </>
                ) : (
                    <>
                        <p className="perfilDica"><strong>Tem certeza?</strong> Digite sua senha para confirmar. Tudo será apagado.</p>
                        <label htmlFor="senhaExclusao">Sua senha</label>
                        <input id="senhaExclusao" type="password" autoComplete="current-password" value={senhaExclusao} onChange={(e) => setSenhaExclusao(e.target.value)} />
                        {mensagemExclusao && <p className="perfilMensagem">{mensagemExclusao}</p>}
                        <div className="editarContaAcoes">
                            <button type="submit" className="perfilBotao perfilBotaoPerigo" disabled={!senhaExclusao || excluindo}>
                                {excluindo ? <Carregando texto="Excluindo" /> : "Excluir para sempre"}
                            </button>
                            <button type="button" className="perfilBotao perfilBotaoContorno" onClick={cancelarExclusao}>
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </form>

            <button type="button" className="perfilBotao perfilBotaoContorno editarContaFechar" onClick={onFechar}>
                Fechar edição
            </button>
        </div>
    );
};

export default EditarConta;
