const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Calcular rango de páginas a mostrar (máximo 5)
    const pageRange = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Ajustar el rango para mostrar siempre 5 páginas si es posible
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageRange.push(i);
    }

    return (
        <div className="flex items-center justify-center mt-4 space-x-1">
            {/* Botón Primera Página */}
            <button 
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                    currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
                &laquo;
            </button>
            
            {/* Botón Anterior */}
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                    currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
                &lsaquo;
            </button>
            
            {/* Números de páginas */}
            {pageRange.map(page => (
                <button 
                    key={page} 
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 rounded ${
                        currentPage === page 
                            ? 'bg-indigo-500 text-white' 
                            : 'text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {page}
                </button>
            ))}
            
            {/* Botón Siguiente */}
            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                    currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
                &rsaquo;
            </button>
            
            {/* Botón Última Página */}
            <button 
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                    currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
                &raquo;
            </button>
        </div>
    );
};

export default Pagination;