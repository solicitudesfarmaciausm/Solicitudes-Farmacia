import { FaPaperclip, FaRegFileAlt } from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { RiDeleteBin6Line } from "react-icons/ri"
import { Link } from "react-router"

const SolicitudModal = () => {
    return (
<dialog id="solicitudModal" className="modal">
  <div className="modal-box w-full h-full sm:h-auto p-0 relative flex flex-col sm:my-2">
    <div className="w-full border-b-2 border-gray-100 p-4 flex items-center gap-4 relative">
      <h3 className="text-lg font-extrabold sm:font-bold">Crear Nueva Solicitud</h3>
      <button className="btn  btn-circle btn-ghost absolute right-4" onClick={() => document.getElementById('solicitudModal').close()}>
        <IoClose size="1.5em"/>
      </button>
    </div>
    <div className="modal-body p-4 flex flex-col gap-4 w-full pt-2 flex-1 ">
      <label htmlFor="titulo">Título</label>
      <input type="text" placeholder="Ingrese el título de la solicitud" className="input rounded-2xl w-full" id="titulo" name="titulo"/>
      <label htmlFor="tipo">Tipo de Solicitud</label>
      <select className="select rounded-2xl w-full" id="tipo" name="tipo">
        <option disabled defaultValue>Escoge un tipo de solicitud</option>
        <option>Administrativa</option>
        <option>Financiera</option>
        <option>Académica</option>
        <option>Documentación</option>
      </select>
      <label htmlFor="descripcion">Descripción</label>
      <textarea className="textarea rounded-2xl w-full" placeholder="Ingrese la descripción de la solicitud" id="descripcion" name="descripcion"></textarea>
      <button className="btn border-dashed border-gray-300">
        <FaPaperclip size="1.2em" className="inline mr-2"/>
        {"Adjuntar Archivo (Opcional)"}
      </button>
      <div className="flex border-2 border-gray-200 rounded-2xl p-3 relative items-center">
        <FaRegFileAlt size="1.5em" className="inline mr-2"/>
        <p>Archivo.pdf</p>
        <button className="btn absolute right-3 btn-circle border-none  hover:text-red-600 ">

          <RiDeleteBin6Line size="1.5em"/>
        </button>
      </div>
      
    </div>

    <div className="modal-action w-full">
      <form method="dialog" className="flex justify-center items-center w-full gap-2 py-2 px-4 border-t-gray-100 border-t-2">
        <button className="btn rounded-full w-1/2">Cancelar</button>
        <Link to="/solicitudes/1" className="btn bg-blue-900 text-white rounded-full w-1/2">Crear Solicitud</Link>

      </form>
    </div>
  </div>
</dialog>
    )
}

export default SolicitudModal