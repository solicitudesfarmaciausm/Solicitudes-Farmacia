import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Solicitudes from './pages/Solicitudes.jsx'
import AppLayout from './Layout/AppLayout.jsx'
import Perfil from './pages/Perfil.jsx'
import Solicitud from './pages/Solicitud.jsx'
import SolicitudAdmin from './components/Solicitudes/Admin/SolicitudAdmin.jsx'
import SolicitudAlumno from './components/Solicitudes/Alumno/SolicitudAlumno.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import RedirectIfAuth from './auth/RedirectIfAuth.jsx'
import RootRedirect from './auth/RootRedirect.jsx'
import CrearAdmin from './pages/CrearAdmin.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<RedirectIfAuth><Login/></RedirectIfAuth>}/>
        <Route path="/signup" element={<RedirectIfAuth><Signup/></RedirectIfAuth>}/>
        <Route element={<RequireAuth><AppLayout/></RequireAuth>}>
          <Route path="/solicitudes" element={<Solicitudes/>}/>
          <Route path="/perfil" element={<Perfil/>}/>
          <Route path="/solicitud/:id" element={<Solicitud/>}/>
          <Route path="/solicitud-admin/:id" element={<SolicitudAdmin/>}/>
          <Route path='/solicitud-alumno/:id' element={<SolicitudAlumno/>}/>
        </Route>
      </Routes>
    
    </BrowserRouter>
  </StrictMode>
)
