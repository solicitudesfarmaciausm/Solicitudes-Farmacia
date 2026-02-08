import Logo from "../../public/logo.png"
import { Link, useNavigate } from "react-router"
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md"
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
    <div className="flex justify-center items-center py-5">
      <form
        onSubmit={handleSubmit}
        className="card shadow-xl bg-white/90 backdrop-blur-2xl border border-white/30 max-w-[90vw] w-[90vw] h-min py-3  px-4 md:px-7 md:w-100 text-center flex justify-center items-center gap-3 "
      >
        <div className="card w-25 h-25 border-gray-100 border">

          <img src={Logo} alt="Logo" />
        </div>

        <h2 className="font-bold w-full text-center my-4 text-2xl">Crear Cuenta</h2>
        <label htmlFor="nombre" className="self-start ml-2">Nombre</label>
        <label className="input validator rounded-2xl w-full">

          <input
            type="text"
            id="nombre"
            placeholder="Nombre"
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
        
        <label htmlFor="apellido" className="self-start ml-2">Apellido</label>
        <label className="input validator rounded-2xl w-full">

          <input
            type="text"
            id="apellido"
            placeholder="Apellido"
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

        <label htmlFor="cedula" className="self-start ml-2">Cédula</label>
        <label className="input validator rounded-2xl w-full">

          <input
            type="text"
            id="cedula"
            placeholder="Cédula"
            inputMode="numeric"
            autoComplete="username"
            pattern="\\d{7,9}"
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
        <p className="validator-hint hidden">
              Debes ingresar una cédula
        </p>
        <label htmlFor="correo" className="self-start ml-2">Correo Electrónico</label>
        <label className="input validator rounded-2xl w-full">

          <input
            type="email"
            id="correo"
            placeholder="Correo"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </label>

        <label htmlFor="telefono" className="self-start ml-2">Teléfono</label>
        <div className="flex w-full gap-2">
          <select
            id="telefonoPrefijo"
            className="select rounded-2xl w-28 cursor-pointer"
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

          <label className="input validator rounded-2xl w-full">
            <input
              type="tel"
              id="telefono"
              placeholder="1234567"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={7}
              pattern="\\d{7}"
              value={telefonoNumero}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 7)
                setTelefonoNumero(next)
              }}
            />
          </label>
        </div>
        <label htmlFor="semestre" className="self-start ml-2">Semestre</label>
        <label className="input validator rounded-2xl w-full">

          <input
            type="number"
            id="semestre"
            placeholder="Semestre"
            inputMode="numeric"
            min={1}
            max={10}
            step={1}
            required
            value={semestre}
            onChange={(e) => {
              const next = e.target.value
              // Allow empty while typing; otherwise keep only digits.
              if (next === "") {
                setSemestre("")
                return
              }
              if (/^\d+$/.test(next)) setSemestre(next)
            }}
          />
        </label>

        <p className="validator-hint hidden">
          Debes ingresar un semestre entre 1 y 10
        </p>

        <label htmlFor="password" className="self-start ml-2">Contraseña</label>
        <label className="input validator rounded-2xl w-full">


          <input
            type={visible ? "text" : "password"}
            required
            id="password"
            placeholder="Contraseña"
            minLength={8}
            pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
            autoComplete="new-password"
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
            <p className="validator-hint hidden">
              La contraseña deben ser más de 8 caractéres, incluyendo:
              <br />Al menos un número <br />Al menos una mayúscula <br />Al menos una minúscula
            </p>
            <label htmlFor="password" className="self-start ml-2">Verificar Contraseña</label>
        <label className="input validator rounded-2xl w-full">


          <input
            type={visible ? "text" : "password"}
            required
            id="password2"
            placeholder="Verifique su contraseña"
            minLength={8}
            pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
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
            <p className="validator-hint hidden">
              La contraseña debe coincidir
            </p>

        {error ? (
          <p className="text-sm text-error w-full text-left">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-success w-full text-left">Cuenta creada. Redirigiendo...</p>
        ) : null}

        <button
          className="btn bg-blue-900 text-white rounded-2xl w-full my-3"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Cuenta"}
        </button>
        <div className="xs:mdflex-col md:flex">
          <p>¿Ya estás registrado?</p>
          <Link className="link link-primary md:mx-1" to="/login">Iniciar sesión</Link>
        </div>
      </form>
    </div>
  )
}

export default Signup
