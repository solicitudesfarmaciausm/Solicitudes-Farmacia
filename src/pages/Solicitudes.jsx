import PanelSolicitudesAlumno from "../components/Solicitudes/Alumno/PanelSolicitudesAlumno"
import PanelSolicitudesAdmin from "../components/Solicitudes/Admin/PanelSolicitudesAdmin"
import { canViewAllSolicitudes } from "../auth/session.js";



const Solicitudes = ()=>{
    return(
        <>
            
            {canViewAllSolicitudes() ? <PanelSolicitudesAdmin/> : <PanelSolicitudesAlumno/>}
        </>

        
    )
}
export default Solicitudes