import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { EventProvider } from "./context/EventContext";
import { ToastProvider } from "./context/ToastContext";

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <EventProvider>
          <RouterProvider router={router}/>
        </EventProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
export default App;