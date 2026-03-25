import { useRef, useState, useEffect } from "react";
import { MdOutlineNotificationsActive, MdOutlineNotificationsNone } from "react-icons/md"
import { Link, useNavigate } from "react-router"
import LogOutModal from "./LogOutModal";
import { getUser } from "../auth/session.js";
import { obtenerNotificaciones, marcarNotificacionLeida, marcarTodasComoLeidas } from "../api/notificaciones.js";
import { CiPill } from "react-icons/ci";

function getUserInitials(user) {
    const nombre = String(user?.nombre ?? '').trim();
    const apellido = String(user?.apellido ?? '').trim();

    const first = nombre ? nombre[0] : '';
    const last = apellido ? apellido[0] : '';

    if (first && last) return (first + last).toUpperCase();
    if (first) return nombre.slice(0, 2).toUpperCase();
    if (last) return apellido.slice(0, 2).toUpperCase();
    return "??";
}

const Navbar = () => {
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    
    const navigate = useNavigate();

    // ... (tus funciones fetchNotificaciones, handleClicNotificacion, etc. se mantienen igual)

    const user = getUser();
    const isCoordinator = user?.id_rol === 3;
    const initials = getUserInitials(user);

    return (
        <>
            <div className="navbar bg-blue-950 text-white shadow-sm sticky z-50 h-16">
                <div className="flex-none mx-4">
                    <Link to="/solicitudes" className="hover:opacity-80 transition-opacity">
                        <CiPill className="text-white" size={"1.5em"}/>
                    </Link>
                </div>
                <div className="flex-1 mx-2">
                    <Link to="/solicitudes" className="text-xl font-medium hover:text-yellow-300 transition-colors">FarmaNET</Link>
                </div>

                {/* --- SECCIÓN NOTIFICACIONES CORREGIDA --- */}
                <div className="flex-none mx-2 dropdown dropdown-end">
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn btn-ghost btn-circle relative"
                        onClick={() => setShowNotifs(!showNotifs)}
                        onBlur={() => setTimeout(() => setShowNotifs(false), 200)}
                    >
                        {noLeidas > 0 ? (
                            <>
                                <MdOutlineNotificationsActive size={"1.5em"} className="text-yellow-400" />
                                <span className="absolute top-0 right-0 rounded-full bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center">
                                    {noLeidas > 9 ? '9+' : noLeidas}
                                </span>
                            </>
                        ) : (
                            <MdOutlineNotificationsNone size={"1.5em"} />
                        )}
                    </div>
                    
                    {showNotifs && (
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-box flex flex-col flex-nowrap z-[1] w-80 p-2 shadow-xl border border-gray-200 text-gray-800 max-h-[70vh] overflow-y-auto mt-4 block"
                        >
                            <li className="menu-title flex flex-row justify-between items-center py-2 px-4 bg-gray-100/50 rounded-t-box border-b border-gray-200 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                                <span className="font-bold text-gray-700">Notificaciones</span>
                                {noLeidas > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMarcarTodas(); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium active:scale-95 transition-transform bg-transparent border-none cursor-pointer">
                                        Marcar leídas
                                    </button>
                                )}
                            </li>
                            
                            {notificaciones.length === 0 ? (
                                <li className="text-center py-6 text-gray-400 text-sm">No tienes notificaciones</li>
                            ) : (
                                notificaciones.map((n) => (
                                    <li key={n.id_notificacion} className="border-b border-gray-100 last:border-0 relative w-full">
                                        <button 
                                            onClick={() => { handleClicNotificacion(n); setShowNotifs(false); }} 
                                            className={`flex flex-col items-start px-4 py-3 gap-1 hover:bg-blue-50 transition-colors w-full rounded-none ${!n.leida ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex justify-between w-full items-start gap-2">
                                                <span className={`text-sm ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                    {n.titulo}
                                                </span>
                                                {!n.leida && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>}
                                            </div>
                                            <span className="text-xs w-full text-left whitespace-normal break-words line-clamp-2">
                                                {n.mensaje}
                                            </span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>

                {/* --- SECCIÓN PERFIL CORREGIDA --- */}
                <div className="flex-none mx-2 dropdown dropdown-end">
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn h-10 w-10 bg-yellow-300 text-blue-950 font-bold rounded-full"
                        onClick={() => setShowProfile(!showProfile)}
                        onBlur={() => setTimeout(() => setShowProfile(false), 200)}
                    >
                        {initials}
                    </div>
                    {showProfile && (
                        <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm text-black block mt-4">
                            <li className="hidden sm:inline">
                                <Link to="/perfil" onClick={() => setShowProfile(false)}>Perfil</Link>
                            </li>
                            {isCoordinator && (
                                <li>
                                    <Link to="/crear-admin" onClick={() => setShowProfile(false)}>Crear Administrador</Link>
                                </li>
                            )}
                            <li>
                                <button onClick={() => { setShowProfile(false); document.getElementById('my_modal_1').showModal(); }}>
                                    Cerrar Sesión
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
            <LogOutModal />
        </>
    );
};
export default Navbar
