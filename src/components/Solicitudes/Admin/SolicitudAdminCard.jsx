import { useNavigate } from "react-router";
import axios from "axios";
import { deleteSolicitud } from 'src/api/solicitudes'; // <--- Corregido: Comilla y punto y coma

const conseguirEstadoColor = (estado) => {
    const normalizado = (estado ?? "").toString().trim().toLowerCase();
    switch (normalizado) {
        case "recibido": return "badge-info border-info";
        case "en proceso": return "badge-warning border-warning";
        case "resuelto": return "badge-success border-success";
        case "rechazado": return "badge-error border-error";
        default: return "badge-neutral border-neutral";
    }
};

// Añadimos 'onDelete' a los props para que el padre pueda refrescar la lista
const SolicitudAdminCard = ({ solicitud, loading = false, onDelete }) => {
    const navigate = useNavigate();

    const handleDelete = async (event) => {
        event.stopPropagation(); // Evita que se abra el detalle al hacer clic en borrar

        // Usamos id_solicitud o id según lo que envíe tu backend
        const idActual = solicitud.id_solicitud || solicitud.id;

        if (!window.confirm("¿Estás seguro de borrar esta solicitud?")) return;

        try {
            console.log("[handleDelete] Borrando ID:", idActual);
            await deleteSolicitud(idActual);
            
            console.log("[handleDelete] Borrada con éxito");
            if (onDelete) onDelete(idActual);
            alert("Solicitud eliminada correctamente");
        } catch (err) {
            const msg = err?.payload?.error || err?.message || "No se pudo borrar la solicitud";
            console.error("[handleDelete] Error:", msg);
            alert(msg);
        }
    };

    if (loading) {
        return (
            <div className="card bg-white shadow-md rounded-2xl p-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500"><span className="skeleton h-4 w-20 inline-block" /></span>
                    <div className="badge badge-soft border"><span className="skeleton h-4 w-16 rounded-full inline-block" /></div>
                </div>
                <h3 className="font-bold text-lg mb-2"><div className="skeleton h-5 w-3/4" /></h3>
                <hr className="my-2 text-gray-100"/>
                <div className="flex text-gray-500">
                    <div className="flex flex-col w-1/2 gap-2">
                        <p>Estudiante:</p><div className="skeleton h-4 w-24" />
                    </div>
                </div>
            </div>
        );
    }

    if (!solicitud) return null;

    return (
        <div 
            className="card bg-white shadow-md rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => navigate(`/solicitud-admin/${solicitud.id_solicitud || solicitud.id}`)}
        >
            <div className="flex justify-between">
                <span className="text-gray-500">ID: #{solicitud.id_solicitud || solicitud.id}</span>
                <div className={`badge badge-soft ${conseguirEstadoColor(solicitud.estado)} border`}>
                    {solicitud.estado}
                </div>
            </div>
            
            <h3 className="font-bold text-lg mb-2">{solicitud.titulo}</h3>
            <hr className="my-2 text-gray-100"/>
            
            <div className="flex text-gray-500">
                <div className="flex flex-col w-1/2">
                    <p>Estudiante:</p>
                    <p className="font-bold text-gray-700">{solicitud.estudiante}</p>
                    <p className="mt-2">Tipo:</p>
                    <p className="font-bold text-gray-700">{solicitud.tipo}</p>
                </div>
                <div className="flex flex-col w-1/2">
                    <p>Cédula:</p>
                    <p className="font-bold text-gray-700">V-{solicitud.cedula}</p>
                    <p className="mt-2">Fecha:</p>
                    <p className="font-bold text-gray-700">{solicitud.fecha}</p>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <button
                    onClick={handleDelete}
                    className="btn btn-error btn-sm text-white"
                    type="button"
                >
                    🗑️ Borrar
                </button>
            </div>
        </div>
    );
};

export default SolicitudAdminCard;
