import { useNavigate } from "react-router"

const conseguirEstadoColor = (estado) => {
    const normalizado = (estado ?? "").toString().trim().toLowerCase()

    switch (normalizado) {
        case "recibido":
            return "badge-info"
        case "en proceso":
            return "badge-warning"
        case "resuelto":
            return "badge-success"
        case "rechazado":
            return "badge-error"
        default:
            return "badge-neutral"
    }
}


const SolicitudAlumnoCard = ({ solicitud, loading = false }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="card bg-white shadow-md rounded-2xl p-4 w-full">
                <div className="flex justify-between">
                    <span className="text-gray-500">
                        <span className="skeleton inline-block h-[1em] w-24 align-middle"></span>
                    </span>
                    <div className="badge bg-base-200 border-0 outline-none shadow-none font-bold">
                        <span className="skeleton inline-block h-[1em] w-20 align-middle"></span>
                    </div>
                </div>
                <h3 className="font-bold text-lg mb-2">
                    <span className="skeleton inline-block h-[1em] w-2/3 align-middle"></span>
                </h3>
                <hr className="my-2 text-gray-100"/>
                <div className="flex justify-between text-gray-500">
                    <p>
                        <span className="font-semibold">Tipo:</span>{' '}
                        <span className="skeleton inline-block h-[1em] w-24 align-middle"></span>
                    </p>
                    <p>
                        <span className="font-semibold">Fecha:</span>{' '}
                        <span className="skeleton inline-block h-[1em] w-24 align-middle"></span>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className="card bg-white shadow-md rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/solicitud/${solicitud.id}`)}
            >
                <div className="flex justify-between">
                    <span className="text-gray-500">ID: #{solicitud.id}</span>
                    <div className={`badge ${conseguirEstadoColor(solicitud.estado)} text-white font-bold`}>{solicitud.estado}</div>
                </div>
                <h3 className="font-bold text-lg mb-2">{solicitud.titulo}</h3>
                <hr className="my-2 text-gray-100"/>
                <div className="flex justify-between text-gray-500">
                    <p><span className="font-semibold">Tipo:</span> {solicitud.tipo}</p>
                    <p><span className="font-semibold">Fecha:</span> {solicitud.fecha}</p>

                </div>
            </div>
        </>
    )
}

export default SolicitudAlumnoCard
