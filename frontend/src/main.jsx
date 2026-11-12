import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { conferirSessao } from './utils/sessao.js'

// Quem entrou sem "Lembrar de mim" sai quando fecha o navegador (utils/sessao.js)
conferirSessao()

// As páginas são baixadas aos pedaços. Se o site foi atualizado com a aba aberta, os pedaços antigos
// somem do servidor: recarrega pra pegar a versão nova. No máximo uma vez a cada 30 s, pra nunca
// ficar recarregando sem fim se o problema for outro (ex: internet caiu).
window.addEventListener('vite:preloadError', (evento) => {
  try {
    const ultima = Number(sessionStorage.getItem('helpymath:recarregouEm') ?? 0)
    if (Date.now() - ultima < 30000) return
    sessionStorage.setItem('helpymath:recarregouEm', String(Date.now()))
  } catch {
    return
  }
  evento.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
