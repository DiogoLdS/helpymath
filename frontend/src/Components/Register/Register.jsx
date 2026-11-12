import "./Register.css"
import { Link, useNavigate } from "react-router";
import Sidebar from "../Sidebar/SidebarChapeu";

//  Integração com o servidor por meio da api
import api from '../../../services/api.js';
import { useState } from "react";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import Termos from "./Termos.jsx";
import { iniciarSessao } from "../../utils/sessao.js";

// Mesmo mínimo do backend (usuarioController.js) e da troca de senha no perfil
const SENHA_MINIMA = 6;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
    useTituloPagina("Criar conta");


  const [nome, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  // Os termos precisam ser abertos e lidos até o fim antes de poder marcar a caixinha
  const [termosAbertos, setTermosAbertos] = useState(false);
  const [termosLidos, setTermosLidos] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  // Devolve a primeira coisa errada no formulário, ou "" se estiver tudo certo
  function validar() {
    if (nome.trim().length < 2) return 'Digite seu nome (pelo menos 2 letras).';
    if (!EMAIL_VALIDO.test(email.trim())) return 'Digite um e-mail válido.';
    if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    if (senha !== confirmacao) return 'As senhas não são iguais.';
    if (!aceitouTermos) return 'Leia e aceite os Termos e Condições para criar a conta.';
    return '';
  }

  async function registerUser(e) {
    e.preventDefault();

    const problema = validar();
    setErro(problema);
    if (problema) return;

    setEnviando(true);

    try {
      const resposta = await api.post('/registrarUsuario', { nome: nome.trim(), email: email.trim(), senha, aceitouTermos });
      // Já entra na conta e vai direto pras perguntas de boas-vindas (se não vier token, cai no login como antes)
      if (resposta.data?.token) {
        iniciarSessao(resposta.data.token, true);
        navigate('/boas-vindas');
      } else {
        navigate('/login');
      }
    } catch (error) {
      // O backend devolve { error: "mensagem" } quando algum dado está errado (ex: e-mail já usado)
      setErro(error.response?.data?.error ?? 'Não foi possível criar a conta agora. Tente novamente em instantes.');
      console.log(error.message);
    } finally {
      setEnviando(false);
    }
  }

  const aceitarTermos = () => {
    setTermosLidos(true);
    setAceitouTermos(true);
    setTermosAbertos(false);
  };

  return (
    <>
      <main className='mainRegister'>
        <Sidebar />

        <section className="register">
          <form onSubmit={registerUser} noValidate>
            <Marca grande />
            <h1>Crie uma conta</h1>

            <div className="input-field">
              <input type="text" id="user" name="user" aria-label="Seu nome" autoComplete="name" placeholder="Seu nome *" value={nome} maxLength={80} onChange={(e) => { setUsername(e.target.value) }} disabled={enviando} />
            </div>

            <div className="input-field">
              <input type="email" id="email" name="email" aria-label="Seu e-mail" autoComplete="email" placeholder="Seu e-mail *" value={email} onChange={(e) => { setEmail(e.target.value) }} disabled={enviando} />
            </div>

            <div className="input-field">
              <input type="password" id="password" name="password" aria-label={`Sua senha, mínimo ${SENHA_MINIMA} caracteres`} autoComplete="new-password" placeholder={`Sua senha (mínimo ${SENHA_MINIMA} caracteres) *`} value={senha} onChange={(e) => { setPassword(e.target.value) }} disabled={enviando} />
            </div>
            {/* Aviso enquanto a pessoa digita */}
            {senha.length > 0 && senha.length < SENHA_MINIMA && (
              <p className="avisoFormulario">Faltam {SENHA_MINIMA - senha.length} caractere(s) para a senha ficar válida.</p>
            )}

            <div className="input-field">
              <input type="password" id="confirmacao" name="confirmacao" aria-label="Repita a senha" autoComplete="new-password" placeholder="Repita a senha *" value={confirmacao} onChange={(e) => { setConfirmacao(e.target.value) }} disabled={enviando} />
            </div>
            {confirmacao.length > 0 && confirmacao !== senha && (
              <p className="avisoFormulario">As senhas ainda não são iguais.</p>
            )}

            <div className="terms">
              <label title={termosLidos ? '' : 'Abra e leia os termos para poder aceitar'}>
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={aceitouTermos}
                  disabled={!termosLidos || enviando}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                />
                <p>
                  Li e concordo com os{' '}
                  <button type="button" className="linkTermos" onClick={() => setTermosAbertos(true)}>Termos e Condições</button>
                </p>
              </label>
            </div>
            {!termosLidos && <p className="avisoFormulario">Clique em "Termos e Condições" e leia até o fim para poder aceitar.</p>}

            {erro && <p className="erroFormulario" role="alert">{erro}</p>}

            <div className="enter">
              <button type="submit" disabled={enviando}>
                {enviando ? <Carregando texto="Criando conta" /> : 'Registre-se'}
              </button>
            </div>

            <div className="signup">
              <p>Já tem uma conta? <Link to="/login">Entre!</Link></p>
              <p><Link to="/">Conheça o HelpyMath</Link></p>
            </div>
          </form>
        </section>
      </main>

      {termosAbertos && <Termos onAceitar={aceitarTermos} onFechar={() => setTermosAbertos(false)} />}
    </>
  )

}

export default Register
