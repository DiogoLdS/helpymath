import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { conferirSessao } from './utils/sessao.js'

// Quem entrou sem "Lembrar de mim" sai quando fecha o navegador (utils/sessao.js)
conferirSessao()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
