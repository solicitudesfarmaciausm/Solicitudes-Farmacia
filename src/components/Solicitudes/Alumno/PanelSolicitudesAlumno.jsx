import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { IoMdAddCircleOutline } from "react-icons/io"
import SolicitudAlumnoCard from "./SolicitudAlumnoCard"
import { IoAdd } from "react-icons/io5"
import { listSolicitudes } from '../../../api/solicitudes.js'

const formatFecha = (iso) => {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return String(iso)
    return date.toLocaleDateString()
}

const useSkeletonCount = (isLoading) => {
    const listRef = useRef(null)
    const measureRef = useRef(null)
    const [count, setCount] = useState(3)

    useLayoutEffect(() => {
        if (!isLoading) return

        const calculate = () => {
            const listEl = listRef.current
            const measureEl = measureRef.current
            if (!listEl || !measureEl) return

            const listRect = listEl.getBoundingClientRect()
            const measureRect = measureEl.getBoundingClientRect()

            const skeletonHeight = Math.max(measureRect.height, 1)
            const remaining = Math.max(window.innerHeight - listRect.top, skeletonHeight)

            const needed = Math.ceil(remaining / skeletonHeight)
            setCount(Math.min(Math.max(needed, 3), 20))
        }

        calculate()
        window.addEventListener('resize', calculate)
        return () => window.removeEventListener('resize', calculate)
    }, [isLoading])

    return { listRef, measureRef, count }
}

const PanelSolicitudesAlumno = () => {
    const [solicitudes, setSolicitudes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const { listRef, measureRef, count: skeletonCount } = useSkeletonCount(loading)

    const currentUserId = useMemo(() => {
        const raw = localStorage.getItem('id_usuario')
        const n = raw ? Number.parseInt(raw, 10) : undefined
        return Number.isFinite(n) ? n : undefined
    }, [])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                setLoading(true)
                setError(null)

                const data = await listSolicitudes({
                    id_estudiante: currentUserId,
                    view: 'full',
                    limit: 50,
                    offset: 0,
                })

                const mapped = (data ?? []).map((s) => ({
                    id: s.id_solicitud,
                    titulo: s.titulo,
                    fecha: formatFecha(s.fecha_creacion),
                    estado: s.estado?.nombre ?? String(s.id_estado_solicitud ?? ''),
                    tipo: s.tipo?.nombre ?? String(s.id_tipo_solicitud ?? ''),
                }))

                if (!cancelled) setSolicitudes(mapped)
            } catch (e) {
                if (!cancelled) setError(e?.message ?? 'Error cargando solicitudes')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [currentUserId])

    return (
        <>
            <div className="w-[90%] justify-between items-center  sm:flex">
                <h1 className="text-3xl sm:text-4xl font-extrabold sm:font-bold text-center my-3">Mis Solicitudes</h1>
                <button className="btn bg-blue-900 text-white rounded-2xl hidden sm:flex sm:items-center my-3 h-12" onClick={() => document.getElementById('solicitudModal').showModal()}>
                    <IoMdAddCircleOutline size="1.5em" className="inline mr-2"/>
                    Agregar Solicitud
                </button>
            </div>
            <button className="btn rounded-full w-15 h-15 bg-blue-800 text-white fixed bottom-20 right-4 z-20 sm:hidden " onClick={() => document.getElementById('solicitudModal').showModal()}>
                <IoAdd size="2em"/>
            </button>   
            
            <div ref={listRef} className="flex flex-col gap-3 w-[90%]">
                {loading && (
                    <>
                        {/* Measure a real skeleton height without showing it */}
                        <div className="absolute -left-[9999px] top-0" aria-hidden="true">
                            <div ref={measureRef}>
                                <SolicitudAlumnoCard loading />
                            </div>
                        </div>
                        {Array.from({ length: skeletonCount }).map((_, idx) => (
                            <SolicitudAlumnoCard key={idx} loading />
                        ))}
                    </>
                )}
                {!loading && error && <div className="text-red-600 text-center font-semibold">{error}</div>}
                {!loading && !error && solicitudes.length === 0 && (
                    <div className="text-gray-500">No hay solicitudes.</div>
                )}
                {!loading && !error && solicitudes.map((solicitud) => (
                    <SolicitudAlumnoCard key={solicitud.id} solicitud={solicitud} />
                ))}
            </div>
        </>
    )
}
export default PanelSolicitudesAlumno