import React from 'react'
import { Link } from 'react-router-dom'

function home() {
  return (
    <div className= 'bg-gray-100 max-w-3xl mx-auto rounded-lg shadow-xl my-8 p-6 border-none'>
        <div className=" flex justify-center mt-6">
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
}

export default home