import Logo from "../../public/logo.png"

import { MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlinePerson, MdOutlineLock } from "react-icons/md"
import { Link, useNavigate } from "react-router"
import signupBg from "../assets/usm3.jpg"
import { useEffect, useState } from "react"
import { login } from "../api/auth.js"
import { setSession } from "../auth/session.js"

function Login() {

  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (error) setError("")
  }, [identifier, password])

  useEffect(() => {
    const prev = {
      backgroundImage: document.body.style.backgroundImage,
      backgroundSize: document.body.style.backgroundSize,
      backgroundPosition: document.body.style.backgroundPosition,
      backgroundRepeat: document.body.style.backgroundRepeat,
      backgroundAttachment: document.body.style.backgroundAttachment,
      backgroundColor: document.body.style.backgroundColor,
    }
    const overlay = 0.3
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${signupBg})`
    document.body.style.backgroundSize = "cover"
    document.body.style.backgroundPosition = "center"
    document.body.style.backgroundRepeat = "no-repeat"
    document.body.style.backgroundAttachment = "fixed"
    document.body.style.backgroundColor = "#000" // opcional por si la imagen tarda en cargar

    return () => {
      document.body.style.backgroundImage = prev.backgroundImage
      document.body.style.backgroundSize = prev.backgroundSize
      document.body.style.backgroundPosition = prev.backgroundPosition
      document.body.style.backgroundRepeat = prev.backgroundRepeat
      document.body.style.backgroundAttachment = prev.backgroundAttachment
      document.body.style.backgroundColor = prev.backgroundColor
    }
  }, [])  

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    setError("")
    setLoading(true)
    try {
      const data = await login({ cedulaOrEmail: identifier.trim(), password })
      setSession({ token: data?.token, user: data?.user })
      navigate("/solicitudes")
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center h-screen items-center">
      <form
        onSubmit={handleSubmit}
        className="shadow-2xl shadow-blue-900/20 max-w-[90vw] w-[90vw] sm:w-[400px] h-min py-8 px-6 md:px-10 flex flex-col justify-center items-center gap-4 border border-white/50 bg-white/95 backdrop-blur-md rounded-3xl transition-all"
      >
        <div className="w-24 h-24 rounded-full shadow-md border-2 border-blue-50 bg-white p-2 flex items-center justify-center overflow-hidden">
          <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="font-extrabold w-full text-center mt-2 mb-4 text-3xl text-gray-800 tracking-tight">Bienvenido</h2>
        {error ? (
          <p className="text-sm text-red-500 font-medium w-full text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
        ) : null}
        <div className="w-full flex flex-col gap-1">
          <label htmlFor="identifier" className="self-start text-sm font-semibold text-gray-600 ml-1">
            Cédula o correo
          </label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlinePerson className="text-gray-400 mr-2 text-xl min-w-5" />
            <input
              type="text"
              id="identifier"
              placeholder="Ej. 12345678 o correo@ejemplo.com"
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400 overflow-hidden"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </label>
          <p className="validator-hint hidden text-xs text-red-500 ml-1 mt-1">Debes ingresar una cédula o correo válido</p>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="password" className="self-start text-sm font-semibold text-gray-600 ml-1">
            Contraseña
          </label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-5" />
            <input
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              type={visible ? "text" : "password"}
              required
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors w-8 h-8 p-1 relative overflow-hidden active:scale-95"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <span
                className={[
                  "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out",
                  visible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90",
                ].join(" ")}
              >
                <MdOutlineVisibilityOff size="1.2em" />
              </span>

              <span
                className={[
                  "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out",
                  visible ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0",
                ].join(" ")}
              >
                <MdOutlineVisibility size="1.2em" />
              </span>
            </button>
          </label>
        </div>



        <button
          className="w-full bg-linear-to-r from-blue-800 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Iniciando...
            </span>
          ) : "Iniciar Sesión"}
        </button>

        <div className="flex flex-col md:flex-row items-center gap-1 mt-2 text-sm text-gray-600">
          <p>¿No tienes una cuenta?</p>
          <Link className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-all" to="/signup">
            Regístrate
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login
