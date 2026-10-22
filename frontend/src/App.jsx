import './App.css';
import  { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Home from './Components/Home/Home';
import Mapas from './Components/Mapas/Mapas';
import Questoes from './Components/Questoes/Questoes';
import MapaConceitual from './Components/MapaConceitual/MapaConceitual';
import AdminCriarMapa from './Components/AdminCriarMapa/AdminCriarMapa';
import AdminEditarMapa from './Components/AdminEditarMapa/AdminEditarMapa';
import Introducao from './Components/Introducao/Introducao';

function App() {
  return (
    <div className='App'>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>

          <Route path="/register" element={<Register/>}/>

          {/* Primeira página do site: apresentação pública (não precisa de login) */}
          <Route path="/" element={<Introducao/>}/>

          {/* Endereço antigo da apresentação, pra links salvos não quebrarem */}
          <Route path="/introducao" element={<Navigate to="/" replace/>}/>

          {/* Painel do aluno logado (antes ficava no "/") */}
          <Route path="/inicio" element={<Home/>}/>

          <Route path="/mapas" element={<Mapas/>}/>

          <Route path="/mapas/:id" element={<MapaConceitual/>}/>

          <Route path="/mapas/:mapaId/questoes" element={<Questoes/>}/>

          <Route path="/admin/mapas/criar" element={<AdminCriarMapa/>}/>

          <Route path="/admin/mapas/:id/editar" element={<AdminEditarMapa/>}/>
        </Routes>
      </BrowserRouter>
    </div>

  )
}

export default App;