import { useNavigate } from "react-router"
import { FaTrashAlt } from "react-icons/fa"
const conseguirEstadoColor = (estado) => {
    const normalizado = (estado ?? "").toString().trim().toLowerCase()

    switch (normalizado) {
        case "recibido":
            return "badge-info border-info"
        case "en proceso":
            return "badge-warning border-warning"
        case "resuelto":
            return "badge-success border-success"
        case "rechazado":
            return "badge-error border-error"
        default:
            return "badge-neutral border-neutral"
    }
}


const SolicitudAdminTabla = ({solicitudes}) => {
    const navigate = useNavigate();
    return (
        <table className="hidden lg:table w-[90%]">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>ESTUDIANTE</th>
                    <th>CÉDULA</th>
                    <th>TÍTULO</th>
                    <th>ESTADO</th>
                    <th>TIPO</th>
                    <th>ASIGNADO A</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                
                {solicitudes.map((solicitud) => (
                    <tr key={solicitud.rowKey ?? solicitud.id} className="hover:bg-gray-100 cursor-pointer" onClick={()=>navigate(`/solicitud-admin/${solicitud.id}`)}>
                        <td className="font-bold">#{solicitud.id}</td>
                        <td>{solicitud.estudiante}</td>
                        <td>V-{solicitud.cedula}</td>
                        <td>{solicitud.titulo}</td>
                        <td>
                            <div className={`badge badge-soft ${conseguirEstadoColor(solicitud.estado)} border`}>
                                
                                {solicitud.estado}
                            </div>
                        </td>
                        <td>{solicitud.tipo}</td>
                        <td>{solicitud.asignadoA}</td>
                        <td>{solicitud.fecha}</td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={(e) => handleDelete(e, solicitud.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Eliminar solicitud"
                            >
                                <FaTrashAlt size="1.1em" /> {/* O usa 🗑️ */}
                            </button>
                        </td>
                    </tr>
                ))}    

            </tbody>
        </table>
    )
}

export default SolicitudAdminTabla
