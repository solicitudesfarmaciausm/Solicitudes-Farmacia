import { useRef, useState } from "react";
import { TbSchool } from "react-icons/tb"
import { Link } from "react-router"
import LogOutModal from "./LogOutModal";

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const firstItemRef = useRef(null);
    const secondItemRef = useRef(null);
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
                    <div class="dropdown dropdown-end text-black" >
                    <div tabindex="0" role="button" class="btn h-10 w-10 bg-yellow-300 text-blue-950 font-bold rounded-full">DG</div>
                        <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                            <li className="hidden sm:inline "><Link ref={firstItemRef}  to="/perfil" onClick={()=>{firstItemRef.current?.blur()}} className="active:bg-gray-300 active:text-black">Perfil</Link></li>
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