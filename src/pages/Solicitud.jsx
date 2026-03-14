import SolicitudAdminCard from "../components/Solicitudes/Admin/SolicitudAdminCard";
import SolicitudAlumno from "../components/Solicitudes/Alumno/SolicitudAlumno";
import { canViewAllSolicitudes } from "../auth/session.js";

const Solicitud = () => {
    return (
        <>
            {canViewAllSolicitudes() ? <SolicitudAdminCard/> : <SolicitudAlumno/>}
        </>
    )
}
export default Solicitud