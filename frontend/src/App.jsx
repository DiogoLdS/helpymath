import './App.css';
import './identidade.css';
import './responsivo.css';
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Introducao from './Components/Introducao/Introducao';
import Carregando from './Components/Carregando/Carregando';
import ErroPagina from './Components/ErroPagina/ErroPagina';

// Cada página vira um arquivo separado, baixado só quando a pessoa abre a página.
// A apresentação ("/") vem junto no arquivo principal: é a primeira coisa que quase todo mundo vê.
const Login = lazy(() => import('./Components/Login/Login'));
const Register = lazy(() => import('./Components/Register/Register'));
const Home = lazy(() => import('./Components/Home/Home'));
const Mapas = lazy(() => import('./Components/Mapas/Mapas'));
const Questoes = lazy(() => import('./Components/Questoes/Questoes'));
const MapaConceitual = lazy(() => import('./Components/MapaConceitual/MapaConceitual'));
const AdminCriarMapa = lazy(() => import('./Components/AdminCriarMapa/AdminCriarMapa'));
const AdminEditarMapa = lazy(() => import('./Components/AdminEditarMapa/AdminEditarMapa'));
const Perfil = lazy(() => import('./Components/Perfil/Perfil'));
const BoasVindas = lazy(() => import('./Components/BoasVindas/BoasVindas'));
const Ranking = lazy(() => import('./Components/Ranking/Ranking'));
const Revisar = lazy(() => import('./Components/Revisar/Revisar'));
const PaginaTermos = lazy(() => import('./Components/Termos/PaginaTermos'));
const NaoEncontrada = lazy(() => import('./Components/NaoEncontrada/NaoEncontrada'));

function App() {
  return (
    <div className='App'>
      <BrowserRouter>
        {/* Enquanto o arquivo da página chega, mostra o mesmo "carregando" do resto do site */}
        <ErroPagina>
        <Suspense fallback={<Carregando pagina texto="Abrindo a página" />}>
        <Routes>
          <Route path="/login" element={<Login/>}/>

          <Route path="/register" element={<Register/>}/>

          {/* Primeira página do site: apresentação pública (não precisa de login) */}
          <Route path="/" element={<Introducao/>}/>

          {/* Endereço antigo da apresentação, pra links salvos não quebrarem */}
          <Route path="/introducao" element={<Navigate to="/" replace/>}/>

          {/* Painel do aluno logado (antes ficava no "/") */}
          <Route path="/inicio" element={<Home/>}/>

          {/* Perfil do aluno logado (ícone de pessoa da barra lateral) */}
          <Route path="/perfil" element={<Perfil/>}/>

          {/* Perguntas logo depois do cadastro: objetivo, nível (ou teste diagnóstico) e meta da semana */}
          <Route path="/boas-vindas" element={<BoasVindas/>}/>

          {/* Revisar erros: questões erradas de todos os mapas num lugar só */}
          <Route path="/revisar" element={<Revisar/>}/>

          {/* Ranking de pontos dos alunos (semana e geral) */}
          <Route path="/ranking" element={<Ranking/>}/>

          <Route path="/mapas" element={<Mapas/>}/>

          <Route path="/mapas/:id" element={<MapaConceitual/>}/>

          <Route path="/mapas/:mapaId/questoes" element={<Questoes/>}/>

          <Route path="/admin/mapas/criar" element={<AdminCriarMapa/>}/>

          <Route path="/admin/mapas/:id/editar" element={<AdminEditarMapa/>}/>

          {/* Termos de uso e privacidade (abre sem conta) */}
          <Route path="/termos" element={<PaginaTermos/>}/>
          <Route path="/privacidade" element={<Navigate to="/termos" replace/>}/>

          {/* Qualquer outro endereço: página 404 */}
          <Route path="*" element={<NaoEncontrada/>}/>
        </Routes>
        </Suspense>
        </ErroPagina>
      </BrowserRouter>
    </div>

  )
}

export default App;