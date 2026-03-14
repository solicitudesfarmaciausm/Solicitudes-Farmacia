import { useMemo, useState } from "react";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
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
               <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Cédula</span></label>
                  <input type="text" value={user.cedula} disabled className="input input-bordered w-full bg-gray-100 text-gray-500" />
               </div>
               <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Nombre y Apellido</span></label>
                  <input type="text" value={`${user.nombre} ${user.apellido}`} disabled className="input input-bordered w-full bg-gray-100 text-gray-500" />
               </div>
            </div>

            <form onSubmit={handleUpdateDatos} className="flex flex-col gap-4 mt-4 flex-grow">
              <div className="form-control">
                <label className="label" htmlFor="correo"><span className="label-text">Correo Electrónico</span></label>
                <input 
                  type="email" 
                  id="correo"
                  required 
                  className="input input-bordered w-full rounded-2xl" 
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="telefono"><span className="label-text">Teléfono</span></label>
                <div className="flex w-full gap-2">
                  <select
                    id="telefonoPrefijo"
                    className="select select-bordered rounded-2xl w-32"
                    value={telefonoPrefijo}
                    onChange={(e) => setTelefonoPrefijo(e.target.value)}
                  >
                    {PHONE_PREFIXES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    id="telefono"
                    className="input input-bordered w-full rounded-2xl"
                    placeholder="1234567"
                    maxLength={7}
                    pattern="\d{7}"
                    value={telefonoNumero}
                    onChange={(e) => setTelefonoNumero(e.target.value.replace(/\D/g, "").slice(0, 7))}
                  />
                </div>
              </div>

              <div className="form-control mt-auto pt-4">
                 <button type="submit" className={`btn bg-blue-900 text-white rounded-2xl hover:bg-blue-800 w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                    Actualizar Información
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card Seguridad */}
        <div className="card bg-base-100 shadow-xl w-full border border-gray-100 flex flex-col">
           <div className="card-body flex flex-col h-full">
              <h3 className="card-title text-xl mb-4 border-b pb-2">Seguridad</h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 flex-grow">
                 
                 <div className="form-control">
                    <label className="label" htmlFor="currentPassword"><span className="label-text">Contraseña Actual</span></label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            required
                            className="input input-bordered w-full rounded-2xl pr-10"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button type="button" className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <MdOutlineVisibilityOff size="1.2em"/> : <MdOutlineVisibility size="1.2em"/>}
                        </button>
                    </div>
                 </div>

                 <div className="form-control">
                    <label className="label" htmlFor="newPassword"><span className="label-text">Nueva Contraseña</span></label>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        required
                        minLength={8}
                        className="input input-bordered w-full rounded-2xl"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número"
                    />
                    <label className="label">
                        <span className="label-text-alt text-gray-500">Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número.</span>
                    </label>
                 </div>

                 <div className="form-control">
                    <label className="label" htmlFor="confirmPassword"><span className="label-text">Confirmar Nueva Contraseña</span></label>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        required
                        className="input input-bordered w-full rounded-2xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                 </div>

                 <div className="form-control mt-auto pt-4">
                    <button type="submit" className={`btn btn-warning rounded-2xl text-white w-full ${loading ? 'loading' : ''}`} disabled={loading}>
                        Cambiar Contraseña
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