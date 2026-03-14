import { useEffect, useMemo, useRef, useState } from 'react'
import { IoSearchOutline, IoDownloadOutline } from "react-icons/io5"
import SolicitudAdminCard from "./SolicitudAdminCard"
import SolicitudAdminTabla from "./SolicitudAdminTabla"

import { listSolicitudes } from '../../../api/solicitudes.js'

// TEST ONLY: multiply the displayed list size without needing many DB rows.
// Set to 1 to disable.
const TEST_REPEAT = 10

const PAGE_SIZE = 25

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

const toAdminRow = (s, keySuffix = '') => {
    const estudiante = fullName(s.estudiante) || 'Sin estudiante'
    const cedula = s.estudiante?.cedula ?? ''
    const asignadoA = fullName(s.personal_asignado) || 'Sin asignar'
    return {
        rowKey: `${s.id_solicitud}${keySuffix}`,
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

const repeatRows = (rows, times, keySeed = '') => {
    const t = Number(times)
    if (!Number.isFinite(t) || t <= 1) return rows

    const out = []
    for (let i = 0; i < t; i++) {
        for (let j = 0; j < rows.length; j++) {
            const r = rows[j]
            out.push({
                ...r,
                rowKey: `${r.id}-${keySeed}-${i}-${j}`,
            })
        }
    }
    return out
}

const PanelSolicitudesAdmin = () => {
    const [solicitudes, setSolicitudes] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)

    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const sentinelRef = useRef(null)

    const [q, setQ] = useState('')
    const [estado, setEstado] = useState('')
    const [tipo, setTipo] = useState('')
    const [asignadoA, setAsignadoA] = useState('')

    const handleDownloadReport = () => {
        if (!solicitudesFiltradas.length) {
            alert("No hay datos para exportar");
            return;
        }

        const headers = ["ID", "Título", "Fecha", "Estado", "Tipo", "Estudiante", "Cédula", "Asignado A"];
        
        const csvRows = [headers.join(",")];
        
        solicitudesFiltradas.forEach(row => {
            const values = [
                row.id,
                `"${(row.titulo || "").replace(/"/g, '""')}"`,
                `"${(row.fecha || "").replace(/"/g, '""')}"`,
                `"${(row.estado || "").replace(/"/g, '""')}"`,
                `"${(row.tipo || "").replace(/"/g, '""')}"`,
                `"${(row.estudiante || "").replace(/"/g, '""')}"`,
                `"${(row.cedula || "").replace(/"/g, '""')}"`,
                `"${(row.asignadoA || "").replace(/"/g, '""')}"`
            ];
            csvRows.push(values.join(","));
        });

        const csvContent = "\ufeff" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_solicitudes_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        let cancelled = false

        const loadPage = async ({ nextOffset, mode }) => {
            const isInitial = mode === 'initial'
            try {
                if (isInitial) {
                    setLoading(true)
                    setSolicitudes([])
                    setOffset(0)
                    setHasMore(true)
                } else {
                    setLoadingMore(true)
                }

                setError(null)

                const data = await listSolicitudes({ view: 'full', limit: PAGE_SIZE, offset: nextOffset })
                if (cancelled) return

                const rows = (data ?? []).map((s, idx) => toAdminRow(s, `-${nextOffset}-${idx}`))
                const repeated = repeatRows(rows, TEST_REPEAT, String(nextOffset))

                setSolicitudes((prev) => (isInitial ? repeated : [...prev, ...repeated]))
                setOffset(nextOffset + PAGE_SIZE)
                setHasMore((data ?? []).length === PAGE_SIZE)
            } catch (e) {
                if (!cancelled) setError(e?.message ?? 'Error cargando solicitudes')
            } finally {
                if (cancelled) return
                if (isInitial) setLoading(false)
                else setLoadingMore(false)
            }
        }

        loadPage({ nextOffset: 0, mode: 'initial' })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        if (loading || loadingMore) return
        if (!hasMore || error) return

        const obs = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    // Use functional state reads by capturing current offset from state.
                    setLoadingMore(true)
                    listSolicitudes({ view: 'full', limit: PAGE_SIZE, offset })
                        .then((data) => {
                            const rows = (data ?? []).map((s, idx) => toAdminRow(s, `-${offset}-${idx}`))
                            const repeated = repeatRows(rows, TEST_REPEAT, String(offset))
                            setSolicitudes((prev) => [...prev, ...repeated])
                            setOffset(offset + PAGE_SIZE)
                            setHasMore((data ?? []).length === PAGE_SIZE)
                        })
                        .catch((e) => {
                            setError(e?.message ?? 'Error cargando solicitudes')
                        })
                        .finally(() => setLoadingMore(false))
                }
            },
            { root: null, rootMargin: '300px 0px', threshold: 0.01 }
        )

        obs.observe(el)
        return () => obs.disconnect()
    }, [offset, hasMore, loading, loadingMore, error])

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
                <button
                    className="btn btn-primary sm:btn-sm btn-outline rounded-2xl gap-2 mt-3 sm:mt-0"
                    onClick={handleDownloadReport}
                    title="Descargar reporte de solicitudes visibles (CSV)"
                >
                    <IoDownloadOutline size="1.2em" />
                    Exportar Reporte
                </button>
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
                    <SolicitudAdminCard key={solicitud.rowKey ?? solicitud.id} solicitud={solicitud} />
                ))}
            </div>
            {!loading && !error && solicitudesFiltradas.length > 0 && (
                <SolicitudAdminTabla solicitudes={solicitudesFiltradas} />
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 w-full" />
            {!loading && !error && loadingMore && (
                <div className="w-[90%] text-center text-gray-500 py-3">Cargando más...</div>
            )}
        </>
    )
}
export default PanelSolicitudesAdmin