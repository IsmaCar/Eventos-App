import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import ErrorPage from "../pages/ErrorPage";
import Home from "../pages/home";
import FormLogin from "../components/FormLogin";
import RegisterLogin from "../components/FormRegister";
import FormCreateEvent from "../components/FormCreateEvent";
import CardDetail from "../pages/CardDetail";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import EditProfile from "../pages/EditProfile";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Home/>,
            },
            {
                path: "register",
                element: <RegisterLogin/>,
            },
            {
                path: "login",
                element: <FormLogin/>,
            },
            {
                path: "create-event",
                element: 
                <ProtectedRoute>
                    <FormCreateEvent/>,
                </ProtectedRoute>
            },
            {
                path: "event/:id",
                element: 
                <ProtectedRoute>
                    <CardDetail/>,
                </ProtectedRoute>
            },
            {
                path: "profile",
                element: 
                <ProtectedRoute>
                    <Profile/>,
                </ProtectedRoute>
            },
            {
                path: "edit-profile",
                element:
                <ProtectedRoute>
                    <EditProfile/>,
                </ProtectedRoute>
            }
        ],
    }
]);