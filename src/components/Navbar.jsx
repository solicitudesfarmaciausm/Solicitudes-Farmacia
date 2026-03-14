import { useRef, useState } from "react";
import { TbSchool } from "react-icons/tb"
import { Link } from "react-router"
import LogOutModal from "./LogOutModal";
import { getUser } from "../auth/session.js";

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
                <div className="flex-none mx-2" >
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