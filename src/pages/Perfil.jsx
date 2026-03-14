import { useMemo, useState } from "react";
import { MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlineBadge, MdOutlinePerson, MdOutlineEmail, MdOutlinePhone, MdOutlineLock } from "react-icons/md";
import { getUser, setSession } from "../auth/session.js";
import { updateUser } from "../api/usuarios.js";
import { changePassword } from "../api/auth.js";

const PHONE_PREFIXES = ["0412", "0414", "0416", "0424", "0426", "0422"];

function splitTelefono(rawTelefono) {
  const digits = String(rawTelefono ?? "").replace(/\D/g, "");
  const allowed = new Set(PHONE_PREFIXES);

  if (!digits) {
    return { prefijo: "0414", numero: "" };
  }

  const tryFrom11 = (d) => {
    if (d.length !== 11) return null;
    if (!d.startsWith("04")) return null;
    const prefijo = d.slice(0, 4);
    const numero = d.slice(4);
    return {
      prefijo: allowed.has(prefijo) ? prefijo : "0414",
      numero: numero.slice(0, 7),
    };
  };

  // Most common format: 0414 + 7 digits
  const direct = tryFrom11(digits);
  if (direct) return direct;

  // Sometimes stored with country code or extra digits; try last 11.
  if (digits.length > 11) {
    const last11 = digits.slice(-11);
    const fromLast = tryFrom11(last11);
    if (fromLast) return fromLast;
  }

  // If only the 7-digit part exists.
  if (digits.length === 7) {
    return { prefijo: "0414", numero: digits };
  }

  // Fallback: keep last 7 digits.
  return { prefijo: "0414", numero: digits.slice(-7) };
}

const Perfil = () => {
  const user = getUser();

  const telefonoInicial = useMemo(() => splitTelefono(user?.telefono), [user?.telefono]);

  const [correo, setCorreo] = useState(user?.correo_electronico ?? "");
  const [telefonoPrefijo, setTelefonoPrefijo] = useState(telefonoInicial.prefijo);
  const [telefonoNumero, setTelefonoNumero] = useState(telefonoInicial.numero);

  // Password Change State
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdateDatos = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (telefonoNumero.length !== 7) {
      setMsg({ type: 'error', text: 'El número de teléfono debe tener 7 dígitos' });
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `${telefonoPrefijo}${telefonoNumero}`;
      
      const updates = {
        correo_electronico: correo,
        telefono: fullPhone,
      };

      await updateUser(user.id_usuario, updates);
      
      const newUser = { ...user, ...updates }; 
      setSession({ user: newUser });

      setMsg({ type: 'success', text: 'Datos actualizados correctamente' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error actualizando datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setMsg({ type: 'success', text: 'Contraseña cambiada correctamente' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error cambiando contraseña' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">No has iniciado sesión</div>;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-4 gap-6 animate-fade-in-up">
      <h2 className="font-bold w-full text-center mt-4 text-3xl sm:text-4xl text-blue-900">Mi Perfil</h2>
      
      {msg.text && (
        <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'} shadow-lg w-full max-w-2xl`}>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl items-stretch justify-center">
        
        {/* Card Datos Personales */}
        <div className="card bg-base-100 shadow-xl w-full border border-gray-100 flex flex-col">
          <div className="card-body flex flex-col h-full">
            <h3 className="card-title text-xl mb-4 border-b pb-2">Datos Personales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="w-full flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 ml-1">Cédula</label>
                  <label className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 w-full shadow-sm opacity-70 cursor-not-allowed">
                    <MdOutlineBadge className="text-gray-500 mr-2 text-xl min-w-[20px]" />
                    <input type="text" value={user.cedula} disabled className="w-full  bg-transparent outline-none text-gray-500 cursor-not-allowed" />
                  </label>
               </div>
               <div className="w-full flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 ml-1">Nombre y Apellido</label>
                  <label className="flex items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 w-full shadow-sm opacity-70 cursor-not-allowed">
                    <MdOutlinePerson className="text-gray-500 mr-2 text-xl min-w-[20px]" />
                    <input type="text" value={`${user.nombre} ${user.apellido}`} disabled className="w-full  bg-transparent outline-none text-gray-500 cursor-not-allowed" />
                  </label>
               </div>
            </div>

            <form onSubmit={handleUpdateDatos} className="flex flex-col gap-4 mt-4 flex-grow">
              <div className="w-full flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600 ml-1" htmlFor="correo">Correo Electrónico</label>
                <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                  <MdOutlineEmail className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                  <input 
                    type="email" 
                    id="correo"
                    required 
                    className="w-full  bg-transparent outline-none text-gray-800 placeholder-gray-400" 
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </label>
              </div>

              <div className="w-full flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600 ml-1" htmlFor="telefono">Teléfono</label>
                <div className="flex w-full gap-2">
                  <select
                    id="telefonoPrefijo"
                    className="select bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 shadow-sm w-32 cursor-pointer text-gray-700 font-normal"
                    value={telefonoPrefijo}
                    onChange={(e) => setTelefonoPrefijo(e.target.value)}
                  >
                    {PHONE_PREFIXES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                    <MdOutlinePhone className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                    <input
                      type="tel"
                      id="telefono"
                      className="w-full  bg-transparent outline-none text-gray-800 placeholder-gray-400"
                      placeholder="1234567"
                      maxLength={7}
                      pattern="\d{7}"
                      value={telefonoNumero}
                      onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-auto pt-4">
                 <button type="submit" className={`w-full bg-blue-900 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-blue-800 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={loading}>
                    {loading ? "Actualizando..." : "Actualizar Información"}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card Seguridad */}
        <div className="card bg-base-100 shadow-xl w-full border border-gray-100 flex flex-col mb-15 md:mb-0">
           <div className="card-body flex flex-col h-full">
              <h3 className="card-title text-xl mb-4 border-b pb-2">Seguridad</h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 flex-grow">
                 
                 <div className="w-full flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 ml-1" htmlFor="currentPassword">Contraseña Actual</label>
                    <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                        <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                        <input
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            required
                            placeholder="••••••••"
                            className="w-full  bg-transparent outline-none text-gray-800 placeholder-gray-400"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button type="button" className="text-gray-400 hover:text-blue-600 ml-2 transition-colors w-8 h-8 p-1 relative flex justify-center items-center active:scale-95" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <MdOutlineVisibilityOff size="1.2em"/> : <MdOutlineVisibility size="1.2em"/>}
                        </button>
                    </label>
                 </div>

                 <div className="w-full flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 ml-1" htmlFor="newPassword">Nueva Contraseña</label>
                    <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                        <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                        <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            required
                            minLength={8}
                            placeholder="••••••••"
                            className="w-full  bg-transparent outline-none text-gray-800 placeholder-gray-400"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                            title="Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número"
                        />
                        <button type="button" className="text-gray-400 hover:text-blue-600 ml-2 transition-colors w-8 h-8 p-1 relative flex justify-center items-center active:scale-95" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <MdOutlineVisibilityOff size="1.2em"/> : <MdOutlineVisibility size="1.2em"/>}
                        </button>
                    </label>
                    <p className="text-xs text-gray-500 ml-1 mt-1">Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número.</p>
                 </div>

                 <div className="w-full flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 ml-1" htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                    <label className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/20 shadow-sm">
                        <MdOutlineLock className="text-gray-400 mr-2 text-xl min-w-[20px]" />
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            required
                            placeholder="••••••••"
                            className="w-full  bg-transparent outline-none text-gray-800 placeholder-gray-400"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" className="text-gray-400 hover:text-blue-600 ml-2 transition-colors w-8 h-8 p-1 relative flex justify-center items-center active:scale-95" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <MdOutlineVisibilityOff size="1.2em"/> : <MdOutlineVisibility size="1.2em"/>}
                        </button>
                    </label>
                 </div>

                 <div className="mt-auto pt-4">
                    <button type="submit" className={`w-full bg-yellow-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-yellow-600 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? "Cambiando..." : "Cambiar Contraseña"}
                    </button>
                 </div>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};
export default Perfil