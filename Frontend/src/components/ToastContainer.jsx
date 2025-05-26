/**
* Componente contenedor de notificaciones
*
* Representa todas las notificaciones activas en una posición fija en la pantalla
* Gestiona la posición y el apilamiento de múltiples notificaciones
*/
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm sm:max-w-md w-full pointer-events-none">
      <div className="space-y-3 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={onRemove}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
