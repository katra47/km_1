import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Router
import { BrowserRouter, Routes, Route } from "react-router-dom"

// Componentes
import App from './App.jsx'
import Cor from './Regiones/Cor.jsx'
import Nor from './Regiones/Nor.jsx'
import Pet from './Regiones/Pet.jsx'
import NavBar from './NavBar.jsx'
import Admin from './Regiones/Admin.jsx' // 🔥 IMPORTANTE
import Ia from './IA/Ia.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cor" element={<Cor />} />
        <Route path="/nor" element={<Nor />} />
        <Route path="/pet" element={<Pet />} />
        <Route path="/admin" element={<Admin />} /> {/* 🔐 protegido */}
        <Route path="/ia" element={<Ia />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)