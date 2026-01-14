import { useEffect, useMemo, useState } from 'react'
import { IoSearchOutline } from "react-icons/io5"
import SolicitudAdminCard from "./SolicitudAdminCard"
import SolicitudAdminTabla from "./SolicitudAdminTabla"

import { listSolicitudes } from '../../../api/solicitudes.js'

const formatFecha = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleDateString()
}

const fullName = (u) => {
    if (!u) return ''
    return [u.nombre, u.apellido].filter(Boolean).join(' ').trim()
}

const toAdminRow = (s) => {
    const estudiante = fullName(s.estudiante) || 'Sin estudiante'
    const cedula = s.estudiante?.cedula ?? ''
    const asignadoA = fullName(s.personal_asignado) || 'Sin asignar'
    return {
        id: s.id_solicitud,
        titulo: s.titulo,
        fecha: formatFecha(s.fecha_creacion),
        estado: s.estado?.nombre ?? String(s.id_estado_solicitud ?? ''),
        tipo: s.tipo?.nombre ?? String(s.id_tipo_solicitud ?? ''),
        estudiante,
        cedula,
        asignadoA,
    }
}

const PanelSolicitudesAdmin = () => {
    const [solicitudes, setSolicitudes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [q, setQ] = useState('')
    const [estado, setEstado] = useState('')
    const [tipo, setTipo] = useState('')
    const [asignadoA, setAsignadoA] = useState('')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await listSolicitudes({ view: 'full', limit: 200, offset: 0 })
                if (cancelled) return
                setSolicitudes((data ?? []).map(toAdminRow))
            } catch (e) {
                if (!cancelled) setError(e?.message ?? 'Error cargando solicitudes')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    const estadosDisponibles = useMemo(() => {
        return Array.from(new Set(solicitudes.map(s => s.estado).filter(Boolean)))
    }, [solicitudes])

    const tiposDisponibles = useMemo(() => {
        return Array.from(new Set(solicitudes.map(s => s.tipo).filter(Boolean)))
    }, [solicitudes])

    const asignadosDisponibles = useMemo(() => {
        return Array.from(new Set(solicitudes.map(s => s.asignadoA).filter(Boolean)))
    }, [solicitudes])

    const solicitudesFiltradas = useMemo(() => {
        const query = q.trim().toLowerCase()
        return solicitudes.filter((s) => {
            if (estado && s.estado !== estado) return false
            if (tipo && s.tipo !== tipo) return false
            if (asignadoA && s.asignadoA !== asignadoA) return false
            if (!query) return true

            return (
                s.titulo?.toLowerCase().includes(query) ||
                s.estudiante?.toLowerCase().includes(query) ||
                String(s.cedula ?? '').toLowerCase().includes(query) ||
                String(s.id ?? '').includes(query)
            )
        })
    }, [solicitudes, q, estado, tipo, asignadoA])

    return (
        <>
            <div className="w-[90%] justify-between items-center sm:flex">
                <h1 className="text-3xl sm:text-4xl sm:font-bold text-center my-3">
                    Panel Administrativo de Solicitudes
                </h1>
            </div>

            <label className="input rounded-full py-2 my-4 w-[90%] sm:w-[40%]">
                <IoSearchOutline size="1.5em" />
                <input
                    type="search"
                    placeholder="Buscar por título, estudiante, cédula o ID"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full"
                />
            </label>

            <div className="w-[90%] flex flex-col sm:flex-row sm:flex-wrap my-2 gap-2 justify-center">
                <select
                    className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                >
                    <option value="">Estado (Todos)</option>
                    {estadosDisponibles.map((e) => (
                        <option key={e} value={e}>{e}</option>
                    ))}
                </select>

                <select
                    className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                >
                    <option value="">Tipo (Todos)</option>
                    {tiposDisponibles.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                <select
                    className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                >
                    <option value="">Asignado a (Todos)</option>
                    {asignadosDisponibles.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {loading && (
                <>
                    {/* Mobile: compact card-like skeletons */}
                    <div className="w-[90%] flex flex-col gap-3 lg:hidden">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <SolicitudAdminCard key={idx} loading />
                        ))}
                    </div>

                    {/* Desktop: table-shaped skeleton matching the real table */}
                    <table className="hidden lg:table w-[90%]">
                        <thead>
                            <tr>
                                <th className="py-2"><div className="skeleton h-4 w-10"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-24"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-20"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-20"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-16"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-12"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-20"></div></th>
                                <th className="py-2"><div className="skeleton h-4 w-14"></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <tr key={idx}>
                                    <td className="py-2"><div className="skeleton h-4 w-12"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-40"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-28"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-56"></div></td>
                                    <td className="py-2"><div className="skeleton h-5 w-24 rounded-full"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-28"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-32"></div></td>
                                    <td className="py-2"><div className="skeleton h-4 w-24"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {!loading && error && (
                <div className="text-red-600 w-[90%] text-center font-semibold">{error}</div>
            )}

            {!loading && !error && solicitudesFiltradas.length === 0 && (
                <div className="w-[90%] text-center text-gray-500 py-8">
                    No hay resultados para los filtros seleccionados.
                </div>
            )}

            <div className="flex flex-col gap-3 w-[90%] lg:hidden">
                {!loading && !error && solicitudesFiltradas.length > 0 && solicitudesFiltradas.map((solicitud) => (
                    <SolicitudAdminCard key={solicitud.id} solicitud={solicitud} />
                ))}
            </div>
            {!loading && !error && solicitudesFiltradas.length > 0 && (
                <SolicitudAdminTabla solicitudes={solicitudesFiltradas} />
            )}
        </>
    )
}
export default PanelSolicitudesAdmin