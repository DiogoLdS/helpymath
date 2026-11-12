import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import niveis from "../../data/niveis.js";
import { decodificarToken } from "../../utils/auth.js";
import Carregando from "../Carregando/Carregando.jsx";
import "./InicioAdmin.css";

const nomeDoNivel = (chave) => niveis.find((n) => n.chave === chave)?.nome ?? chave;
const formatarData = (data) => new Date(data).toLocaleDateString("pt-BR");

// Página inicial de quem é ADMIN: um painel de gestão no lugar da escolha de nível.
// Mostra números do site, o que precisa de atenção, os mapas, onde os alunos mais erram e os usuários.
const InicioAdmin = ({ sair }) => {
    const navigate = useNavigate();
    const [painel, setPainel] = useState(null);
    const [erro, setErro] = useState("");
    const [alterandoUsuario, setAlterandoUsuario] = useState(null);
    // Senha temporária recém-gerada: { nome, email, senha, copiada }
    const [senhaGerada, setSenhaGerada] = useState(null);

    const eu = decodificarToken(localStorage.getItem("token") ?? "");
    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    useEffect(() => {
        const buscar = async () => {
            try {
                const resposta = await api.get("/admin/painel", { headers: headers() });
                setPainel(resposta.data);
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setErro(error.response?.status === 403
                    ? "Sua conta não é mais administradora. Saia e entre de novo."
                    : "Não foi possível carregar o painel. Tente novamente em instantes.");
                console.log(error.message);
            }
        };
        buscar();
    }, [navigate]);

    // Tornar alguém admin, ou tirar o acesso (rotas que já existiam no backend)
    const alterarAdmin = async (usuario) => {
        const virarAdmin = !usuario.admin;
        const confirmou = window.confirm(virarAdmin
            ? `Tornar ${usuario.nome} administrador(a)? Essa pessoa poderá criar, editar e excluir mapas.`
            : `Remover o acesso de administrador(a) de ${usuario.nome}?`);
        if (!confirmou) return;

        setAlterandoUsuario(usuario.usuarioId);
        try {
            await api.patch(`/usuario/${usuario.usuarioId}/${virarAdmin ? "promover" : "despromover"}`, {}, { headers: headers() });
            setPainel((atual) => ({
                ...atual,
                usuarios: atual.usuarios.map((u) => (u.usuarioId === usuario.usuarioId ? { ...u, admin: virarAdmin } : u)),
            }));
        } catch (error) {
            window.alert(error.response?.data?.error ?? "Não foi possível alterar o acesso. Tente de novo.");
            console.log(error.message);
        } finally {
            setAlterandoUsuario(null);
        }
    };

    // "Esqueci minha senha": gera uma senha temporária pro usuário (o site não envia e-mail).
    // Ela só aparece aqui, uma vez; o admin passa pra pessoa, que troca no perfil depois de entrar.
    const gerarSenha = async (usuario) => {
        const confirmou = window.confirm(
            `Gerar uma senha temporária para ${usuario.nome}? A senha atual dessa pessoa deixa de funcionar.`
        );
        if (!confirmou) return;

        setAlterandoUsuario(usuario.usuarioId);
        setSenhaGerada(null);
        try {
            const resposta = await api.patch(`/usuario/${usuario.usuarioId}/senha-temporaria`, {}, { headers: headers() });
            setSenhaGerada({ nome: usuario.nome, email: usuario.email, senha: resposta.data.senhaTemporaria, copiada: false });
        } catch (error) {
            window.alert(error.response?.data?.error ?? "Não foi possível gerar a senha. Tente de novo.");
            console.log(error.message);
        } finally {
            setAlterandoUsuario(null);
        }
    };

    const copiarSenha = async () => {
        try {
            await navigator.clipboard.writeText(senhaGerada.senha);
            setSenhaGerada((atual) => ({ ...atual, copiada: true }));
        } catch {
            window.alert("Não deu pra copiar automaticamente. Selecione a senha e copie.");
        }
    };

    if (erro) {
        return <div className="homeCentro"><p className="adminErro">{erro}</p></div>;
    }

    if (!painel) {
        return <Carregando pagina texto="Carregando o painel" />;
    }

    // ---------- O que precisa de atenção (coisas que travam o aluno ou o conteúdo) ----------
    const avisos = [
        ...painel.mapas.filter((m) => m.conteudos === 0).map((m) => ({
            tipo: "grave", texto: `"${m.nome}" não tem nenhum conteúdo.`, mapaId: m.mapaId,
        })),
        ...painel.questoesSemCorreta.map((q) => ({
            tipo: "grave",
            texto: `Uma questão de "${painel.mapas.find((m) => m.mapaId === q.mapaId)?.nome ?? "?"}" não tem alternativa correta: ninguém consegue acertar.`,
            mapaId: q.mapaId,
        })),
        ...painel.mapas.filter((m) => m.questoes === 0 && m.conteudos > 0).map((m) => ({
            tipo: "aviso", texto: `"${m.nome}" não tem questões: o aluno conclui o mapa só com os conteúdos.`, mapaId: m.mapaId,
        })),
        ...niveis.filter((n) => !painel.mapas.some((m) => m.nivel === n.chave)).map((n) => ({
            tipo: "aviso", texto: `O nível ${n.nome} ainda não tem mapas.`, mapaId: null,
        })),
    ];

    // ---------- Onde os alunos mais erram (mapas com respostas, do pior pro melhor) ----------
    const maisErram = painel.mapas
        .filter((m) => m.respostas > 0)
        .map((m) => ({ ...m, taxa: Math.round((m.acertos / m.respostas) * 100) }))
        .sort((a, b) => a.taxa - b.taxa)
        .slice(0, 5);

    const primeiroNome = (eu?.nome ?? "").trim().split(/\s+/)[0];

    return (
        <div className="homeCentro adminInicio">
            <header className="adminCabecalho">
                <div>
                    <span className="adminEtiqueta">Administrador</span>
                    <h1>Olá{primeiroNome ? `, ${primeiroNome}` : ""}!</h1>
                    <p>Este é o painel de gestão do HelpyMath.</p>
                </div>
                <div className="adminAcoes">
                    <Link to="/admin/mapas/criar" className="adminBotao">+ Criar mapa</Link>
                    <Link to="/mapas" className="adminBotao adminBotaoContorno">Ver a trilha</Link>
                    <button type="button" className="adminBotao adminBotaoContorno" onClick={sair}>Sair</button>
                </div>
            </header>

            {/* ---------- Números ---------- */}
            <ul className="adminNumeros">
                <li><strong>{painel.totais.alunos}</strong><span>{painel.totais.alunos === 1 ? "aluno" : "alunos"}</span></li>
                <li><strong>{painel.totais.mapas}</strong><span>mapas</span></li>
                <li><strong>{painel.totais.conteudos}</strong><span>conteúdos</span></li>
                <li><strong>{painel.totais.questoes}</strong><span>questões</span></li>
                <li>
                    <strong>{painel.semana.conteudosConcluidos + painel.semana.questoesRespondidas}</strong>
                    <span>atividades dos alunos nos últimos 7 dias</span>
                </li>
            </ul>

            {/* ---------- Precisa de atenção ---------- */}
            <section className="adminBloco">
                <h2>Precisa de atenção</h2>
                {avisos.length === 0 ? (
                    <p className="adminTudoCerto">Tudo certo: nenhum problema encontrado nos mapas.</p>
                ) : (
                    <ul className="adminAvisos">
                        {avisos.map((aviso, i) => (
                            <li key={i} className={aviso.tipo}>
                                <span>{aviso.texto}</span>
                                {aviso.mapaId
                                    ? <Link to={`/admin/mapas/${aviso.mapaId}/editar`}>Corrigir</Link>
                                    : <Link to="/admin/mapas/criar">Criar mapa</Link>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ---------- Mapas ---------- */}
            <section className="adminBloco">
                <h2>Mapas</h2>
                <div className="adminTabelaRolagem">
                    <table className="adminTabela">
                        <thead>
                            <tr><th>Mapa</th><th>Nível</th><th>Conteúdos</th><th>Questões</th><th>Acerto dos alunos</th><th></th></tr>
                        </thead>
                        <tbody>
                            {painel.mapas.map((m) => (
                                <tr key={m.mapaId}>
                                    <td>{m.nome}</td>
                                    <td><span className={`adminNivel nivel-tag-${m.nivel}`}>{nomeDoNivel(m.nivel)}</span></td>
                                    <td>{m.conteudos}</td>
                                    <td>{m.questoes}</td>
                                    <td>{m.respostas > 0 ? `${Math.round((m.acertos / m.respostas) * 100)}% (${m.respostas} respostas)` : "–"}</td>
                                    <td className="adminTabelaAcoes">
                                        <Link to={`/mapas/${m.mapaId}`}>Abrir</Link>
                                        <Link to={`/admin/mapas/${m.mapaId}/editar`}>Editar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ---------- Onde os alunos mais erram ---------- */}
            <section className="adminBloco">
                <h2>Onde os alunos mais erram</h2>
                {maisErram.length === 0 ? (
                    <p className="adminVazio">Ainda não há respostas de alunos para comparar.</p>
                ) : (
                    <ul className="adminErros">
                        {maisErram.map((m) => (
                            <li key={m.mapaId}>
                                <div className="adminErrosTopo">
                                    <span>{m.nome}</span>
                                    <strong>{m.taxa}% de acerto</strong>
                                </div>
                                <div className={m.taxa >= 60 ? "adminBarra" : "adminBarra fraca"}>
                                    <div style={{ width: `${m.taxa}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="adminDica">Taxas baixas podem indicar uma explicação confusa ou uma questão difícil demais.</p>
            </section>

            {/* ---------- Usuários ---------- */}
            <section className="adminBloco">
                <h2>Usuários</h2>
                <p className="adminDica">
                    Esqueceram a senha? Use "Nova senha" e passe a senha temporária para a pessoa.
                    Depois de entrar, ela troca a senha no perfil.
                </p>

                {senhaGerada && (
                    <div className="adminSenhaGerada" role="status">
                        <p>
                            Senha temporária de <strong>{senhaGerada.nome}</strong> ({senhaGerada.email}):
                        </p>
                        <div className="adminSenhaLinha">
                            <code>{senhaGerada.senha}</code>
                            <button type="button" className="adminLinkBotao" onClick={copiarSenha}>
                                {senhaGerada.copiada ? "Copiada!" : "Copiar"}
                            </button>
                        </div>
                        <p className="adminDica">
                            Ela só aparece agora. Peça para a pessoa entrar com ela e trocar no perfil.
                        </p>
                        <button type="button" className="adminLinkBotao" onClick={() => setSenhaGerada(null)}>
                            Fechar
                        </button>
                    </div>
                )}
                <div className="adminTabelaRolagem">
                    <table className="adminTabela">
                        <thead>
                            <tr><th>Nome</th><th>E-mail</th><th>Desde</th><th>Conteúdos</th><th>Questões</th><th>Acesso</th></tr>
                        </thead>
                        <tbody>
                            {painel.usuarios.map((u) => {
                                const souEu = u.usuarioId === eu?.usuarioId;
                                return (
                                    <tr key={u.usuarioId}>
                                        <td>{u.nome}{souEu && <span className="adminVoce"> (você)</span>}</td>
                                        <td>{u.email}</td>
                                        <td>{formatarData(u.criadoEm)}</td>
                                        <td>{u.conteudosConcluidos}</td>
                                        <td>{u.questoesRespondidas}</td>
                                        <td className="adminTabelaAcoes">
                                            <span className={u.admin ? "adminPapel admin" : "adminPapel"}>{u.admin ? "Admin" : "Aluno"}</span>
                                            {/* Ninguém tira o próprio acesso (o backend também bloqueia) */}
                                            {!souEu && (alterandoUsuario === u.usuarioId ? (
                                                <Carregando texto="Salvando" />
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="adminLinkBotao"
                                                        onClick={() => alterarAdmin(u)}
                                                        disabled={alterandoUsuario !== null}
                                                    >
                                                        {u.admin ? "Remover admin" : "Tornar admin"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="adminLinkBotao"
                                                        onClick={() => gerarSenha(u)}
                                                        disabled={alterandoUsuario !== null}
                                                    >
                                                        Nova senha
                                                    </button>
                                                </>
                                            ))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default InicioAdmin;
