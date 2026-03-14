import { FaPaperclip, FaRegFileAlt } from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { RiDeleteBin6Line } from "react-icons/ri"
import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { createSolicitud, uploadSolicitudArchivos } from "../../../api/solicitudes.js"

const TIPOS = [
  { id: 1, label: "Administrativa" },
  { id: 2, label: "Financiera" },
  { id: 3, label: "Académica" },
  { id: 4, label: "Prácticas" },
]

const SolicitudModal = () => {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [titulo, setTitulo] = useState("")
    const [tipoId, setTipoId] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const closeModal = () => document.getElementById('solicitudModal')?.close()

    const reset = () => {
      setTitulo("")
      setTipoId("")
      setDescripcion("")
      setFiles([])
      setError("")
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }

    async function handleSubmit(e) {
      e.preventDefault()
      if (loading) return

      setError("")
      const tituloTrim = titulo.trim()
      const descripcionTrim = descripcion.trim()
      const tipoNumero = Number.parseInt(String(tipoId), 10)

      if (!tituloTrim) return setError("Debes ingresar un título")
      if (!descripcionTrim) return setError("Debes ingresar una descripción")
      if (!Number.isFinite(tipoNumero)) return setError("Debes escoger un tipo de solicitud")

      setLoading(true)
      try {
        const created = await createSolicitud({
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          id_tipo_solicitud: tipoNumero,
        })

        const idSolicitud = created?.id_solicitud
        if (!idSolicitud) throw new Error("No se pudo crear la solicitud")

        if (files.length > 0) {
          await uploadSolicitudArchivos(idSolicitud, files)
        }

        closeModal()
        reset()
        navigate(`/solicitud/${idSolicitud}`)
      } catch (err) {
        setError(err?.message || "No se pudo crear la solicitud")
      } finally {
        setLoading(false)
      }
    }

    return (
<dialog id="solicitudModal" className="modal">
  <div className="modal-box w-full h-full sm:h-auto p-0 relative flex flex-col sm:my-2">
    <div className="w-full border-b-2 border-gray-100 p-4 flex items-center gap-4 relative">
      <h3 className="text-lg font-extrabold sm:font-bold">Crear Nueva Solicitud</h3>
      <button className="btn  btn-circle btn-ghost absolute right-4" onClick={() => { closeModal(); reset(); }}>
        <IoClose size="1.5em"/>
      </button>
    </div>
    <form className="modal-body p-4 flex flex-col gap-4 w-full pt-2 flex-1" onSubmit={handleSubmit}>
      <label htmlFor="titulo">Título</label>
      <input
        type="text"
        placeholder="Ingrese el título de la solicitud"
        className="input rounded-2xl w-full"
        id="titulo"
        name="titulo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />
      <label htmlFor="tipo">Tipo de Solicitud</label>
      <select
        className="select rounded-2xl w-full"
        id="tipo"
        name="tipo"
        value={tipoId}
        onChange={(e) => setTipoId(e.target.value)}
        required
      >
        <option value="" disabled>Escoge un tipo de solicitud</option>
        {TIPOS.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <label htmlFor="descripcion">Descripción</label>
      <textarea
        className="textarea rounded-2xl w-full"
        placeholder="Ingrese la descripción de la solicitud"
        id="descripcion"
        name="descripcion"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
      ></textarea>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          const next = Array.from(e.target.files ?? [])
          if (next.length === 0) return
          setFiles((prev) => {
            const existing = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`))
            const unique = next.filter((f) => !existing.has(`${f.name}-${f.size}-${f.lastModified}`))
            return [...prev, ...unique]
          })
        }}
      />

      <button
        type="button"
        className="btn border-dashed border-gray-300"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        <FaPaperclip size="1.2em" className="inline mr-2"/>
        {"Adjuntar Archivo (Opcional)"}
      </button>

      {files.map((f, idx) => (
        <div key={`${f.name}-${f.size}-${f.lastModified}-${idx}`} className="flex border-2 border-gray-200 rounded-2xl p-3 relative items-center">
          <FaRegFileAlt size="1.5em" className="inline mr-2"/>
          <p className="pr-12 break-all">{f.name}</p>
          <button
            type="button"
            className="btn absolute right-3 btn-circle border-none hover:text-red-600"
            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
            disabled={loading}
            aria-label={`Eliminar ${f.name}`}
          >
            <RiDeleteBin6Line size="1.5em"/>
          </button>
        </div>
      ))}

      {error ? (
        <p className="text-sm text-error w-full text-left">{error}</p>
      ) : null}
      
      <div className="modal-action w-full">
        <div className="flex justify-center items-center w-full gap-2 py-2 px-4 border-t-gray-100 border-t-2">
          <button
            type="button"
            className="btn rounded-full w-1/2"
            onClick={() => { closeModal(); reset(); }}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn bg-blue-900 text-white rounded-full w-1/2"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Solicitud"}
          </button>
        </div>
      </div>
    </form>
  </div>
</dialog>
    )
}

export default SolicitudModal