import Logo from "../../public/logo.png"
import { useNavigate } from "react-router"
import { MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlinePerson, MdOutlineBadge, MdOutlineEmail, MdOutlinePhone, MdOutlineLock } from "react-icons/md"
import signupBg from "../assets/usm3.jpg"
import { useEffect, useState } from "react"
import { signupAdmin } from "../api/auth.js"
import { getUser } from "../auth/session.js"

function CrearAdmin() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cedula, setCedula] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefonoPrefijo, setTelefonoPrefijo] = useState("0414")
  const [telefonoNumero, setTelefonoNumero] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const user = getUser();
  
  useEffect(() => {
    if (user?.id_rol !== 3) {
      navigate('/solicitudes');
    }
  }, [user, navigate])

  useEffect(() => {
    if (error) setError("")
  }, [nombre, apellido, cedula, correo, telefonoPrefijo, telefonoNumero, password, password2])

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    setError("")
    setSuccess(false)

    if (password !== password2) {
      setError("La contraseña debe coincidir")
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
      await signupAdmin({
        cedula,
        nombre,
        apellido,
        correo_electronico: correo,
        password,
        telefono: telefonoFinal,
      })
      setSuccess(true)
      // clear form
      setNombre(""); setApellido(""); setCedula(""); setCorreo(""); 
      setTelefonoNumero(""); setPassword(""); setPassword2("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message || "No se pudo crear el administrador")
    } finally {
      setLoading(false)
    }
  }
  
  const campos = [
    {
      id: "nombre",
      label: "Nombre",
      icon: <MdOutlinePerson className="text-gray-400 mr-2 text-xl min-w-[20px]" />,
      type: "text",
      placeholder: "Nombre",
      value: nombre,
      setValue: (v) => setNombre(v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, "")),
      required: true,
      pattern: "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s'-]+",
      title: "Solo letras (incluye acentos), espacios, guion y apóstrofe",
    },
    {
      id: "apellido",
      label: "Apellido",
      icon: <MdOutlinePerson className="text-gray-400 mr-2 text-xl min-w-[20px]" />,
      type: "text",
      placeholder: "Apellido",
      value: apellido,
      setValue: (v) => setApellido(v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, "")),
      required: true,
      pattern: "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s'-]+",
      title: "Solo letras (incluye acentos), espacios, guion y apóstrofe",
    },
    {
      id: "cedula",
      label: "Cédula",
      icon: <MdOutlineBadge className="text-gray-400 mr-2 text-xl min-w-[20px]" />,
      type: "text",
      placeholder: "Ej. 12345678",
      value: cedula,
      setValue: (v) => setCedula(v.replace(/\D/g, "").slice(0, 9)),
      required: true,
      pattern: "[0-9]{7,9}",
      minLength: 7,
      maxLength: 9,
      inputMode: "numeric",
    },
    {
      id: "correo",
      label: "Correo Electrónico",
      icon: <MdOutlineEmail className="text-gray-400 mr-2 text-xl min-w-[20px]" />,
      type: "email",
      placeholder: "correo@ejemplo.com",
      value: correo,
      setValue: setCorreo,
      required: true,
    },
  ];

  return (
    <div className="flex justify-center py-8 ">
      <form
        onSubmit={handleSubmit}
        className="shadow-xl bg-white w-[95vw] sm:w-[500px] h-min py-8 px-6 md:px-10 flex flex-col justify-center items-center gap-4 border border-gray-200 rounded-3xl transition-all"
      >
        <div className="w-24 h-24 rounded-full shadow-md border-2 border-blue-50 bg-white p-2 flex items-center justify-center overflow-hidden mb-2">
          <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="font-extrabold w-full text-center mb-6 text-3xl text-gray-800 tracking-tight">Crear Administrador</h2>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {campos.slice(0, 2).map((campo) => (
            <div className="w-full flex flex-col gap-1" key={campo.id}>
              <label htmlFor={campo.id} className="text-sm font-semibold text-gray-600 ml-1">{campo.label}</label>
              <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                {campo.icon}
                <input
                  type={campo.type}
                  id={campo.id}
                  placeholder={campo.placeholder}
                  className="w-full py-0 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  required={campo.required}
                  pattern={campo.pattern}
                  title={campo.title}
                  value={campo.value}
                  onChange={(e) => campo.setValue(e.target.value)}
                />
              </label>
            </div>
          ))}
        </div>

        {campos.slice(2).map((campo) => (
          <div className="w-full flex flex-col gap-1" key={campo.id}>
            <label htmlFor={campo.id} className="text-sm font-semibold text-gray-600 ml-1">{campo.label}</label>
            <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
              {campo.icon}
              <input
                type={campo.type}
                id={campo.id}
                placeholder={campo.placeholder}
                className="w-full py-0 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                required={campo.required}
                pattern={campo.pattern}
                minLength={campo.minLength}
                maxLength={campo.maxLength}
                inputMode={campo.inputMode}
                value={campo.value}
                onChange={(e) => campo.setValue(e.target.value)}
              />
            </label>
          </div>
        ))}

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="telefono" className="text-sm font-semibold text-gray-600 ml-1">Teléfono</label>
          <div className="flex w-full gap-2">
            <select
              id="telefonoPrefijo"
              className="select bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 shadow-sm w-28 cursor-pointer text-gray-700"
              value={telefonoPrefijo}
              onChange={(e) => setTelefonoPrefijo(e.target.value)}
            >
              <option value="0412">0412</option>
              <option value="0414">0414</option>
              <option value="0416">0416</option>
              <option value="0424">0424</option>
              <option value="0426">0426</option>
              <option value="0422">0422</option>
            </select>

            <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
              <MdOutlinePhone className="text-gray-400 mr-2 text-xl min-w-[20px]" />
              <input
                type="tel"
                id="telefono"
                placeholder="1234567"
                className="w-full py-0 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                inputMode="numeric"
                maxLength={7}
                pattern="\d{7}"
                required
                value={telefonoNumero}
                onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, "").slice(0, 7))}
              />
            </label>
          </div>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-semibold text-gray-600 ml-1">Contraseña</label>
          <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type={visible ? "text" : "password"}
              required
              id="password"
              placeholder="••••••••"
              className="w-full py-0 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors w-8 h-8 p-1 relative overflow-hidden active:scale-95 flex items-center justify-center"
              onClick={() => setVisible(!visible)}
            >
              <span className={visible ? "hidden" : "block"}><MdOutlineVisibilityOff size="1.2em" /></span>
              <span className={visible ? "block" : "hidden"}><MdOutlineVisibility size="1.2em" /></span>
            </button>
          </label>
          <p className="text-xs text-gray-500 ml-1 mt-1">
            Más de 8 caractéres, incluyendo: un número, una mayúscula y una minúscula
          </p>
        </div>

        <div className="w-full flex flex-col gap-1">
          <label htmlFor="password2" className="text-sm font-semibold text-gray-600 ml-1">Verificar Contraseña</label>
          <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
            <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
            <input
              type={visible ? "text" : "password"}
              required
              id="password2"
              placeholder="••••••••"
              className="w-full py-0 bg-transparent outline-none text-gray-800 placeholder-gray-400"
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500 font-medium w-full text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
        {success && <p className="text-sm text-emerald-600 font-medium w-full text-left bg-emerald-50 p-3 rounded-lg border border-emerald-100">Administrador creado exitosamente.</p>}

        <button
          className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Administrador"}
        </button>
      </form>
    </div>
  )
}

export default CrearAdmin
