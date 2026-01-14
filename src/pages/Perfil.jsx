import { MdOutlineVisibility } from "react-icons/md"

const Perfil = ()=>{
    return (
        <div className="w-full h-full sm:w-[50%] flex flex-col items-center justify-center p-4 gap-3">
            <h2 className="font-bold w-full text-center my-4 text-3xl sm:text-4xl">Mi Perfil</h2>
                <label htmlFor="correo" className="self-start ml-2">Correo Electrónico</label>
                <label className="input validator rounded-2xl w-full">
        
                  <input type="text" id="correo" placeholder="Correo" pattern="/\d{8}/" required minlength="8"/>
                </label>
        
                <label htmlFor="telefono" className="self-start ml-2">Teléfono</label>
                <label className="input validator rounded-2xl w-full">
        
                  <input type="text" id="telefono" placeholder="Teléfono" pattern="/\d{8}/" required minlength="8"/>
                </label>
                
        
                <label htmlFor="password" className="self-start ml-2">Contraseña</label>
                <label className="input validator rounded-2xl w-full">
        
        
                  <input
                    type="password"
                    required
                    id="password"
                    placeholder="Contraseña"
                    minlength="8"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
                  />
                  <MdOutlineVisibility size="1.5em"/>
        
                </label>
                    <p className="validator-hint hidden">
                      La contraseña deben ser más de 8 caractéres, incluyendo:
                      <br />Al menos un número <br />Al menos una mayúscula <br />Al menos una minúscula
                    </p>
                    <label htmlFor="password" className="self-start ml-2">Verificar Contraseña</label>
                <label className="input validator rounded-2xl w-full">
        
        
                  <input
                    type="password"
                    required
                    id="password"
                    placeholder="Verifique su contraseña"
                    minlength="8"
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Deben ser más de 8 caractéres, incluyendo un número, una mayúscula y una minúscula"
                  />
                  <MdOutlineVisibility size="1.5em"/>
                </label>
                    <p className="validator-hint hidden">
                      La contraseña deben ser más de 8 caractéres, incluyendo:
                      <br />Al menos un número <br />Al menos una mayúscula <br />Al menos una minúscula
                    </p>
                <button className="btn bg-blue-900 text-white rounded-2xl w-full my-3">Actualizar Datos</button>
        </div>
    )
}
export default Perfil