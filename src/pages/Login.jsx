import Logo from "../../public/logo.png"

import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md"
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
        className="card shadow-xl max-w-[90vw] w-[90vw] h-min py-3 px-4 md:px-7 md:w-100 text-center flex justify-center items-center gap-3 border border-white/30 bg-white/90 backdrop-blur"
      >
        <div className="card w-25 h-25 border-gray-100 border">
          <img src={Logo} alt="Logo" />
        </div>

        <h2 className="font-bold w-full text-center my-4 text-2xl">Bienvenido</h2>

        <label htmlFor="identifier" className="self-start ml-2">
          Cédula o correo
        </label>
        <label className="input validator rounded-2xl w-full">
          <input
            type="text"
            id="identifier"
            placeholder="Cédula o correo"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </label>
        <p className="validator-hint hidden">Debes ingresar una cédula o correo válido</p>

        <label htmlFor="password" className="self-start ml-2">
          Contraseña
        </label>
        <label className="input validator rounded-2xl w-full">
          <input
            type={visible ? "text" : "password"}
            required
            id="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="cursor-pointer btn btn-circle w-8 h-8 p-1 relative overflow-hidden active:scale-100! active:translate-y-0!"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <span
              className={[
                "absolute inset-0 flex items-center justify-center",
                "transition-all duration-200 ease-out",
                visible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90",
              ].join(" ")}
            >
              <MdOutlineVisibilityOff size="1.5em" />
            </span>

            <span
              className={[
                "absolute inset-0 flex items-center justify-center",
                "transition-all duration-200 ease-out",
                visible ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0",
              ].join(" ")}
            >
              <MdOutlineVisibility size="1.5em" />
            </span>
          </button>
        </label>

        {error ? (
          <p className="text-sm text-error w-full text-left">{error}</p>
        ) : null}

        <button
          className="btn bg-blue-900 text-white rounded-2xl w-full my-3"
          type="submit"
          disabled={loading}
        >
          {loading ? "Iniciando..." : "Iniciar Sesión"}
        </button>

        <div className="xs:mdflex-col md:flex">
          <p>¿No tienes una cuenta?</p>
          <Link className="link link-primary md:mx-1" to="/signup">
            Regístrate
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Login
