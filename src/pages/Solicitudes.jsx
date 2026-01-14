import { useState } from "react";
import PanelSolicitudesAlumno from "../components/Solicitudes/Alumno/PanelSolicitudesAlumno"
import PanelSolicitudesAdmin from "../components/Solicitudes/Admin/PanelSolicitudesAdmin"



const Solicitudes = ()=>{
    const [isAdmin, setIsAdmin] = useState(false);
    return(
        <>
            {isAdmin ? <PanelSolicitudesAdmin/> : <PanelSolicitudesAlumno/>}
        </>

        
    )
}
export default Solicitudes