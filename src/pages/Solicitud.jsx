import { useState } from "react";
import SolicitudAdminCard from "../components/Solicitudes/Admin/SolicitudAdminCard";
import SolicitudAlumno from "../components/Solicitudes/Alumno/SolicitudAlumno";

const Solicitud = () => {
    const [isAdmin, setIsAdmin] = useState(true);
    return (
        <>
            {isAdmin ? <SolicitudAdminCard/> : <SolicitudAlumno/>}
        </>
    )
}
export default Solicitud