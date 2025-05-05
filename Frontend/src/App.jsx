import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { EventProvider } from "./context/EventContext";

const App = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <RouterProvider router={router}/>
      </EventProvider>
    </AuthProvider>
  );
}
export default App;