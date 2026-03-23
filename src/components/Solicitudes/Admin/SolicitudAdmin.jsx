import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'

import { FaRegFileAlt } from 'react-icons/fa'
import { MdOutlineFileDownload } from 'react-icons/md'

import { getSolicitud, getSolicitudArchivos, getSolicitudComentarios, getSolicitudHistorial, updateSolicitud, createSolicitudComentario } from '../../../api/solicitudes.js'
import { getUsuarios } from '../../../api/usuarios.js'
import { getUser } from '../../../auth/session.js'

const formatFecha = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleDateString()
}

const formatFechaHora = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleString()
}

const estadoBadgeClass = (estado) => {
    const e = (estado ?? '').toString().trim().toLowerCase()
    if (e === 'aprobada' || e === 'aprobado') return 'badge-success border-success'
    if (e === 'rechazada' || e === 'rechazado') return 'badge-error border-error'
    if (e === 'en revisión' || e === 'en revision') return 'badge-warning border-warning'
    return 'badge-info border-info'
}

const fullName = (u) => {
    if (!u) return 'Usuario'
    const name = [u.nombre, u.apellido].filter(Boolean).join(' ')
    return name || u.correo_electronico || `Usuario ${u.id_usuario ?? ''}`
}

// Map Names to IDs (Approximation based on standard usage, verify with DB if possible)
const ESTADOS = [
    { id: 1, nombre: 'Enviada' },
    { id: 2, nombre: 'En proceso' },
    { id: 3, nombre: 'Aprobada' },
    { id: 4, nombre: 'Rechazada' },
]

const SolicitudAdmin = () => {
    const { id } = useParams()
    const idSolicitud = useMemo(() => {
        const n = Number.parseInt(id, 10)
        return Number.isFinite(n) ? n : null
    }, [id])

    const [solicitud, setSolicitud] = useState(null)
    const [archivos, setArchivos] = useState([])
    const [comentarios, setComentarios] = useState([])
    const [historial, setHistorial] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [admins, setAdmins] = useState([])
    const [newComment, setNewComment] = useState('')

    const currentUser = getUser()
    const canAssign = currentUser?.id_rol !== 1 && currentUser?.id_rol !== 2

    const loadData = async () => {
        if (!idSolicitud) {
            setError('ID de solicitud inválido')
            setLoading(false)
            return
        }

        try {
            // Only set loading on first load or critical updates
            // setLoading(true) 
            setError(null)
            const [s, a, c, h] = await Promise.all([
                getSolicitud(idSolicitud, { view: 'full' }),
                getSolicitudArchivos(idSolicitud, { limit: 100, offset: 0, signed: true }),
                getSolicitudComentarios(idSolicitud, { limit: 100, offset: 0 }),
                getSolicitudHistorial(idSolicitud, { limit: 100, offset: 0 }),
            ])
            setSolicitud(s)
            setArchivos(a ?? [])
            setComentarios(c ?? [])
            setHistorial(h ?? [])
        } catch (e) {
            setError(e?.message ?? 'Error cargando la solicitud')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (canAssign) {
            getUsuarios({ id_rol: 2, limit: 100 })
                .then((data) => setAdmins(data || []))
                .catch((err) => console.error('Error cargando administradores', err))
        }
    }, [canAssign])

    useEffect(() => {
        setLoading(true)
        loadData()
    }, [idSolicitud])

    const handleEstadoChange = async (e) => {
        const id_estado_solicitud = Number(e.target.value)
        if (!id_estado_solicitud) return

        try {
            await updateSolicitud(idSolicitud, { id_estado_solicitud })
            await loadData()
        } catch (err) {
            alert('Error actualizando estado: ' + err.message)
        }
    }

    const handleAsignadoChange = async (e) => {
        const val = e.target.value
        const id_personal_asignado = val ? Number(val) : null

        try {
            await updateSolicitud(idSolicitud, { id_personal_asignado })
            await loadData()
        } catch (err) {
            alert('Error asignando personal: ' + err.message)
        }
    }

    const handlePostComentario = async () => {
        if (!newComment.trim()) return
        try {
            await createSolicitudComentario(idSolicitud, newComment)
            setNewComment('')
            await loadData()
        } catch (err) {
            alert('Error publicando comentario: ' + err.message)
        }
    }

    return (<div className="flex flex-col justify-center items-center w-full">
        <h3 className="text-xl font-bold text-center">Detalles de la solicitud</h3>
        <div className="divider w-[90%] md:w-[50%] self-center my-1"></div>
        <div className=" flex-col w-[90%] md:w-[50%] items-center justify-center flex ">
            {loading && (
                <>
                    <div className="skeleton h-8 w-3/4"></div>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="w-full flex flex-col gap-3">
                        <div className="skeleton h-5 w-2/3"></div>
                        <div className="skeleton h-5 w-2/3"></div>
                        <div className="flex items-center justify-start w-full">
                            <div className="skeleton h-5 w-32"></div>
                            <div className="ml-10 skeleton h-6 w-28 rounded-full"></div>
                        </div>
                        <div className="skeleton h-24 w-full"></div>
                    </div>
                </>
            )}

            {!loading && error && <div className="text-red-600 w-full">{error}</div>}

            {!loading && !error && solicitud && (
                <>
                    <h1 className="text-2xl font-extrabold">{solicitud.titulo}</h1>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="flex items-center justify-start w-full" >
                        <p className="w-40">Estudiante</p>
                        <h2 className=" text-lg ml-10">{fullName(solicitud.estudiante)}</h2>
                    </div>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="flex items-center justify-start  w-full"  >
                        <p className="w-40">Cédula</p>
                        <h2 className=" text-lg ml-10">V-{solicitud.estudiante?.cedula ?? ''}</h2>
                    </div>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="flex items-center justify-start w-full"  >

                        <h2 className="w-40">Estado Actual</h2>
                        <div className={`badge badge-soft ml-10 ${estadoBadgeClass(solicitud.estado?.nombre)} border `}>
                            {solicitud.estado?.nombre}
                        </div>
                    </div>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="flex items-center justify-start w-full"  >
                        <p className="w-40">Tipo de Solicitud</p>
                        <h2 className=" text-lg ml-10">{solicitud.tipo?.nombre ?? solicitud.id_tipo_solicitud}</h2>
                    </div>
                    <div className="divider w-full self-center my-1"></div>
                    <div className="flex items-center justify-start w-full"  >
                        <p className="w-40">Fecha de Envío</p>
                        <h2 className=" text-lg ml-10">{formatFecha(solicitud.fecha_creacion)}</h2>
                    </div>
                    <div className="divider w-full self-center my-1"></div>

                    <p className="mt-5">{solicitud.descripcion}</p>
                    <h2 className="font-extrabold text-xl self-start my-3">Archivos Adjuntos</h2>
                    <div className="flex flex-col w-full gap-2">
                        {archivos.length === 0 && (
                            <div className="text-gray-500 text-sm">Sin archivos adjuntos.</div>
                        )}
                        {archivos.map((a) => {
                            const href = a.signed_url || a.url || a.ruta_archivo
                            return (
                                <a
                                    key={a.id_archivo}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-gray-400 p-2 px-3 flex items-center relative"
                                >
                                    <FaRegFileAlt size="1.2em" className="inline mr-2" />
                                    {a.nombre_archivo}
                                    <MdOutlineFileDownload size="1.2em" className="inline mr-2 cursor-pointer right-2 absolute" />
                                </a>
                            )
                        })}

                        <h2 className="font-extrabold text-xl self-start my-3">Acciones</h2>
                        <label htmlFor="estado">Estado</label>
                        <select 
                            className="select rounded-2xl w-auto cursor-pointer" 
                            id="estado" 
                            name="estado"
                            value={solicitud.estado?.id_estado_solicitud ?? solicitud.id_estado_solicitud ?? ''}
                            onChange={handleEstadoChange}
                        >
                             <option value="" disabled hidden>Seleccionar estado</option>
                             {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>

                        {canAssign && (
                            <>
                                <label htmlFor="asignadoA">Asignar a</label>
                                <select 
                                    className="select rounded-2xl w-auto cursor-pointer" 
                                    id="asignadoA" 
                                    name="asignadoA" 
                                    value={solicitud.personal_asignado?.id_usuario ?? solicitud.id_personal_asignado ?? ''}
                                    onChange={handleAsignadoChange}
                                >
                                    <option value="" disabled hidden>Seleccionar administrador</option>
                                    {admins.map((u) => (
                                        <option key={u.id_usuario} value={u.id_usuario}>{fullName(u)}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        <h2 className="font-extrabold text-xl self-start my-3">Historial de Comentarios</h2>
                        <div className="flex flex-col w-full gap-4">
                            {comentarios.length === 0 && (
                                <div className="text-gray-500 text-sm">Sin comentarios.</div>
                            )}
                            {comentarios.map((c) => {
                                const myUserIdRaw = localStorage.getItem('id_usuario')
                                const myUserId = myUserIdRaw ? Number.parseInt(myUserIdRaw, 10) : null
                                const isMine = myUserId && c.id_usuario === myUserId
                                return (
                                    <div key={c.id_comentario} className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
                                        <div className="chat-header">
                                            {fullName(c.usuario)}
                                            <time className="text-xs opacity-50 ml-2">{formatFechaHora(c.fecha_creacion)}</time>
                                        </div>
                                        <div className={`chat-bubble ${isMine ? 'bg-green-300 rounded-br-none' : 'bg-blue-300 rounded-bl-none'} rounded-2xl`}>{c.comentario}</div>
                                    </div>
                                )
                            })}
                        </div>

                <h2 className="font-extrabold text-xl self-start my-3">Historial de Cambios</h2>
                <div className="flex flex-col w-full gap-2 text-sm text-gray-500">
                    {historial.length === 0 && (
                        <div className="text-gray-500 text-sm">Sin historial.</div>
                    )}
                    {historial.map((h) => (
                        <div key={h.id_historial} className="p-2 border-l-2 border-gray-300">
                            <p>
                                <strong>{fullName(h.usuario)}</strong>{' '}
                                <span className="font-semibold">{h.accion}</span>: {h.descripcion}
                            </p>
                            <time className="text-xs opacity-70">{formatFechaHora(h.fecha_evento)}</time>
                        </div>
                    ))}
                        </div>

                        <h2 className="font-extrabold text-xl self-start my-3">Añadir Comentario</h2>
                        <textarea 
                            className="textarea w-full" 
                            placeholder="Agregar comentario..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        >
                        </textarea>
                        <button 
                            className="btn bg-blue-800 text-white rounded-full mt-3 self-end w-full"
                            onClick={handlePostComentario}
                        >
                            Publicar Comentario
                        </button>
                    </div>
                </>
            )}

        </div>

    </div>
    )
}

export default SolicitudAdmin
