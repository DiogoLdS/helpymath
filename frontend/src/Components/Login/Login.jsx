import { useState } from 'react'
import "./Login.css"
import { Link, useNavigate } from "react-router";
import api from '../../../services/api.js';
import Sidebar from "../Sidebar/SidebarChapeu";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";
import Carregando from "../Carregando/Carregando.jsx";
import { iniciarSessao } from "../../utils/sessao.js";

const Login = () => {
    useTituloPagina("Entrar");

  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarAjudaSenha, setMostrarAjudaSenha] = useState(false);

  const navigate = useNavigate();

  async function logUser(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }

    setEnviando(true);

    try {
      const login = await api.post('/logUsuario', { email: email.trim(), senha });

      if (login.status == 200) {
        iniciarSessao(login.data, lembrar);
        navigate('/inicio');
      }
    } catch (error) {
      // 400/401/404: e-mail ou senha errados (não dizemos qual, por segurança)
      // 429: muitas tentativas erradas, o servidor diz quantos minutos esperar
      setErro(
        error.response?.status === 429
          ? error.response.data?.error ?? 'Muitas tentativas erradas. Espere alguns minutos.'
          : error.response && error.response.status < 500
            ? 'E-mail ou senha incorretos.'
            : 'Não foi possível entrar agora. Tente novamente em instantes.'
      );
      console.log(error.message);
    } finally {
      setEnviando(false);
    }
  }


  return (
    <>
      <main className='mainLogin'>
        <Sidebar />

        <section className="login">
          <form onSubmit={logUser}>
            <Marca grande />
            <h1>Faça seu login</h1>

            <div className="input-field">
              <input type="email" id="user" name="user" aria-label="E-mail" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="E-mail" disabled={enviando} />
            </div>

            <div className="input-field">
              <input type="password" id="password" name="password" aria-label="Senha" autoComplete="current-password" value={senha} onChange={(e) => { setPassword(e.target.value) }} placeholder="Senha" disabled={enviando} />
            </div>

            <div className="remember-me">
              <label><input type="checkbox" id="remember-me" name="remember-me" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />Lembrar de mim</label>

              <button type="button" className="linkSenha" onClick={() => setMostrarAjudaSenha((v) => !v)} aria-expanded={mostrarAjudaSenha}>
                Esqueceu a senha?
              </button>
            </div>

            {/* O site ainda não envia e-mail, então a recuperação é feita por um administrador */}
            {mostrarAjudaSenha && (
              <p className="avisoFormulario">
                Peça ao seu professor ou a um administrador do HelpyMath uma senha temporária (informe o e-mail
                da sua conta). Entre com ela e troque por uma senha nova no seu perfil.
              </p>
            )}

            {erro && <p className="erroFormulario" role="alert">{erro}</p>}

            <div className="enter">
              <button type="submit" disabled={enviando}>
                {enviando ? <Carregando texto="Entrando" /> : 'Entrar'}
              </button>
            </div>


            <div className="signup">
              <p>Ainda não tem uma conta? <Link to="/register">Crie uma!</Link></p>
              <p><Link to="/mapas">Entrar como visitante</Link> · <Link to="/">Conheça o HelpyMath</Link></p>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default Login