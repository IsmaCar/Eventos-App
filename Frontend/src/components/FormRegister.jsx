import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function RegisterForm () { 
    const [formData, setFormData] = useState({
            username: '',
            email: '',
            password: '',
        })
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

        //Función para manejar el cambio de los inputs
        const handleChange = (e) => {
            const nombre = e.target.name;

            setFormData({...formData, [nombre]: e.target.value})
        }

        //Función para manejar el submit del formulario
        // Se encarga de validar los datos y llamar a la función registerUser
        const handleSubmit = async (e) => {
            e.preventDefault()
            setError('')
            setLoading(true)
            try {
                if(!formData.username || !formData.email || !formData.password) {
                    setError('Todos los campos son obligatorios')
                    return
                }

                const result = await registerUser(formData)
                console.log(result)

                if(result) {
                    navigate('/login')
                } else {
                    setError('Error al registrarse')
                }
               
            } catch (error) {
                console.log('Error al registrarse;', error)

                if (error.response && error.response.data) {
                    setError(error.response.data.error || 'Error del servidor');
                } else {
                    setError('Error al conectar con el servidor');
                }
            }finally {
                setLoading(false)
            }
        }

    return (
        <div className='max-w-md mx-auto my-10 p-5 bg-white rounded-lg shadow-lg'>
        <h2 className='text-2xl font-semibold text-center text-gray-800'>REGISTRARSE</h2>

        {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mb-4">
                    {error}
                </div>
            )}

        <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
            <label
            htmlFor="text"
            className="block text-xl font-semibold text-gray-900"
          >
            Nombre de usuario
          </label>                
          <input type="text" 
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 text-lg text-gray-900 border 
                                border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
            </div>
            <div>
            <label
            htmlFor="email"
            className="block text-xl font-semibold text-gray-900"
          >
            Correo Electrónico
          </label>                <input type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 text-lg text-gray-900 border 
                                border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
            </div>
            <div>
            <label
            htmlFor="password"
            className="block text-xl font-semibold text-gray-900"
          >
            Contraseña
          </label>                
          <input type="password" 
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 text-lg text-gray-900 border 
                                border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
            </div>
            <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-gradient-to-r from-fuchsia-400 to-indigo-400 rounded-lg hover:scale-105 transition duration-300"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Registrando...</span>
            </div>
          ) : (
            'Registrarse'
          )}
        </button>
        </form>
        </div>
    )
}

export default RegisterForm;