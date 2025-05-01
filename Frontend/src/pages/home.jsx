import React from 'react'
import { Link } from 'react-router-dom'

function home() {
    //token inicio de sesion

    const token = localStorage.getItem("token") || null;
    return (
        token ? (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Mis Eventos</h2>
                        <Link
                            to="/create-event"
                            className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-4 py-2 
                                       rounded-full hover:scale-105 transition duration-300 ease-in-out"
                        >
                            Crear Evento
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="relative w-64">
                            <select
                                // value={filter}
                                //onChange={handleFilterChange}
                                className="block appearance-none w-full bg-white border border-gray-300 
                                        hover:border-gray-400 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                        focus:ring-indigo-300 focus:border-indigo-300"
                            >
                                <option value="proximos">📅 Próximos eventos</option>
                                <option value="pasados">📅 Eventos pasados</option>
                                <option value="borradores">🗒️ Borradores</option>
                                <option value="organizados">👑 Organizados por mí</option>
                                <option value="confirmados">✅ Confirmados</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Aquí irá el listado de eventos según el filtro */}
                        <div className="mt-6">
                            {/* Ejemplo de placeholder para eventos */}
                            <div className="border-b border-gray-200 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600">Aquí se mostrarán los eventos según el filtro seleccionado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        ) : (
            <div className='bg-gray-100 max-w-3xl mx-auto rounded-lg shadow-xl my-8 p-6 border-none'>
                <div className="flex justify-center mt-6">
                    <img src="../public/images/logo.png" alt="logo web" className="max-w-40" />
                </div>
                <h1 className="text-5xl font-bold text-center mt-2">
                    INVITACIONES
                </h1>
                <p className="text-xl text-center mt-4">Da vida a invitaciones tan únicas como los momentos que celebras.</p>

                <section className="mt-8 flex justify-center">
                    <Link to="/login" className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-9 py-2 
                                             rounded-full hover:scale-107 transition duration-300 ease-in-out">
                        Iniciar sesión
                    </Link>
                </section>
            </div>
        )
    )
}

export default home