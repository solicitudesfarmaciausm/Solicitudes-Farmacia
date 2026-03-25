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

const fetchNotificaciones = async () => {
    try {
        const data = await obtenerNotificaciones();
        setNotificaciones(data || []);
    } catch (error) {
        console.error("Error fetching notifications", error);
    }
};

useEffect(() => {
    // Fetch initially
    fetchNotificaciones();
    
    // Polling every 30s to keep them updated
    const interval = setInterval(() => {
        fetchNotificaciones()
    }, 30000);
    return () => clearInterval(interval);
}, []);

const noLeidas = notificaciones.filter(n => !n.leida).length;

const handleClicNotificacion = async (notificacion) => {
    if (!notificacion.leida) {
        try {
            await marcarNotificacionLeida(notificacion.id_notificacion);
            setNotificaciones(prev => prev.map(n => n.id_notificacion === notificacion.id_notificacion ? { ...n, leida: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    }
    if (notificacion.enlace) {
        navigate(notificacion.enlace);
    }
};

const handleMarcarTodas = async () => {
    try {
        await marcarTodasComoLeidas();
        setNotificaciones(prev => prev.map(n => ({...n, leida: true})));
    } catch(error) {
        console.error(error);
    }
}
const firstItemRef = useRef(null);
const secondItemRef = useRef(null);
const thirdItemRef = useRef(null);

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

                {/* --- SECCIÓN NOTIFICACIONES --- */}
                {/* Agregamos dropdown-open para forzar visibilidad y dropdown-end para alinear a la derecha */}
                <div className={`flex-none mx-2 dropdown dropdown-end ${showNotifs ? 'dropdown-open' : ''}`} 
                     onBlur={() => setTimeout(() => setShowNotifs(false), 200)}>
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn btn-ghost btn-circle relative"
                        onClick={() => setShowNotifs(!showNotifs)}
                    >
                        {noLeidas > 0 ? (
                            <>
                                <MdOutlineNotificationsActive size={"1.5em"} className="text-yellow-400" />
                                <span className="absolute top-2 right-2 rounded-full bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center">
                                    {noLeidas > 9 ? '9+' : noLeidas}
                                </span>
                            </>
                        ) : (
                            <MdOutlineNotificationsNone size={"1.5em"} />
                        )}
                    </div>
                    
                    {/* El renderizado condicional {showNotifs && ...} es lo que libera el scroll en móvil */}
                    {showNotifs && (
                        <ul className="dropdown-content menu bg-base-100 rounded-box z-[100] w-80 p-2 shadow-xl border border-gray-200 text-gray-800 max-h-[70vh] overflow-y-auto mt-2">
                            <li className="menu-title flex flex-row justify-between items-center py-2 px-4 bg-gray-100/50 rounded-t-box border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                                <span className="font-bold text-gray-700">Notificaciones</span>
                                {noLeidas > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMarcarTodas(); }} className="text-xs text-blue-600 font-medium">
                                        Marcar leídas
                                    </button>
                                )}
                            </li>
                            {notificaciones.length === 0 ? (
                                <li className="text-center py-6 text-gray-400 text-sm">No tienes notificaciones</li>
                            ) : (
                                notificaciones.map((n) => (
                                    <li key={n.id_notificacion} className="border-b border-gray-100 last:border-0">
                                        <button 
                                            onClick={() => { handleClicNotificacion(n); setShowNotifs(false); }} 
                                            className="flex flex-col items-start px-4 py-3 gap-1 hover:bg-blue-50"
                                        >
                                            <span className={`text-sm ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.titulo}</span>
                                            <span className="text-xs text-left line-clamp-2">{n.mensaje}</span>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>

                {/* --- SECCIÓN PERFIL --- */}
                <div className={`flex-none mx-2 dropdown dropdown-end ${showProfile ? 'dropdown-open' : ''}`}
                     onBlur={() => setTimeout(() => setShowProfile(false), 200)}>
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn h-10 w-10 bg-yellow-300 text-blue-950 font-bold rounded-full"
                        onClick={() => setShowProfile(!showProfile)}
                    >
                        {initials}
                    </div>
                    {showProfile && (
                        <ul className="dropdown-content menu bg-base-100 rounded-box z-[100] w-52 p-2 shadow-xl border border-gray-200 text-black mt-2">
                            <li><Link to="/perfil" onClick={() => setShowProfile(false)}>Perfil</Link></li>
                            {isCoordinator && (
                                <li><Link to="/crear-admin" onClick={() => setShowProfile(false)}>Crear Administrador</Link></li>
                            )}
                            <li><button onClick={() => { setShowProfile(false); document.getElementById('my_modal_1').showModal(); }}>Cerrar Sesión</button></li>
                        </ul>
                    )}
                </div>
            </div>
            <LogOutModal />
        </>
    );
};
export default Navbar
