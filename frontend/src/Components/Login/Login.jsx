import { useState } from 'react'
import "./Login.css"
import { Link, useNavigate } from "react-router";
import api from '../../../services/api.js';
import Sidebar from "../Sidebar/SidebarChapeu";

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');

  const navigate = useNavigate();

  async function logUser(e) {
    e.preventDefault();

    try {
      const login = await api.post('/logUsuario', { email, senha });

      if (login.status == 200) {
        localStorage.setItem('token', login.data);
        navigate('/');
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  // {
  //   "email": "aerfdfcqer",
  //   "senha": "sla2"
  // }


  return (
    <>
      <main className='mainLogin'>
        <Sidebar />

        <section className="login">
          <form onSubmit={logUser}>
            <h1>Faça seu login</h1>

            <div className="input-field">
              <input type="text" id="user" name="user" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="E-mail" />
            </div>

            <div className="input-field">
              <input type="password" id="password" name="password" value={senha} onChange={(e) => { setPassword(e.target.value) }} placeholder="Senha" />
            </div>

            <div className="remember-me">
              <label><input type="checkbox" id="remember-me" name="remember-me" />Lembrar de mim</label>

              <a href="#">Esqueceu a senha?</a>
            </div>

            <div className="enter">
              <button type="submit">Entrar</button>
            </div>


            <div className="signup">
              <p>Ainda não tem uma conta? <Link to="/register">Crie uma!</Link></p>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default Login