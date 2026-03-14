import { Link, Navigate } from "react-router"
import { isAuthenticated } from "../auth/session.js"
import bg from "../assets/usm3.jpg"
import Logo from "../../public/logo.png"

export default function Landing() {
  if (isAuthenticated()) {
    return <Navigate to="/solicitudes" replace />
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center relative w-full"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative z-10 flex flex-col items-center p-8 sm:p-12 bg-base-100/95 rounded-3xl shadow-2xl max-w-lg text-center mx-4 backdrop-blur-sm border border-base-200 ">
        <img src={Logo} alt="Logo USM" className="w-32 mb-6 drop-shadow-sm rounded-full border-2 border-gray-100 bg-white" />
        <h1 className="text-3xl sm:text-4xl font-bold text-base-content mb-4 text-balance">
          FarmaNET
        </h1>
        <p className="text-base-content/70 mb-8 max-w-sm">
          Plataforma centralizada para la gestión y seguimiento de solicitudes estudiantiles dela Facultad de Farmacia de la USM.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
          <Link to="/login" className="btn btn-primary w-full sm:w-40 text-lg">
            Ingresar
          </Link>
          <Link to="/signup" className="btn btn-outline btn-primary w-full sm:w-40 text-lg">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}
