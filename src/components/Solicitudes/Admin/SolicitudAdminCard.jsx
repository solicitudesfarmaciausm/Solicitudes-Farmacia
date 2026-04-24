import { useNavigate } from "react-router"
import axios from "axios";
import { deleteSolicitud } from 'src/api/solicitudes

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


const SolicitudAdminCard = ({ solicitud, loading = false }) => {
    const navigate = useNavigate();
const handleDelete = async (event) => {
    event.stopPropagation();
    console.log("[handleDelete] Intentando borrar solicitud", solicitud.id_solicitud);
    if (!window.confirm("¿Estás seguro de borrar esta solicitud?")) {
      console.log("[handleDelete] Borrado cancelado por el usuario");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log("[handleDelete] Token a enviar:", token);

const handleDelete = async (event) => {
  event.stopPropagation();
  if (!window.confirm("¿Estás seguro de borrar esta solicitud?")) {
    console.log("[handleDelete] Borrado cancelado por el usuario");
    return;
  }
  try {
    console.log("[handleDelete] Borrando solicitud con ID", solicitud.id);
    await deleteSolicitud(solicitud.id);
    console.log("[handleDelete] Solicitud borrada correctamente.");
    if (onDelete) onDelete(solicitud.id);
  } catch (err) {
    const msg = err?.payload?.error || err?.message || "No se pudo borrar la solicitud";
    console.error("[handleDelete] Error:", msg, err);
    alert(msg);
  }
};
    if (loading) {
        return (
            <div className="card bg-white shadow-md rounded-2xl p-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">
                        <span className="skeleton h-4 w-20 inline-block align-middle" />
                    </span>
                    <div className="badge badge-soft border">
                        <span className="skeleton h-4 w-16 rounded-full inline-block" />
                    </div>
                </div>
                <h3 className="font-bold text-lg mb-2">
                    <div className="skeleton h-5 w-3/4" />
                </h3>
                <hr className="my-2 text-gray-100"/>
                <div className="flex text-gray-500">
                    <div className="flex flex-col w-1/2 gap-2">
                        <p>Estudiante:</p>
                        <div className="skeleton h-4 w-24" />
                        <p>Tipo</p>
                        <div className="skeleton h-4 w-20" />
                    </div>
                    <div className="flex flex-col w-1/2 gap-2">
                        <p>Cédula:</p>
                        <div className="skeleton h-4 w-24" />
                        <p>Fecha:</p>
                        <div className="skeleton h-4 w-20" />
                    </div>
                </div>
            </div>
        )
    }

    if (!solicitud) return null;

    return(
        <div className="card bg-white shadow-md rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={()=>navigate(`/solicitud-admin/${solicitud.id}`)}>
            <div className="flex justify-between">
                <span className="text-gray-500">ID: #{solicitud.id}</span>
                <div className={`badge badge-soft ${conseguirEstadoColor(solicitud.estado)} border`}>{solicitud.estado}</div>
            </div>
            <h3 className="font-bold text-lg mb-2">{solicitud.titulo}</h3>
            <hr className="my-2 text-gray-100"/>
            <div className="flex  text-gray-500">
                <div className="flex flex-col w-1/2">
                    <p >Estudiante:</p>
                    <p className="font-bold text-gray-500">{solicitud.estudiante}</p>
                    <p>Tipo</p>
                    <p className="font-bold text-gray-500">{solicitud.tipo}</p>
                </div>
                <div className="flex flex-col w-1/2">
                    <p>Cédula:</p>
                    <p className="font-bold text-gray-500">V-{solicitud.cedula}</p>
                    <p>Fecha:</p>
                    <p className="font-bold text-gray-500">{solicitud.fecha}</p>
                </div>
            </div>
            <div className="flex justify-end mt-2">
                <button
                    onClick={handleDelete}
                    className="btn btn-danger"
                    type="button"
                >
                    🗑️ Borrar
                </button>
            </div>
        </div>
    )
}

export default SolicitudAdminCard
