import "./Register.css"
import { Link, useNavigate } from "react-router";
import Sidebar from "../Sidebar/SidebarChapeu";

//  Integração com o servidor por meio da api
import api from '../../../services/api.js';
import { useState } from "react";
import useTituloPagina from "../../utils/useTituloPagina.js";
import Marca from "../Marca/Marca.jsx";

const Register = () => {
    useTituloPagina("Criar conta");


  const [nome, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');

  const navigate = useNavigate();

  async function registerUser(e) {
    e.preventDefault();

    try {
      console.log("Dados:", {
        nome,
        email,
        senha
      });
      const response = await api.post('/registrarUsuario', { nome, email, senha });

      console.log("Usuário registrado com sucesso!" + "\n" + response.data);
      
      navigate('/login');
    } catch (error) {
      console.log(error.message);
    }
  }
  return (
    <>
      <main className='mainRegister'>
        <Sidebar />

        <section className="register">
          <form onSubmit={registerUser}>
            <Marca grande />
            <h1>Crie uma conta</h1>

            <div className="input-field">
              <input type="text" id="user" name="user" placeholder="Seu nome de usuário *" value={nome} required onChange={(e) => { setUsername(e.target.value) }} />
            </div>

            <div className="input-field">
              <input type="email" id="email" name="email" placeholder="Seu e-mail *" value={email} required onChange={(e) => { setEmail(e.target.value) }} />
  
            </div>

            <div className="input-field">
              <input type="password" id="password" name="password" placeholder="Sua senha *" value={senha} required onChange={(e) => { setPassword(e.target.value) }} />
        
            </div>


            <div className="terms">
              <label><input type="checkbox" id="terms" name="terms" /><p>Eu concordo com os <a href="#">Termos e Condições</a></p></label>
            </div>

            <div className="enter">
              <button type="submit">Registre-se</button>
            </div>

            <div className="signup">
              <p>Já tem uma conta? <Link to="/login">Entre!</Link></p>
              <p><Link to="/introducao">Conheça o HelpyMath</Link></p>
            </div>
          </form>
        </section>
      </main>
    </>
  )

}

export default Register