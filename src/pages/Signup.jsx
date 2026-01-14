import Logo from "../../public/logo.png"
import { Link } from "react-router"
import { MdOutlineVisibility} from "react-icons/md"
import signupBg from "../assets/usm3.jpg"
import { useEffect } from "react"
function Signup() {
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
  

  return (
    <div className="flex justify-center items-center py-5">


      <div className="card shadow-xl bg-white/90 backdrop-blur-2xl border border-white/30 max-w-[90vw] w-[90vw] h-min py-3  px-4 md:px-7 md:w-100 text-center flex justify-center items-center gap-3 ">
        <div className="card w-25 h-25 border-gray-100 border">

          <img src={Logo}/>
        </div>

        <h2 className="font-bold w-full text-center my-4 text-2xl">Crear Cuenta</h2>
        <label htmlFor="nombre" className="self-start ml-2">Nombre</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="nombre" placeholder="Nombre" pattern="/\d{8}/" required minlength="8"/>
        </label>
        
        <label htmlFor="apellido" className="self-start ml-2">Apellido</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="apellido" placeholder="Apellido" pattern="/\d{8}/" required minlength="8"/>
        </label>

        <label htmlFor="cedula" className="self-start ml-2">Cédula</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="cedula" placeholder="Cédula" pattern="/\d{8}/" required minlength="8"/>
        </label>
        <p className="validator-hint hidden">
              Debes ingresar una cédula
        </p>
        <label htmlFor="correo" className="self-start ml-2">Correo Electrónico</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="correo" placeholder="Correo" pattern="/\d{8}/" required minlength="8"/>
        </label>

        <label htmlFor="telefono" className="self-start ml-2">Teléfono</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="telefono" placeholder="Teléfono" pattern="/\d{8}/" required minlength="8"/>
        </label>
        <label htmlFor="semestre" className="self-start ml-2">Semestre</label>
        <label className="input validator rounded-2xl w-full">

          <input type="text" id="semestre" placeholder="Semestre" pattern="/\d{8}/" required minlength="8" />
        </label>

        <label htmlFor="password" className="self-start ml-2">Contraseña</label>
        <label className="input validator rounded-2xl w-full">


          <input
            type="password"
            required
            id="password"
            placeholder="Contraseña"
            minlength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
          />
          <MdOutlineVisibility size="1.5em"/>

        </label>
            <p className="validator-hint hidden">
              La contraseña deben ser más de 8 caractéres, incluyendo:
              <br />Al menos un número <br />Al menos una mayúscula <br />Al menos una minúscula
            </p>
            <label htmlFor="password" className="self-start ml-2">Verificar Contraseña</label>
        <label className="input validator rounded-2xl w-full">


          <input
            type="password"
            required
            id="password"
            placeholder="Verifique su contraseña"
            minlength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
          />
          <MdOutlineVisibility size="1.5em"/>
        </label>
            <p className="validator-hint hidden">
              La contraseña deben ser más de 8 caractéres, incluyendo:
              <br />Al menos un número <br />Al menos una mayúscula <br />Al menos una minúscula
            </p>
        <button className="btn bg-blue-900 text-white rounded-2xl w-full my-3">Crear Cuenta</button>
        <div className="xs:mdflex-col md:flex">
          <p>¿Ya estás registrado?</p>
          <Link className="link link-primary md:mx-1" to="/login">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  )
}

export default Signup
