import { PiNewspaperLight } from "react-icons/pi";
import { RxAvatar } from "react-icons/rx";
import { Link, Outlet, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import SolicitudModal from "../components/Solicitudes/Alumno/SolicitudModal";
import { IoAdd } from "react-icons/io5";

const AppLayout = () =>{
    const location = useLocation()
    return (
        <div className="h-screen max-h-screen w-screen gap-0">
                <Navbar/>
                <SolicitudModal />
            <div className="flex flex-col h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] sm:h-screen overflow-y-scroll items-center w-full pt-4 pb-32 sm:pb-4 box-border">

                <Outlet/>

            </div>
            
            <div className="w-screen sm:hidden h-15 bg-white m-0 z-10 fixed bottom-0 left-0 flex items-center border-t border-gray-300">
                <Link to="/solicitudes" className={`flex flex-col items-center ${location.pathname === "/solicitudes" ? "text-blue-900 font-extrabold" : "text-gray-700"} w-[50%] active:bg-blue-200 h-full justify-center`}>
                    <PiNewspaperLight size="1.5em" />
                    <span className="text-xs">Solicitudes</span>
                </Link>
                <Link to="/perfil" className={`flex flex-col items-center ${location.pathname === "/perfil" ? "text-blue-900 font-extrabold" : "text-gray-700"} w-[50%] active:bg-blue-200 h-full justify-center`}>
                    <RxAvatar size="1.5em" />
                    <span className="text-xs">Perfil</span>
                </Link>
            </div>
        </div>

    )
}

export default AppLayout;