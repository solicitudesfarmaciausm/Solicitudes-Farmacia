import { useEffect, useMemo, useRef, useState } from 'react'
import { IoSearchOutline, IoDownloadOutline } from "react-icons/io5"
import SolicitudAdminCard from "./SolicitudAdminCard"
import SolicitudAdminTabla from "./SolicitudAdminTabla"
import { getUser } from '../../../auth/session.js'
import { listSolicitudes, deleteSolicitudesMultiple } from '../../../api/solicitudes.js'

function usePageSize() {
    const [pageSize, setPageSize] = useState(window.innerWidth < 1024 ? 10 : 25);
    useEffect(() => {
        function handleResize() {
            setPageSize(window.innerWidth < 1024 ? 10 : 25);
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    },[]);
    return pageSize;
}

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
        fechaIso: s.fecha_creacion,
        /* GUARDAMOS LOS IDs PARA PODER FILTRAR CORRECTAMENTE */
        id_estado: s.id_estado_solicitud, 
        estado: s.estado?.nombre ?? String(s.id_estado_solicitud ?? ''),
        id_tipo: s.id_tipo_solicitud,
        tipo: s.tipo?.nombre ?? String(s.id_tipo_solicitud ?? ''),
        id_asignado: s.id_personal_asignado,
        asignadoA,
        estudiante,
        cedula,
    }
}

const PanelSolicitudesAdmin = () => {
    const PAGE_SIZE = usePageSize();
    const currentUser = getUser()
    const [solicitudes, setSolicitudes] = useState([])
    const[loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)

    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const sentinelRef = useRef(null)

    const [q, setQ] = useState('')
    const[estado, setEstado] = useState('')
    const [tipo, setTipo] = useState('')
    const[asignadoA, setAsignadoA] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

    // ESTADOS PARA GUARDAR LAS OPCIONES DE LOS SELECTS CON SU ID Y NOMBRE
    const [estadosDisponibles, setEstadosDisponibles] = useState([]);
    const [tiposDisponibles, setTiposDisponibles] = useState([]);
    const [asignadosDisponibles, setAsignadosDisponibles] = useState([]);

    const hayFiltrosActivos = q !== '' || estado !== '' || tipo !== '' || asignadoA !== '' || fechaInicio !== '' || fechaFin !== ''

    const limpiarFiltros = () => {
        setQ('')
        setEstado('')
        setTipo('')
        setFechaInicio('')
        setFechaFin('')
        if (currentUser?.id_rol === 3) {
            setAsignadoA('')
        }
    }

// --- LÓGICA DE BORRADO MASIVO ---
    const handleBorrarFiltrados = async () => {
        if (!solicitudes.length) {
            alert("No hay solicitudes para borrar.");
            return;
        }

        const idsABorrar = solicitudes.map(s => s.id);
        const cantidad = idsABorrar.length;

        const mensaje = hayFiltrosActivos 
            ? `¿Estás seguro de eliminar las ${cantidad} solicitudes que coinciden con los filtros actuales?`
            : `¿Estás seguro de eliminar TODAS las solicitudes cargadas (${cantidad})?`;

        if (!window.confirm(mensaje + "\n\nEsta acción no se puede deshacer.")) return;

        try {
            setLoading(true);
            await deleteSolicitudesMultiple(idsABorrar);
            alert(`${cantidad} solicitudes eliminadas correctamente.`);
            window.location.reload(); // Recarga para limpiar la lista
        } catch (err) {
            console.error("Error en borrado masivo:", err);
            alert("Error al intentar borrar: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };    
    // ACUMULAMOS LAS OPCIONES SEGÚN LO QUE CARGUE LA TABLA PARA QUE NO DESAPAREZCAN AL FILTRAR
    useEffect(() => {
        if (!solicitudes.length) return;

        setEstadosDisponibles(prev => {
            const map = new Map(prev.map(e => [e.id, e]));
            solicitudes.forEach(s => { if (s.id_estado && s.estado) map.set(s.id_estado, { id: s.id_estado, nombre: s.estado }); });
            return Array.from(map.values());
        });

        setTiposDisponibles(prev => {
            const map = new Map(prev.map(e => [e.id, e]));
            solicitudes.forEach(s => { if (s.id_tipo && s.tipo) map.set(s.id_tipo, { id: s.id_tipo, nombre: s.tipo }); });
            return Array.from(map.values());
        });

        setAsignadosDisponibles(prev => {
            const map = new Map(prev.map(e => [e.id, e]));
            solicitudes.forEach(s => { 
                if (s.id_asignado) map.set(s.id_asignado, { id: s.id_asignado, nombre: s.asignadoA }); 
            });
            return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
    }, [solicitudes]);
const apiFilters = useMemo(() => {
        const filters = {
            view: 'full',
            limit: PAGE_SIZE,
            offset,
            // Envíos directos basados en los nombres exactos de tus columnas
            ...(estado ? { id_estado_solicitud: Number(estado) } : {}),
            ...(tipo ? { id_tipo_solicitud: Number(tipo) } : {}),
            ...(asignadoA ? { id_personal_asignado: Number(asignadoA) } : {}),
            ...(q ? { q } : {}),
        };
            if (currentUser?.id_rol === 2) {
            // Si es Rol 2, forzamos que solo vea lo que tiene asignado
            filters.id_personal_asignado = currentUser.id_usuario;
        } else if (asignadoA) {
            // Si es Rol 3 (o cualquier otro) y seleccionó a alguien en el select
            filters.id_personal_asignado = Number(asignadoA);
        }

        if (fechaInicio) {
            // Posibles variables que tu backend podría estar esperando
            filters.fecha_inicio = fechaInicio;
            filters.fecha_creacion_gte = fechaInicio; // gte = Greater Than or Equal
            filters.fecha_creacion_desde = fechaInicio;
        }
        if (fechaFin) {
            // Añadimos 23:59:59 porque tu BD usa "timestamp with time zone"
            const finDia = `${fechaFin} 23:59:59`;
            filters.fecha_fin = finDia;
            filters.fecha_creacion_lte = finDia; // lte = Less Than or Equal
            filters.fecha_creacion_hasta = finDia;
        }

        console.log("Filtros enviados al API:", filters); // <-- ESTO ES CLAVE PARA DEBUGEAR
        return filters;
    },[PAGE_SIZE, offset, estado, tipo, asignadoA, q, fechaInicio, fechaFin]);

    // Nueva carga
    useEffect(() => {
        let cancelled = false;
        async function loadInitial() {
            setLoading(true)
            setSolicitudes([])
            setOffset(0)
            setHasMore(true)
            setError(null)
            try {
                const params = { ...apiFilters, offset: 0 }
                const data = await listSolicitudes(params)
                if (cancelled) return;
                const rows = (data ??[]).map((s, idx) => toAdminRow(s, `-0-${idx}`))
                setSolicitudes(rows)
                setOffset(PAGE_SIZE)
                setHasMore((data ??[]).length === PAGE_SIZE)
            } catch (e) {
                if (!cancelled) setError(e?.message ?? 'Error cargando solicitudes')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadInitial();
        return () => { cancelled = true }
    },[estado, tipo, asignadoA, q, fechaInicio, fechaFin, PAGE_SIZE])

    // Infinite scroll
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        if (loading || loadingMore || !hasMore || error) return

        const obs = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setLoadingMore(true)
                    const params = { ...apiFilters, offset }
                    listSolicitudes(params)
                        .then((data) => {
                            const rows = (data ??[]).map((s, idx) => toAdminRow(s, `-${offset}-${idx}`))
                            setSolicitudes((prev) => [...prev, ...rows])
                            setOffset(offset + PAGE_SIZE)
                            setHasMore((data ??[]).length === PAGE_SIZE)
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
    },[offset, hasMore, loading, loadingMore, error, apiFilters, PAGE_SIZE])

    const handleDownloadReport = () => {
        if (!solicitudes.length) {
            alert("No hay datos para exportar");
            return;
        }

        const headers =["ID", "Título", "Fecha", "Estado", "Tipo", "Estudiante", "Cédula", "Asignado A"];
        const csvRows = [headers.join(",")];

        solicitudes.forEach(row => {
            const values =[
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

    return (
        <div className="flex flex-col items-center w-full"> 
<div className="w-[90%] justify-between items-center sm:flex">
    <h1 className="text-3xl sm:text-4xl sm:font-bold text-center my-3">
        Panel Administrativo de Solicitudes
    </h1>
    <div className="flex flex-wrap gap-2 justify-center"> {/* Contenedor para los botones */}
        
        {/* BOTÓN DE BORRADO MASIVO */}
        <button
            className="btn btn-error sm:btn-sm btn-outline rounded-2xl gap-2"
            onClick={handleBorrarFiltrados}
            disabled={solicitudes.length === 0 || loading}
        >
            <IoSearchOutline size="1.2em" className="rotate-45" /> {/* Icono de basura o similar */}
            Borrar Filtrados ({solicitudes.length})
        </button>

        <button
            className="btn btn-primary sm:btn-sm btn-outline rounded-2xl gap-2"
            onClick={handleDownloadReport}
            title="Descargar reporte de solicitudes visibles (CSV)"
        >
            <IoDownloadOutline size="1.2em" />
            Exportar Reporte
        </button>
    </div>
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

            <div className="w-[90%] flex flex-col sm:flex-row sm:flex-wrap my-2 gap-2 justify-center sm:items-center">
                <select
                    className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                >
                    <option value="">Estado (Todos)</option>
                    {estadosDisponibles.map((e) => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                </select>

                <select
                    className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                >
                    <option value="">Tipo (Todos)</option>
                    {tiposDisponibles.map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                </select>
                {currentUser?.id_rol==3 && (
                    <select
                        className="select rounded-2xl w-full sm:w-auto cursor-pointer"
                        value={asignadoA}
                        onChange={(e) => setAsignadoA(e.target.value)}
                    >
                        <option value="">Asignado a (Todos)</option>
                        {asignadosDisponibles.map((a) => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                )
                }

                <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-2 rounded-2xl border border-gray-200">
                    <span className="text-sm text-gray-500 font-medium px-2">Desde:</span>
                    <input
                        type="date"
                        className="input rounded-xl w-full sm:w-auto h-10 min-h-[2.5rem]"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                    <span className="text-sm text-gray-500 font-medium px-2 hidden sm:inline">-</span>
                    <span className="text-sm text-gray-500 font-medium px-2 sm:hidden">Hasta:</span>
                    <input
                        type="date"
                        className="input rounded-xl w-full sm:w-auto h-10 min-h-[2.5rem]"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                </div>

                {hayFiltrosActivos && (
                    <button 
                        className="btn btn-ghost rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                        onClick={limpiarFiltros}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {loading && (
                <>
                    <div className="w-[90%] flex flex-col gap-3 lg:hidden">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <SolicitudAdminCard key={idx} loading />
                        ))}
                    </div>
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

            {!loading && !error && solicitudes.length === 0 && (
                <div className="w-[90%] text-center text-gray-500 py-8">
                    No hay resultados para los filtros seleccionados.
                </div>
            )}

            <div className="flex flex-col gap-3 w-[90%] lg:hidden">
                {!loading && !error && solicitudes.length > 0 && solicitudes.map((solicitud) => (
                    <SolicitudAdminCard key={solicitud.rowKey ?? solicitud.id} solicitud={solicitud} />
                ))}
            </div>
            {!loading && !error && solicitudes.length > 0 && (
                <div className="hidden lg:flex w-[90%] justify-center overflow-x-auto">
                    <SolicitudAdminTabla solicitudes={solicitudes} />
                </div>
            )}

            <div ref={sentinelRef} style={{ height: '10px', marginTop: '-10px' }} />
            {!loading && !error && loadingMore && (
                <div className="w-[90%] text-center text-gray-500 py-3">Cargando más...</div>
            )}
        </div>
    )
}
export default PanelSolicitudesAdmin

