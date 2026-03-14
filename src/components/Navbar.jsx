import { useRef, useState, useEffect } from "react";
import { TbSchool } from "react-icons/tb"
import { MdOutlineNotificationsActive, MdOutlineNotificationsNone } from "react-icons/md"
import { Link, useNavigate } from "react-router"
import LogOutModal from "./LogOutModal";
import { getUser } from "../auth/session.js";
import { obtenerNotificaciones, marcarNotificacionLeida, marcarTodasComoLeidas } from "../api/notificaciones.js";

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
    const [open, setOpen] = useState(false);
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
            <div className="navbar bg-blue-950 text-white shadow-sm sticky z-10 h-5" >
                <div className="flex-none mx-4">
                    <TbSchool className="text-white" size={"1.5em"}/>
                </div>
                <div className="flex-1 mx-2">
                    <Link to="/solicitudes" className="text-xl">Sistema de Solicitudes</Link>
                </div>
                
                {/* Notificaciones */}
                <div className="flex-none mx-2 dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative">
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
                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-80 p-2 shadow-xl border border-gray-200 text-gray-800 max-h-96 overflow-y-auto mt-4">
                        <li className="menu-title flex flex-row justify-between items-center py-2 px-4 bg-gray-100/50 rounded-t-box border-b border-gray-200">
                            <span className="font-bold text-gray-700">Notificaciones</span>
                            {noLeidas > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); handleMarcarTodas(); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium active:scale-95 transition-transform bg-transparent border-none cursor-pointer">
                                    Marcar todas leídas
                                </button>
                            )}
                        </li>
                        
                        {notificaciones.length === 0 ? (
                            <li className="text-center py-6 text-gray-400 text-sm">No tienes notificaciones</li>
                        ) : (
                            notificaciones.map((n) => (
                                <li key={n.id_notificacion} className="border-b border-gray-100 last:border-0 relative group">
                                    <button 
                                        onClick={() => handleClicNotificacion(n)} 
                                        className={`flex flex-col items-start px-4 py-3 gap-1 hover:bg-blue-50 transition-colors w-full rounded-none ${!n.leida ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex justify-between w-full items-start gap-2">
                                            <span className={`text-sm ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                {n.titulo}
                                            </span>
                                            {!n.leida && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>}
                                        </div>
                                        <span className={`text-xs w-full whitespace-normal text-left line-clamp-2 ${!n.leida ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                                            {n.mensaje}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {new Date(n.fecha_creacion).toLocaleDateString()} {new Date(n.fecha_creacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="flex-none mx-2">
                    <div className="dropdown dropdown-end text-black" >
                        <div tabIndex={0} role="button" className="btn h-10 w-10 bg-yellow-300 text-blue-950 font-bold rounded-full">{initials}</div>
                        <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                            <li className="hidden sm:inline "><Link ref={firstItemRef}  to="/perfil" onClick={()=>{firstItemRef.current?.blur()}} className="active:bg-gray-300 active:text-black">Perfil</Link></li>
                            {isCoordinator && (
                                <li><Link ref={thirdItemRef} to="/crear-admin" onClick={()=>{thirdItemRef.current?.blur()}} className="active:bg-gray-300 active:text-black">Crear Administrador</Link></li>
                            )}
                            <li><button ref={secondItemRef} onClick={()=>{secondItemRef.current?.blur();document.getElementById('my_modal_1').showModal();}} className="active:bg-gray-300 active:text-black" >Cerrar Sesión</button></li>
                        </ul>
                    </div>
                </div>

            </div>
            <LogOutModal />
        </>
    )
}
export default Navbar