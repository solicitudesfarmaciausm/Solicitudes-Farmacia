import { useNavigate } from "react-router"
import { clearSession } from "../auth/session.js"

const LogOutModal = () => {
    const navigate = useNavigate()

    function handleLogout() {
      clearSession()
      navigate("/login", { replace: true })
    }

    return (
    <dialog id="my_modal_1" class="modal">
  <div class="modal-box text-center rounded-3xl p-10">
    <h3 class="text-xl font-extrabold">Confirmar Cierre de Sesión</h3>
    <p class="py-4 text-slate-600">¿Estás seguro de que quieres salir?</p>
    <div class="modal-action">
      <form method="dialog" className="flex flex-col-reverse sm:flex-row w-full justify-center items-center gap-4">
        <button className="btn w-full sm:w-1/2 rounded-3xl py-5">Cancelar</button>
        <button
          type="submit"
          onClick={handleLogout}
          className="btn btn-error w-full sm:w-1/2 text-white rounded-3xl py-5"
        >
          Cerrar Sesión
        </button>
      </form>
    </div>
  </div>
</dialog>
    )
}
export default LogOutModal