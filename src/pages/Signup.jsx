import Logo from "../../public/logo.png"
import { Link, useNavigate } from "react-router"
import { MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlinePerson, MdOutlineBadge, MdOutlineEmail, MdOutlinePhone, MdOutlineSchool, MdOutlineLock } from "react-icons/md"
import signupBg from "../assets/usm3.jpg"
import { useEffect, useState } from "react"
import { signup } from "../api/auth.js"
import { clearSession } from "../auth/session.js"
function Signup() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cedula, setCedula] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefonoPrefijo, setTelefonoPrefijo] = useState("0414")
  const [telefonoNumero, setTelefonoNumero] = useState("")
  const [semestre, setSemestre] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (error) setError("")
  }, [nombre, apellido, cedula, correo, telefonoPrefijo, telefonoNumero, semestre, password, password2])

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
    setSuccess(false)

    if (password !== password2) {
      setError("La contraseña debe coincidir")
      return
    }

    const semestreNumero = Number.parseInt(semestre, 10)
    if (!Number.isInteger(semestreNumero) || semestreNumero < 1 || semestreNumero > 10) {
      setError("El semestre debe ser un número entre 1 y 10")
      return
    }

    const telefonoSoloDigitos = telefonoNumero.replace(/\D/g, "")
    let telefonoFinal = ""
    if (telefonoSoloDigitos !== "") {
      if (telefonoSoloDigitos.length !== 7) {
        setError("El teléfono debe tener 7 dígitos (sin el prefijo)")
        return
      }
      telefonoFinal = `${telefonoPrefijo}${telefonoSoloDigitos}`
    }

    setLoading(true)
    try {
      // Ensure we're not carrying a stale session while creating a new account.
      clearSession()
      await signup({
        cedula,
        nombre,
        apellido,
        correo_electronico: correo,
        password,
        telefono: telefonoFinal,
        semestre: semestreNumero,
      })
      setSuccess(true)
      navigate("/login")
    } catch (err) {
      setError(err?.message || "No se pudo crear la cuenta")
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="flex justify-center items-center py-10 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="shadow-2xl shadow-blue-900/20 max-w-[95vw] w-[95vw] sm:w-[500px] h-min py-8 px-6 md:px-10 flex flex-col justify-center items-center gap-4 border border-white/50 bg-white/95 backdrop-blur-md rounded-3xl transition-all"
      >
        <div className="w-24 h-24 rounded-full shadow-md border-2 border-blue-50 bg-white p-2 flex items-center justify-center overflow-hidden mb-2">
          <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="font-extrabold w-full text-center mb-6 text-3xl text-gray-800 tracking-tight">Crear Cuenta</h2>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full flex flex-col gap-1">
            <label htmlFor="nombre" className="text-sm font-semibold text-gray-600 ml-1">Nombre</label>
            <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
              <MdOutlinePerson className="text-gray-400 mr-2 text-xl min-w-[20px]" />
              <input
                type="text"
                id="nombre"
                placeholder="Nombre"
                className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                required
                pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s'-]+"
                title="Solo letras (incluye acentos), espacios, guion y apóstrofe"
                value={nombre}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, "")
                  setNombre(next)
                }}
              />
            </label>
          </div>
          
          <div className="w-full flex flex-col gap-1">
            <label htmlFor="apellido" className="text-sm font-semibold text-gray-600 ml-1">Apellido</label>
            <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
              <MdOutlinePerson className="text-gray-400 mr-2 text-xl min-w-[20px]" />
              <input
                type="text"
                id="apellido"
                placeholder="Apellido"
                className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                required
                pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s'-]+"
                title="Solo letras (incluye acentos), espacios, guion y apóstrofe"
                value={apellido}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, "")
                  setApellido(next)
                }}
              />
            </label>
          </div>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="cedula" className="text-sm font-semibold text-gray-600 ml-1">Cédula</label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineBadge className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type="text"
              id="cedula"
              placeholder="Ej. 12345678"
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              inputMode="numeric"
              autoComplete="username"
              pattern="[0-9]{7,9}"
              required
              minLength={7}
              maxLength={9}
              value={cedula}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 9)
                setCedula(next)
              }}
            />
          </label>
          <p className="validator-hint hidden text-xs text-red-500 ml-1 mt-1">
            Debes ingresar una cédula válida (7 a 9 dígitos)
          </p>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="correo" className="text-sm font-semibold text-gray-600 ml-1">Correo Electrónico</label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineEmail className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type="email"
              id="correo"
              placeholder="correo@ejemplo.com"
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </label>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full flex flex-col gap-1">
            <label htmlFor="telefono" className="text-sm font-semibold text-gray-600 ml-1">Teléfono</label>
            <div className="flex w-full gap-2">
              <select
                id="telefonoPrefijo"
                className="select bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 shadow-sm w-28 cursor-pointer text-gray-700"
                value={telefonoPrefijo}
                onChange={(e) => setTelefonoPrefijo(e.target.value)}
                aria-label="Prefijo de teléfono"
              >
                <option value="0412">0412</option>
                <option value="0414">0414</option>
                <option value="0416">0416</option>
                <option value="0424">0424</option>
                <option value="0426">0426</option>
                <option value="0422">0422</option>
              </select>

              <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                <MdOutlinePhone className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                <input
                  type="tel"
                  id="telefono"
                  placeholder="1234567"
                  className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={7}
                  pattern="[0-9]{7}"
                  value={telefonoNumero}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 7)
                    setTelefonoNumero(next)
                  }}
                />
              </label>
            </div>
          </div>

          <div className="w-full flex flex-col gap-1">
            <label htmlFor="semestre" className="text-sm font-semibold text-gray-600 ml-1">Semestre</label>
            <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
              <MdOutlineSchool className="text-gray-400 mr-2 text-xl min-w-[20px]" />
              <input
                type="number"
                id="semestre"
                placeholder="1 al 10"
                className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                inputMode="numeric"
                min={1}
                max={10}
                step={1}
                required
                value={semestre}
                onChange={(e) => {
                  const next = e.target.value
                  if (next === "") {
                    setSemestre("")
                    return
                  }
                  if (/^\d+$/.test(next)) setSemestre(next)
                }}
              />
            </label>
            <p className="validator-hint hidden text-xs text-red-500 ml-1 mt-1">
              Debes ingresar un semestre entre 1 y 10
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-semibold text-gray-600 ml-1">Contraseña</label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type={visible ? "text" : "password"}
              required
              id="password"
              placeholder="••••••••"
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              minLength={8}
              pattern="(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
              autoComplete="new-password"
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
          <p className="validator-hint hidden text-xs text-red-500 ml-1 mt-1">
            Más de 8 caractéres, incluyendo: un número, una mayúscula y una minúscula
          </p>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="password2" className="text-sm font-semibold text-gray-600 ml-1">Verificar Contraseña</label>
          <label className="input validator flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type={visible ? "text" : "password"}
              required
              id="password2"
              placeholder="••••••••"
              className="w-full py-10 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              minLength={8}
              pattern="(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
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
          <p className="validator-hint hidden text-xs text-red-500 ml-1 mt-1">
            Las contraseñas deben coincidir
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-500 font-medium w-full text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-600 font-medium w-full text-left bg-emerald-50 p-3 rounded-lg border border-emerald-100">Cuenta creada. Redirigiendo...</p>
        ) : null}

        <button
          className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Creando...
            </span>
          ) : "Crear Cuenta"}
        </button>
        <div className="flex flex-col md:flex-row items-center gap-1 mt-2 text-sm text-gray-600">
          <p>¿Ya estás registrado?</p>
          <Link className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-all" to="/login">Iniciar sesión</Link>
        </div>
      </form>
    </div>
  )
}

export default Signup
